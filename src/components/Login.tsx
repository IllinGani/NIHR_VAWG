import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, AlertCircle, Mail, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { auth, db, firebaseConfig } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { handleSecureRegister } from '../services/auth';

export const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  useEffect(() => {
    const sessionErr = sessionStorage.getItem('auth_error');
    if (sessionErr) {
      setError(sessionErr);
      sessionStorage.removeItem('auth_error');
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to receive a password reset link.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset link sent! Please check your email inbox.');
      setIsForgotPassword(false);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      if (isRegistering) {
        await handleSecureRegister(email, password);
        setSuccessMessage('Your account request has been successfully submitted! Admin approval is required before you can access the dashboard.');
      } else {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          try {
            await deleteDoc(doc(db, 'deleted_users', email.toLowerCase().trim()));
            console.log('Cleared deleted_users blacklist entry on manual login.');
          } catch (clearErr) {
            console.log('No blacklist entry existed or could not clear:', clearErr);
          }
        } catch (signInErr: any) {
          console.log('SignIn failed, checking pre-approved:', signInErr.code);
          // If sign in fails, check if there's a pre-approved account with this password in Firestore
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            const q = query(
              collection(db, 'users'), 
              where('email', '==', email.toLowerCase()),
              where('isPreApproved', '==', true)
            );
            
            let querySnapshot;
            try {
              querySnapshot = await getDocs(q);
            } catch (queryErr: any) {
              console.warn('Could not query pre-approved user status:', queryErr);
              // Fallback to original sign in error if query cannot run
              throw signInErr;
            }
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const userData = userDoc.data();
              
              if (userData.password && userData.password === password) {
                try {
                  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                  const newUid = userCredential.user.uid;
                  
                  const newUserDocRef = doc(db, 'users', newUid);
                  await setDoc(newUserDocRef, {
                    ...userData,
                    uid: newUid,
                    id: newUid,
                    isPreApproved: false
                  });
                  
                  if (userDoc.id !== newUid) {
                    await deleteDoc(userDoc.ref);
                  }
                  return;
                } catch (provisionErr: any) {
                  console.error('Provisioning error:', provisionErr);
                  if (provisionErr.code === 'auth/email-already-in-use' || provisionErr.message?.includes('already-in-use')) {
                    throw new Error('This account already exists in Firebase Auth. If you previously registered, please sign in with your email and password. If you forgot your password, please use the "Forgot password?" link below.');
                  }
                  throw new Error(`Authentication succeeded but profile setup failed: ${provisionErr.message}`);
                }
              }
            }
          }
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      let friendlyError = err.message || 'Authentication failed';
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = `The email address "${email}" is already registered in our authentication database. If you previously registered or your profile was deleted/rejected from the workspace list, please click "Already have an account? Sign In" below and log in. Signing in will automatically recreate and resubmit your profile details for manual approval so you show up in User Management again. If you forgot your password, please reset it below.`;
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyError = `Email/Password Authentication is not enabled for this dynamic Firebase project yet. Because you recently linked a new Firebase project (${firebaseConfig.projectId}), the Administrator must enable the "Email/Password" sign-in method in the Firebase Console: Go to Authentication -> Sign-in Method -> Click "Add new provider" -> Choose "Email/Password" -> Enable and save.`;
      } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        friendlyError = `Authentication Configuration Missing: The requested sign-in method is not enabled for this dynamic Firebase project (${firebaseConfig.projectId}) yet. The Administrator must enable it in the Firebase Console: Go to Authentication -> Sign-in Method -> Add "Email/Password" as provider -> Enable and save.`;
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        friendlyError = `The domain "${window.location.hostname}" is not authorized for authentication in your Firebase project (${firebaseConfig.projectId}). The Administrator must add "${window.location.hostname}" to the Authorized Domains list in the Firebase Console: Go to Authentication -> Settings -> Click "Authorized domains" tab -> Click "Add domain" -> Type in "${window.location.hostname}" -> Click "Add".`;
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        friendlyError = 'Invalid email address or password. Please double-check your credentials and try again. If you forgot your password, please use the "Forgot password? Reset it here" link below.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'The password is too weak. It must be at least 6 characters long.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'Please enter a valid email address.';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex lg:grid lg:grid-cols-2 bg-white selection:bg-brand-orange/10">
      {/* Left Branding Section */}
      <div className="hidden lg:flex flex-col justify-center px-16 xl:px-24 bg-white border-r border-slate-100 relative overflow-hidden">
        {/* Background Accents & Bubbles - START-UP VIBE */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          {/* Vibrant Gradients for 80% color coverage */}
          <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] rounded-full bg-brand-navy/[0.08] blur-[100px]" />
          <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-brand-blue/[0.05] blur-[120px]" />
          <div className="absolute bottom-[-15%] left-[10%] w-[50%] h-[50%] rounded-full bg-brand-orange/[0.08] blur-[90px]" />
          
          {/* Dynamic Floating Bubbles */}
          <div className="absolute top-[12%] right-[12%]">
            <motion.div 
              animate={{ 
                y: [0, -25, 0],
                x: [0, 15, 0],
                scale: [1, 1.1, 1]
              }} 
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} 
              className="w-24 h-24 rounded-3xl bg-brand-navy shadow-2xl shadow-brand-navy/20 rotate-12 flex items-center justify-center"
            >
               <div className="w-12 h-12 rounded-full bg-brand-blue/20 blur-xl" />
            </motion.div>
          </div>

          <div className="absolute bottom-[15%] left-[8%] flex gap-4">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0]
              }} 
              transition={{ duration: 8, repeat: Infinity }} 
              className="w-16 h-16 rounded-full bg-brand-blue shadow-xl shadow-brand-blue/20" 
            />
            <motion.div 
              animate={{ y: [0, 15, 0] }} 
              transition={{ duration: 4, repeat: Infinity, delay: 1 }} 
              className="w-10 h-10 rounded-2xl bg-brand-orange/80 mt-8" 
            />
          </div>

          {/* Overlapping Glassmorphism Shapes */}
          <div className="absolute top-[40%] left-[-5%]">
            <motion.div 
              animate={{ x: [-20, 20, -20] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="w-48 h-48 rounded-full bg-slate-100/30 backdrop-blur-sm border border-white/20"
            />
          </div>

          <div className="absolute top-[10%] left-[20%] opacity-40">
            <motion.div 
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="w-4 h-4 rounded-full bg-brand-navy"
            />
          </div>
          
          {/* Animated Mesh Points */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.6 }}
              animate={{ 
                opacity: [0.4, 0.9, 0.4],
                scale: [1, 1.3, 1],
                y: [0, Math.random() * 40 - 20, 0]
              }}
              transition={{ 
                duration: 3 + Math.random() * 5, 
                repeat: Infinity,
                delay: i * 0.2
              }}
              className={`absolute rounded-full ${[
                'bg-brand-navy', 
                'bg-brand-blue', 
                'bg-brand-orange',
                'bg-slate-400'
              ][i % 4]}`}
              style={{
                width: Math.random() * 8 + 6 + 'px',
                height: Math.random() * 8 + 6 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                filter: 'blur(1px)'
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="mb-8">
            <span className="text-6xl xl:text-7xl font-black tracking-tighter text-brand-navy">
              NIHR
            </span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
            Global Health Group <br />
            <span className="text-brand-orange">Preventing VAW/VAC</span>
          </h2>
          <p className="text-lg xl:text-xl text-slate-500 mt-6 leading-relaxed max-w-md">
            Operational Dashboard & Research Management.
          </p>
          
        </motion.div>
      </div>

      {/* Right Login Section */}
      <div className="w-full flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden text-center mb-10">
            <div className="mb-4 flex justify-center">
              <span className="text-4xl font-black tracking-tighter text-brand-navy">
                NIHR
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Preventing VAW/VAC</h1>
          </div>

          <div className="mb-10 hidden lg:block">
            <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Access your research dashboard</p>
          </div>

          <div className="space-y-6">
            {isForgotPassword ? (
              <motion.form 
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handlePasswordReset} 
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-950 mb-1">Reset Password</h2>
                  <p className="text-sm text-slate-500 mb-5">Enter your institutional email to receive a password reset link.</p>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-orange transition-colors" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange outline-none transition-all text-slate-900"
                      placeholder="username@bham.ac.uk"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-900/10 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                  {!loading && <ArrowRight size={20} />}
                </button>

                <div className="flex flex-col gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-sm text-brand-orange hover:text-orange-700 font-bold transition-colors text-left"
                  >
                    Back to Sign In
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleEmailAuth} 
                className="space-y-5"
              >
                <div className="text-xs bg-slate-50 border border-slate-100 p-5 rounded-2xl leading-relaxed text-slate-600 shadow-sm flex flex-col gap-3">
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-2">Authorized Login Pathways</span>
                    <ol className="space-y-1 text-slate-700 list-decimal pl-4 font-semibold">
                      <li>Sign In to an existing account</li>
                      <li>Create an account and request access</li>
                      <li>if not reset password</li>
                    </ol>
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1.5">
                    <div>
                      <span className="font-bold text-slate-900">Checking On an Existing Request?</span> If you previously registered but your profile is not visible under User Management or you receive an "already registered" warning, toggle to <span className="text-brand-orange font-bold">Sign In</span> below. Logging in automatically rebuilds and resubmits your profile for Co-Director manual approval.
                    </div>
                    <div>
                      <span className="text-brand-orange font-bold">Important:</span> Even previously deleted accounts should make a new account and request access.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-orange transition-colors" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange outline-none transition-all text-slate-900"
                      placeholder="username@bham.ac.uk"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-orange transition-colors" size={20} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange outline-none transition-all text-slate-900"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-900/10 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? 'Authenticating...' : isRegistering ? 'Create Account' : 'Sign In'}
                  {!loading && <ArrowRight size={20} />}
                </button>

                <div className="flex flex-col gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-sm text-brand-orange hover:text-orange-700 font-bold transition-colors text-left"
                  >
                    {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Request access'}
                  </button>
                  
                  {!isRegistering && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="text-sm text-slate-500 hover:text-brand-orange font-semibold transition-colors text-left mt-1"
                    >
                      Forgot password? Reset it here
                    </button>
                  )}
                </div>
              </motion.form>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <span className="text-sm leading-relaxed">{error}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100"
              >
                <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                <span className="text-sm leading-relaxed">{successMessage}</span>
              </motion.div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
              NIHR GLOBAL HEALTH GROUP • PREVENTING VAW/VAC • INTERNAL USE ONLY
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
