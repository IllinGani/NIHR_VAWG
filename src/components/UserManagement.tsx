import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  User as UserIcon, 
  Search,
  MoreVertical,
  Mail,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Plus,
  X,
  Edit2,
  Eye,
  EyeOff,
  Lock,
  Sliders,
  Sparkles,
  Download,
  Link as LinkIcon,
  Unlink,
  Building2,
  Globe,
  UserCheck
} from 'lucide-react';
import { auth, db } from '../firebase';
import { UserProfile, UserPermissions, TeamMember } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { RolePermissionsModal } from './RolePermissionsModal';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  query,
  orderBy,
  addDoc,
  setDoc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { cn } from '../lib/utils';

interface UserManagementProps {
  teamMembers?: TeamMember[];
}

export const UserManagement: React.FC<UserManagementProps> = ({ teamMembers = [] }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [localTeamMembers, setLocalTeamMembers] = useState<TeamMember[]>(teamMembers);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'linked' | 'unlinked'>('all');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfile | null>(null);
  const [linkingUser, setLinkingUser] = useState<UserProfile | null>(null);
  const [linkingSearch, setLinkingSearch] = useState('');
  const [autoLinkNotice, setAutoLinkNotice] = useState<string | null>(null);
  const [isAutoLinking, setIsAutoLinking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUser = auth.currentUser;

  // Keep localTeamMembers in sync
  useEffect(() => {
    if (teamMembers && teamMembers.length > 0) {
      setLocalTeamMembers(teamMembers);
      return;
    }
    const q = query(collection(db, 'teamMembers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as TeamMember));
      setLocalTeamMembers(fetched);
    });
    return () => unsubscribe();
  }, [teamMembers]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({ 
        ...doc.data(),
        id: doc.id 
      } as UserProfile));
      
      // Sort in-memory to guarantee all users are listed even if they lack requestedAt
      fetchedUsers.sort((a, b) => {
        const dateA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const dateB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { 
        isApproved: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleReject = async (id: string) => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const emailKey = userToDelete.email.toLowerCase().trim();
      const targetUid = userToDelete.uid || id;

      // 1. Delete from Firestore 'users' collection client-side (fully authorized for Admins via security rules)
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (fsDelErr) {
        console.error('Failed to delete user document from firestore client-side:', fsDelErr);
        throw fsDelErr;
      }

      // 2. Blacklist the email in 'deleted_users' client-side
      try {
        await setDoc(doc(db, 'deleted_users', emailKey), {
          email: emailKey,
          deletedAt: new Date().toISOString(),
          uid: targetUid
        });
      } catch (fsBlacklistErr) {
        console.error('Failed to add user to deleted_users blacklist client-side:', fsBlacklistErr);
      }

      // 3. Perform best-effort Firebase Authentication deletion server-side
      try {
        const response = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-requester-uid': currentUser?.uid || ''
          },
          body: JSON.stringify({
            uid: targetUid,
            email: emailKey
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          console.warn('Backend user auth records deletion returned warning (expected in development sandbox):', errData.error);
        }
      } catch (backendErr) {
        console.warn('Backend user auth records deletion request failed to complete:', backendErr);
      }

      setUserToDelete(null);
    } catch (error: any) {
      console.error('User deletion failed:', error);
      alert(error.message || 'Error occurred while deleting the user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', id), { 
        role: newRole,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleSavePermissions = async (
    userId: string,
    role: string,
    customRoleName: string | undefined,
    permissions: UserPermissions
  ) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role,
        customRoleName: customRoleName || null,
        permissions,
        updatedAt: new Date().toISOString()
      });
      setEditingPermissionsUser(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleLinkUserToTeamMember = async (userId: string, memberId: string | null) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const targetUser = users.find(u => u.id === userId);
      const prevMemberId = targetUser?.teamMemberId;

      if (!memberId) {
        // Unlinking
        await updateDoc(userDocRef, {
          teamMemberId: null,
          updatedAt: new Date().toISOString()
        });
        if (prevMemberId) {
          try {
            await updateDoc(doc(db, 'teamMembers', prevMemberId), {
              linkedUserId: null,
              linkedUserEmail: null
            });
          } catch (e) {
            console.warn('Could not clear prev team member link:', e);
          }
        }
        setLinkingUser(null);
        return;
      }

      const chosenMember = localTeamMembers.find(m => m.id === memberId);
      if (!chosenMember) return;

      if (prevMemberId && prevMemberId !== memberId) {
        try {
          await updateDoc(doc(db, 'teamMembers', prevMemberId), {
            linkedUserId: null,
            linkedUserEmail: null
          });
        } catch (e) {
          console.warn('Could not clear prev team member link:', e);
        }
      }

      await updateDoc(userDocRef, {
        teamMemberId: memberId,
        updatedAt: new Date().toISOString()
      });

      try {
        await updateDoc(doc(db, 'teamMembers', memberId), {
          linkedUserId: targetUser?.uid || targetUser?.id,
          linkedUserEmail: targetUser?.email
        });
      } catch (e) {
        console.warn('Could not update team member link:', e);
      }

      setLinkingUser(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleAutoLinkByEmail = async () => {
    setIsAutoLinking(true);
    let linked = 0;
    try {
      for (const u of users) {
        if (u.teamMemberId) continue;
        const userEmail = (u.email || '').toLowerCase().trim();
        if (!userEmail) continue;

        const matched = localTeamMembers.find(m => (m.email || '').toLowerCase().trim() === userEmail);
        if (matched) {
          await handleLinkUserToTeamMember(u.id, matched.id);
          linked++;
        }
      }
      setAutoLinkNotice(`Auto-link matched & linked ${linked} user account${linked === 1 ? '' : 's'} with Team Directory entries.`);
      setTimeout(() => setAutoLinkNotice(null), 6000);
    } catch (err) {
      console.error('Auto link failed', err);
    } finally {
      setIsAutoLinking(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const isLinked = !!user.teamMemberId || localTeamMembers.some(m => m.linkedUserEmail && m.linkedUserEmail.toLowerCase() === user.email.toLowerCase());
    const matchesFilter = filter === 'all' || 
                          (filter === 'pending' && !user.isApproved) || 
                          (filter === 'approved' && user.isApproved) ||
                          (filter === 'linked' && isLinked) ||
                          (filter === 'unlinked' && !isLinked);
    return matchesSearch && matchesFilter;
  });

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingNameUser, setEditingNameUser] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [addError, setAddError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = currentUser?.email === 'ganiillin@gmail.com';

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };
  const [tempName, setTempName] = useState('');

  const handleUpdateName = async (id: string) => {
    if (!tempName.trim()) return;
    try {
      await updateDoc(doc(db, 'users', id), { 
        displayName: tempName.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingNameUser(null);
      setTempName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;

    setAddError('');
    setIsSubmitting(true);
    try {
      const emailLower = newUserEmail.toLowerCase().trim();
      // Clear from blocked list if any
      try {
        await deleteDoc(doc(db, 'deleted_users', emailLower));
      } catch (blacklistErr) {
        console.warn('Could not clear from deleted_users blacklist or did not exist:', blacklistErr);
      }

      // Create a document with a deterministic ID so that Firestore rules can verify it
      const tempId = 'pending_' + Math.random().toString(36).substring(2, 11);
      const docId = 'pre_' + emailLower;
      await setDoc(doc(db, 'users', docId), {
        uid: tempId,
        email: emailLower,
        displayName: '',
        role: newUserRole,
        password: newUserPassword,
        isApproved: true,
        requestedAt: new Date().toISOString(),
        isPreApproved: true,
        updatedAt: new Date().toISOString()
      });
      setIsAddingUser(false);
      setNewUserEmail('');
      setNewUserRole('user');
      setNewUserPassword('');
    } catch (error: any) {
      console.error('Add user error:', error);
      let errMsg = 'Failed to pre-approve user. Please check permissions and database connectivity.';
      if (error && typeof error.message === 'string') {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed && parsed.error) {
            errMsg = parsed.error;
          }
        } catch {
          errMsg = error.message;
        }
      }
      setAddError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">Manage team access and permissions</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleAutoLinkByEmail}
            disabled={isAutoLinking}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            title="Automatically link user accounts to team directory members by matching email addresses"
          >
            <LinkIcon size={15} />
            {isAutoLinking ? 'Auto-Linking...' : 'Auto-Link by Email'}
          </button>

          <button
            onClick={() => {
              setAddError('');
              setIsSubmitting(false);
              setIsAddingUser(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
          >
            <Plus size={18} />
            Add User
          </button>
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-orange/20"
          >
            <option value="all">All Users</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="linked">Linked to Team Directory</option>
            <option value="unlinked">Unlinked Accounts</option>
          </select>
        </div>
      </div>

      {autoLinkNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-blue-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
            <span>{autoLinkNotice}</span>
          </div>
          <button 
            onClick={() => setAutoLinkNotice(null)} 
            className="text-blue-500 hover:text-blue-800 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  user.role === 'admin' ? "bg-purple-50 text-purple-600" : "bg-slate-50 text-slate-600"
                )}>
                  {user.role === 'admin' ? <Shield size={24} /> : <UserIcon size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {editingNameUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="px-2 py-1 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-orange/20 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateName(user.id);
                            if (e.key === 'Escape') setEditingNameUser(null);
                          }}
                        />
                        <button 
                          onClick={() => handleUpdateName(user.id)}
                          className="p-1 text-brand-orange hover:bg-orange-50 rounded-md transition-colors"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingNameUser(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <h3 className="font-bold text-slate-900">{user.displayName || 'Unnamed User'}</h3>
                        <button 
                          onClick={() => {
                            setEditingNameUser(user.id);
                            setTempName(user.displayName || '');
                          }}
                          className="p-1 text-slate-300 hover:text-brand-orange opacity-0 group-hover:opacity-100 transition-all"
                          title="Edit Name"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    {user.role === 'admin' && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full uppercase">Admin</span>
                    )}
                    {user.customRoleName && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase">
                        {user.customRoleName}
                      </span>
                    )}
                    {user.isApproved && !user.customRoleName && user.role !== 'admin' && (
                      <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-[10px] font-bold rounded-full uppercase">Project Member</span>
                    )}
                    {!user.isApproved && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">Pending</span>
                    )}
                  </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={12} />
                        {user.email}
                      </div>

                      {user.isApproved && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md border border-slate-200">
                            Modules: {user.permissions?.modules ? Object.values(user.permissions.modules).filter(Boolean).length : (user.role === 'admin' ? '9' : '7')}/9
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-semibold rounded-md border",
                            user.permissions?.actions?.export !== false 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-slate-50 text-slate-400 border-slate-200"
                          )}>
                            Export: {user.permissions?.actions?.export !== false ? 'Allowed' : 'Disabled'}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-semibold rounded-md border",
                            user.permissions?.actions?.createEdit !== false 
                              ? "bg-blue-50 text-blue-700 border-blue-200" 
                              : "bg-slate-50 text-slate-400 border-slate-200"
                          )}>
                            Edit: {user.permissions?.actions?.createEdit !== false ? 'Allowed' : 'Disabled'}
                          </span>
                          <span 
                            title={user.permissions?.allowedCountries?.join(', ')}
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-semibold rounded-md border flex items-center gap-1 max-w-full truncate",
                              user.permissions?.allowedCountries && user.permissions.allowedCountries.length > 0
                                ? "bg-amber-50 text-amber-800 border-amber-200 font-bold"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            )}
                          >
                            Countries: {user.permissions?.allowedCountries && user.permissions.allowedCountries.length > 0
                              ? user.permissions.allowedCountries.length <= 2 
                                ? user.permissions.allowedCountries.join(', ')
                                : `${user.permissions.allowedCountries.length} countries (${user.permissions.allowedCountries[0]}, +${user.permissions.allowedCountries.length - 1})`
                              : 'All'
                            }
                          </span>
                        </div>
                      )}

                      {/* Team Directory Link Indicator */}
                      {(() => {
                        const linkedMember = localTeamMembers.find(m => 
                          m.id === user.teamMemberId || 
                          (m.linkedUserId && (m.linkedUserId === user.id || m.linkedUserId === user.uid)) ||
                          (m.linkedUserEmail && m.linkedUserEmail.toLowerCase() === user.email.toLowerCase()) ||
                          (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase() && !user.teamMemberId)
                        );

                        if (linkedMember) {
                          return (
                            <div className="flex flex-wrap items-center gap-2 mt-2 p-2 bg-blue-50/90 border border-blue-200/80 rounded-xl">
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                                <LinkIcon size={12} className="text-blue-600" /> Linked Team Member:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-[10px] font-black flex items-center justify-center shrink-0">
                                  {linkedMember.initials || linkedMember.name.substring(0, 2).toUpperCase()}
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {linkedMember.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  ({linkedMember.institution} • {linkedMember.country})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLinkingSearch('');
                                    setLinkingUser(user);
                                  }}
                                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLinkUserToTeamMember(user.id, null)}
                                  className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                                >
                                  Unlink
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setLinkingSearch('');
                                setLinkingUser(user);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
                            >
                              <LinkIcon size={12} />
                              Link to Team Directory
                            </button>
                          </div>
                        );
                      })()}

                      {isSuperAdmin && user.password && (
                        <div className="flex items-center gap-2 text-xs font-mono text-brand-orange bg-orange-50 px-2 py-0.5 rounded-md w-fit mt-1">
                          <Lock size={10} />
                          {showPasswordMap[user.id] ? user.password : '••••••••'}
                          <button 
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="ml-1 hover:text-orange-700"
                          >
                            {showPasswordMap[user.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar size={12} />
                        Requested {new Date(user.requestedAt).toLocaleDateString()}
                      </div>
                    </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                {!user.isApproved ? (
                  <>
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors"
                    >
                      <CheckCircle2 size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => setUserToDelete(user)}
                      className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingPermissionsUser(user)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-orange/10 hover:bg-brand-orange hover:text-white text-brand-orange rounded-xl text-xs font-bold border border-brand-orange/20 transition-all cursor-pointer shadow-sm"
                      title="Configure module access & permissions"
                    >
                      <Sliders size={14} />
                      Permissions
                    </button>

                    <button
                      onClick={() => handleToggleRole(user.id, user.role)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                        user.role === 'admin' 
                          ? "bg-purple-50 text-purple-600 hover:bg-purple-100" 
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {user.role === 'admin' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                      {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                    </button>

                    {currentUser?.uid !== user.uid && (
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl">
            <Users className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-500">No users found matching your criteria</p>
          </div>
        )}

        {/* Role & Permissions Modal */}
        <RolePermissionsModal
          isOpen={!!editingPermissionsUser}
          onClose={() => setEditingPermissionsUser(null)}
          user={editingPermissionsUser}
          onSave={handleSavePermissions}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => userToDelete && handleReject(userToDelete.id)}
        title="Delete User?"
        message={`Are you sure you want to delete ${userToDelete?.displayName || userToDelete?.email}? This will revoke their access to the dashboard immediately.`}
        confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete User'}
      />

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Add New User</h2>
                <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                {addError && (
                  <div className="flex items-start gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
                    <ShieldAlert className="shrink-0 mt-0.5 text-red-500" size={18} />
                    <span className="text-sm leading-relaxed">{addError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      required
                      disabled={isSubmitting}
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Initial Password (Optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      disabled={isSubmitting}
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Assign a password..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none disabled:opacity-50"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">Passwords stored here are visible only to Super Admins.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setNewUserRole('user')}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm disabled:opacity-50",
                        newUserRole === 'user' 
                          ? "border-brand-orange bg-brand-orange/5 text-brand-orange" 
                          : "border-slate-100 text-slate-500 hover:border-slate-200"
                      )}
                    >
                      <UserIcon size={18} />
                      Standard User
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setNewUserRole('admin')}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm disabled:opacity-50",
                        newUserRole === 'admin' 
                          ? "border-purple-500 bg-purple-50 text-purple-600" 
                          : "border-slate-100 text-slate-500 hover:border-slate-200"
                      )}
                    >
                      <Shield size={18} />
                      Admin
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsAddingUser(false)}
                    className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-brand-orange text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : 'Add & Approve'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Link Account to Team Directory Modal */}
        {linkingUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <LinkIcon className="text-blue-600" size={20} />
                    Link to Team Directory
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect account <span className="font-bold text-slate-800">{linkingUser.displayName || linkingUser.email}</span> with a Team Directory member profile.
                  </p>
                </div>
                <button
                  onClick={() => setLinkingUser(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Current Link Status Banner */}
              {(() => {
                const currentMember = localTeamMembers.find(m => m.id === linkingUser.teamMemberId);
                if (currentMember) {
                  return (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck size={18} className="text-blue-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-blue-900">Currently Linked To:</p>
                          <p className="text-xs text-blue-700">{currentMember.name} ({currentMember.institution} • {currentMember.country})</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLinkUserToTeamMember(linkingUser.id, null)}
                        className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-all shadow-2xs"
                      >
                        Unlink Account
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Search input for members */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search team members by name, institution, or country..."
                  value={linkingSearch}
                  onChange={(e) => setLinkingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              {/* Team Directory Listing */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
                {localTeamMembers
                  .filter(m => 
                    m.name.toLowerCase().includes(linkingSearch.toLowerCase()) ||
                    (m.institution || '').toLowerCase().includes(linkingSearch.toLowerCase()) ||
                    (m.country || '').toLowerCase().includes(linkingSearch.toLowerCase()) ||
                    (m.email || '').toLowerCase().includes(linkingSearch.toLowerCase())
                  )
                  .map(member => {
                    const isLinkedToThisUser = linkingUser.teamMemberId === member.id;
                    const isLinkedToAnotherUser = !!member.linkedUserId && member.linkedUserId !== linkingUser.id && member.linkedUserId !== linkingUser.uid;

                    return (
                      <div
                        key={member.id}
                        className={cn(
                          "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3",
                          isLinkedToThisUser
                            ? "bg-blue-50/90 border-blue-400 shadow-xs"
                            : "bg-white border-slate-200 hover:border-blue-300"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                            isLinkedToThisUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                          )}>
                            {member.initials || member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                              {member.name}
                            </p>
                            <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">
                              {member.institution} • {member.country}
                            </p>
                            {member.email && (
                              <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                                {member.email}
                              </p>
                            )}
                            {isLinkedToAnotherUser && (
                              <span className="inline-block mt-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                                Linked to another user: {member.linkedUserEmail || member.linkedUserId}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isLinkedToThisUser ? (
                            <button
                              type="button"
                              onClick={() => handleLinkUserToTeamMember(linkingUser.id, null)}
                              className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all border border-rose-200"
                            >
                              Unlink
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleLinkUserToTeamMember(linkingUser.id, member.id)}
                              className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-xs"
                            >
                              Link to this Member
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {localTeamMembers.length === 0 && (
                  <p className="text-center py-8 text-xs text-slate-400 italic">No team directory members available.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLinkingUser(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
