import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, User, Mail, Shield, CheckCircle2, AlertCircle, Save, KeyRound } from 'lucide-react';
import { auth, db } from '../firebase';
import { updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../services/firestore';

interface SettingsProps {
  userProfile: UserProfile | null;
  onProfileUpdated?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ userProfile, onProfileUpdated }) => {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUser = auth.currentUser;
  const isGoogleUser = currentUser?.providerData.some(p => p.providerId === 'google.com');

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updates: Record<string, any> = {
        updatedAt: new Date().toISOString()
      };

      // 1. Handle Display Name Update
      if (displayName.trim() && displayName !== userProfile?.displayName) {
        updates.displayName = displayName.trim();
        // Update Firebase Auth user profile
        await updateProfile(currentUser, { displayName: displayName.trim() });
      }

      // 2. Handle Password Update
      if (newPassword) {
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match.');
        }

        // Update standard Firebase Auth password
        await updatePassword(currentUser, newPassword);
        // Save the new plain-text password in Firestore so the user can "see" it
        updates.password = newPassword;
      }

      // 3. Save updates to Firestore
      if (Object.keys(updates).length > 1 || (updates.updatedAt && !userProfile?.displayName)) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, updates);
      }

      setSuccess('Your profile settings have been successfully updated!');
      setNewPassword('');
      setConfirmPassword('');
      
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (err: any) {
      console.error('Settings update error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign back in to change your password for security reasons.');
      } else {
        setError(err.message || 'Failed to update settings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 text-sm">Manage your operational profile, password, and institutional preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Profile Summary Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-fit space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-brand-orange mx-auto flex items-center justify-center overflow-hidden mb-4">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={36} className="text-slate-400" />
              )}
            </div>
            <h3 className="font-bold text-lg text-slate-900">{userProfile?.displayName || currentUser?.displayName || 'Unnamed Partner'}</h3>
            <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase mt-2">
              {userProfile?.role === 'admin' ? 'Co-Director / Admin' : 'Lead Researcher'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Mail size={16} className="text-slate-400 shrink-0" />
              <span className="truncate">{userProfile?.email || currentUser?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Shield size={16} className="text-slate-400 shrink-0" />
              <span>Role: <strong className="text-slate-700 capitalize">{userProfile?.role || 'User'}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span className="text-emerald-700 font-medium">Approved Institutional Access</span>
            </div>
          </div>
        </div>

        {/* Right Side: Account Settings Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8">
          <form onSubmit={handleUpdateSettings} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100"
              >
                <AlertCircle className="shrink-0 mt-0.5 text-red-500" size={18} />
                <span className="text-sm leading-relaxed">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100"
              >
                <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-500" size={18} />
                <span className="text-sm leading-relaxed">{success}</span>
              </motion.div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Profile Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none text-slate-900 font-medium text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-350" size={18} />
                    <input
                      type="email"
                      value={userProfile?.email || currentUser?.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl outline-none font-medium text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Institutional emails cannot be changed.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Password Management</h3>
              
              {/* See Password Feature */}
              {userProfile?.password ? (
                <div className="bg-orange-50/50 border border-brand-orange/10 rounded-2xl p-4">
                  <span className="block text-xs font-bold text-brand-orange uppercase tracking-wider mb-2">Your Current Assigned Password</span>
                  <div className="flex items-center justify-between bg-white border border-slate-100 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Lock size={16} className="text-slate-400" />
                      <span className="font-mono text-sm font-semibold tracking-wide text-slate-800">
                        {showCurrentPassword ? userProfile.password : '••••••••••••'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="text-slate-400 hover:text-brand-orange transition-colors p-1 rounded-lg hover:bg-slate-50"
                      title={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">This is the safe plain-text password registered to your secure operational profile.</p>
                </div>
              ) : isGoogleUser ? (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-500 flex items-start gap-3">
                  <KeyRound className="shrink-0 text-brand-orange mt-0.5" size={18} />
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Signed in via Google</span>
                    You are currently authenticated using your institutional Google workspace. If you wish to set or change an operational password for direct email/password login, you can create a password below.
                  </div>
                </div>
              ) : null}

              {/* Change Password Feature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none text-slate-900 font-medium text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Minimum 6 characters long.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none text-slate-900 font-medium text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading || (!displayName.trim() && !newPassword)}
                className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
