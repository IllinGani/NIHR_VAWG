import React, { useEffect, useState, useRef } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, query, where, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Clock, LogOut, ShieldAlert, WifiOff } from 'lucide-react';
import { handleFirestoreError, OperationType } from './services/firestore';
import { UserProfile } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const profileRef = useRef<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Enforce Google Sign-In restriction for Super Admin
        const isGoogleUser = currentUser.providerData.some(p => p.providerId === 'google.com');
        if (isGoogleUser && currentUser.email?.toLowerCase() !== 'ganiillin@gmail.com') {
          console.warn('Unauthorized Google User detected. Signing out...');
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          profileRef.current = null;
          setLoading(false);
          return;
        }
      }
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        profileRef.current = null;
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setProfileLoading(true);
    let unsubSnapshot: (() => void) | null = null;
    let isCancelled = false;

    const setupAuthAndProfile = async () => {
      if (user.email) {
        try {
          const deletedDocRef = doc(db, 'deleted_users', user.email.toLowerCase().trim());
          const deletedDocSnap = await getDoc(deletedDocRef);
          if (isCancelled) return;
          if (deletedDocSnap.exists()) {
            if (profileRef.current === null) {
              console.log('Manually logged in/registered user detected in deleted_users. Clearing blacklist state to allow layout rebuilding.');
              try {
                await deleteDoc(deletedDocRef);
              } catch (deleteErr) {
                console.error('Failed to clear deleted_users entry:', deleteErr);
              }
            } else {
              console.warn('User is blacklisted in deleted_users collection.');
              sessionStorage.setItem('auth_error', 'Your account has been deleted by an administrator. Please contact Co-Directors if you believe this was in error.');
              await signOut(auth);
              setUserProfile(null);
              profileRef.current = null;
              setLoading(false);
              setProfileLoading(false);
              return;
            }
          }
        } catch (err: any) {
          if (err?.message?.includes('offline') || err?.code?.includes('offline')) {
            console.warn('Firestore offline during deleted_users check. Continuing with cached/local initialization...');
          } else {
            console.error('Error checking deleted list:', err);
          }
        }
      }

      if (isCancelled) return;

      const userDocRef = doc(db, 'users', user.uid);
      
      unsubSnapshot = onSnapshot(userDocRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setUserProfile(data);
          profileRef.current = data;
          setProfileLoading(false);
          setLoading(false);
        } else {
          // If we already had a profile and it was deleted, sign out instead of recreating
          // This prevents users from "reappearing" when an admin deletes them
          if (profileRef.current) {
            console.warn('User profile was deleted by an admin. Signing out...');
            profileRef.current = null;
            if (user.email) {
              try {
                await setDoc(doc(db, 'deleted_users', user.email.toLowerCase().trim()), {
                  email: user.email.toLowerCase().trim(),
                  uid: user.uid,
                  deletedAt: new Date().toISOString()
                });
              } catch (writeErr) {
                console.error('Failed to blacklist deleted profile:', writeErr);
              }
            }
            sessionStorage.setItem('auth_error', 'Your profile details were removed or rejected by an administrator.');
            await signOut(auth);
            return;
          }

          // Check if there's a pre-approved profile with this email
          const q = query(collection(db, 'users'), where('email', '==', user.email?.toLowerCase()));
          let querySnapshot;
          try {
            querySnapshot = await getDocs(q);
          } catch (error: any) {
            if (error?.message?.includes('offline') || error?.code?.includes('offline')) {
              console.warn('Could not query users collection for pre-approved profile: client is offline.');
            } else {
              console.warn('Could not query users collection for pre-approved profile (this is normal if permission rules are strict):', error);
            }
            // Default to empty snapshot rather than throwing and crashing the listener callback
            querySnapshot = { empty: true, docs: [] } as any;
          }
          
          let existingProfile: any = null;
          let tempDoc: any = null;
          if (querySnapshot && !querySnapshot.empty) {
            // Find the one that was pre-approved (it won't have the current UID as its doc ID)
            existingProfile = querySnapshot.docs.find(d => d.id !== user.uid)?.data();
            tempDoc = querySnapshot.docs.find(d => d.id !== user.uid);
          }

          const newProfile: UserProfile = {
            id: user.uid,
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            role: (user.email?.toLowerCase() === 'ganiillin@gmail.com') ? 'admin' : (existingProfile?.role || 'user'),
            isApproved: (user.email?.toLowerCase() === 'ganiillin@gmail.com') ? true : (existingProfile?.isApproved || false),
            requestedAt: existingProfile?.requestedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          try {
            await setDoc(userDocRef, newProfile);
            if (tempDoc) {
              try {
                await deleteDoc(tempDoc.ref);
              } catch (error) {
                console.warn('Could not delete temporary pre-approved record:', error);
              }
            }
          } catch (error: any) {
            if (error?.message?.includes('offline') || error?.code?.includes('offline')) {
              console.warn('Failed to auto-create user profile: client is offline.');
            } else {
              console.error('Failed to auto-create user profile in database:', error);
            }
          }
        }
      }, (error: any) => {
        if (error?.message?.includes('offline') || error?.code?.includes('offline')) {
          console.warn('onSnapshot offline notification (will retry automatically):', error);
        } else {
          console.error('onSnapshot failed on user doc:', error);
        }
        setProfileLoading(false);
        setLoading(false);
      });
    };

    setupAuthAndProfile();

    return () => {
      isCancelled = true;
      if (unsubSnapshot) {
        unsubSnapshot();
      }
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isApproved = userProfile?.isApproved || 
                    userProfile?.role === 'admin' || 
                    user?.email === 'ganiillin@gmail.com';

  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center"
        >
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-amber-500" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Pending</h1>
          <p className="text-slate-600 mb-8">
            Your account request has been successfully submitted! Access to the operational dashboard is strictly restricted until a Co-Director reviews and manually approves your institutional account.
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left">
            <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
              <ShieldAlert size={16} />
              <span className="font-medium">Account Status Details</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">{user.email}</p>
            <p className="text-xs text-slate-400 mt-1">Requested on {userProfile ? new Date(userProfile.requestedAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 font-semibold py-2 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans relative">
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-50 bg-amber-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-amber-600/20 text-sm font-medium animate-pulse max-w-xs transition-all">
          <WifiOff size={18} className="shrink-0 text-white animate-bounce" />
          <span>Working Offline. Local database is cached.</span>
        </div>
      )}
      <Dashboard onLogout={handleLogout} />
    </div>
  );
}
