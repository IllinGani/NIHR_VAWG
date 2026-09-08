import React, { useState } from 'react';
import { 
  Search, 
  Mail, 
  Building2, 
  UserCircle2, 
  ExternalLink, 
  Filter, 
  MapPin, 
  Tag, 
  Box, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Check,
  Download,
  Link as LinkIcon,
  UserCheck,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { TeamMember, UserProfile } from '../types';
import { hasActionPermission } from '../lib/permissions';

const ROLES = [
  'Co-Investigator',
  'Country Lead',
  'Work Package Lead',
  'Research Fellow',
  'Research Associate/Assistant',
  'PhD Student',
  'Postgraduate Student (Masters)',
  'Administrative / Programme Support',
  'Finance / Grants Support'
];

const WORK_PACKAGES = [
  'WP1 Survivor Panels',
  'WP2 Healthcare Burden',
  'WP3 Economic Cost',
  'WP4 What Works',
  'WP5 Knowledge Exchange',
  'Cross-cutting'
];

const COUNTRIES = ['All', 'UK', 'Sri Lanka', 'Brazil', 'India', 'Germany', 'USA', 'South Africa', 'Canada', 'Ireland', 'Peru', 'Mexico', 'Argentina', 'Switzerland', 'Global'];

const COUNTRY_FLAGS: Record<string, string> = {
  'UK': '🇬🇧',
  'United Kingdom': '🇬🇧',
  'Sri Lanka': '🇱🇰',
  'Brazil': '🇧🇷',
  'India': '🇮🇳',
  'Germany': '🇩🇪',
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'South Africa': '🇿🇦',
  'Canada': '🇨🇦',
  'Ireland': '🇮🇪',
  'Peru': '🇵🇪',
  'Switzerland': '🇨🇭',
  'Mexico': '🇲🇽',
  'Argentina': '🇦🇷',
  'Global': '🌐'
};

interface TeamDirectoryProps {
  members: TeamMember[];
  isAdmin: boolean;
  userProfile?: UserProfile | null;
  registeredUsers?: UserProfile[];
  onAdd: (member: TeamMember) => Promise<void>;
  onUpdate: (member: TeamMember) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSeed?: () => Promise<void>;
  isSaving?: boolean;
}

export const TeamDirectory: React.FC<TeamDirectoryProps> = ({ 
  members, 
  isAdmin, 
  userProfile,
  registeredUsers = [],
  onAdd, 
  onUpdate, 
  onDelete,
  onSeed,
  isSaving 
}) => {
  const canExport = hasActionPermission(userProfile, 'export', isAdmin);
  const canEdit = hasActionPermission(userProfile, 'createEdit', isAdmin);
  const canDelete = hasActionPermission(userProfile, 'delete', isAdmin);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedWPs, setSelectedWPs] = useState<string[]>([]);
  const [accountFilter, setAccountFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [hasCopied, setHasCopied] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    institution: '',
    email: '',
    country: 'UK',
    roles: [],
    workPackages: [],
    initials: '',
    bio: '',
    photoUrl: ''
  });

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleWP = (wp: string) => {
    setSelectedWPs(prev => 
      prev.includes(wp) ? prev.filter(w => w !== wp) : [...prev, wp]
    );
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.bio && member.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      member.initials.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCountry = selectedCountry === 'All' || member.country === selectedCountry;
    
    const matchesRoles = selectedRoles.length === 0 || 
      selectedRoles.some(role => member.roles.includes(role));
    
    const matchesWPs = selectedWPs.length === 0 || 
      selectedWPs.some(wp => member.workPackages.includes(wp));

    const isLinked = !!member.linkedUserId || registeredUsers.some(u => 
      u.teamMemberId === member.id || 
      (u.email && member.email && u.email.toLowerCase() === member.email.toLowerCase())
    );

    const matchesAccount = accountFilter === 'all' ||
      (accountFilter === 'linked' && isLinked) ||
      (accountFilter === 'unlinked' && !isLinked);
    
    return matchesSearch && matchesCountry && matchesRoles && matchesWPs && matchesAccount;
  });

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      institution: '',
      email: '',
      country: 'UK',
      roles: [],
      workPackages: [],
      initials: '',
      bio: '',
      photoUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({ ...member });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.institution) return;

    const memberData: TeamMember = {
      ...(formData as TeamMember),
      initials: formData.initials || formData.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '',
      id: editingMember?.id || ''
    };

    if (editingMember) {
      await onUpdate(memberData);
    } else {
      await onAdd(memberData);
    }
    setIsModalOpen(false);
  };

  const handleFormToggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles?.includes(role) 
        ? prev.roles.filter(r => r !== role) 
        : [...(prev.roles || []), role]
    }));
  };

  const handleFormToggleWP = (wp: string) => {
    setFormData(prev => ({
      ...prev,
      workPackages: prev.workPackages?.includes(wp) 
        ? prev.workPackages.filter(w => w !== wp) 
        : [...(prev.workPackages || []), wp]
    }));
  };

  const copyAllEmails = () => {
    // Outlook prefers semicolon separation for multiple recipients
    // Including names in "Name <email>" format helps Outlook resolve them correctly
    const emails = filteredMembers
      .map(m => m.email ? `${m.name} <${m.email}>` : null)
      .filter(Boolean)
      .join('; ');

    if (!emails) return;
    navigator.clipboard.writeText(emails);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const exportToCSV = () => {
    if (filteredMembers.length === 0) return;

    const headers = [
      'Name',
      'Initials',
      'Institution',
      'Email',
      'Country',
      'Roles',
      'Work Packages',
      'Bio'
    ];

    const rows = filteredMembers.map(m => [
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.initials || '').replace(/"/g, '""')}"`,
      `"${(m.institution || '').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      `"${(m.country || '').replace(/"/g, '""')}"`,
      `"${(m.roles || []).join('; ').replace(/"/g, '""')}"`,
      `"${(m.workPackages || []).join('; ').replace(/"/g, '""')}"`,
      `"${(m.bio || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `NIHR_Team_Directory_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-brand-navy">Team Directory</h2>
          <p className="text-slate-500 text-sm">Governance and project members list ({filteredMembers.length} displayed)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyAllEmails}
            disabled={filteredMembers.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm cursor-pointer",
              hasCopied 
                ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                : "bg-white border-slate-200 text-slate-600 hover:border-brand-orange/40 hover:text-brand-orange disabled:opacity-50 disabled:hover:text-slate-600 font-bold"
            )}
          >
            {hasCopied ? <Check size={16} /> : <Mail size={16} />}
            {hasCopied ? 'Email List Copied!' : 'Copy Displayed Emails'}
          </button>

          <div className="flex items-center gap-2">
            {canExport && (
              <button
                onClick={exportToCSV}
                disabled={filteredMembers.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                title="Export team directory list to CSV file"
              >
                <Download size={16} />
                Export CSV
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-200 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Plus size={16} />
                Add Member
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Name, institution..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                <MapPin size={12} /> Country
              </label>
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-brand-orange/20 transition-all"
              >
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>
                    {COUNTRY_FLAGS[country] ? `${COUNTRY_FLAGS[country]} ${country}` : country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                <Tag size={12} /> Roles (Multi-select)
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all",
                      selectedRoles.includes(role)
                        ? "bg-brand-orange border-brand-orange text-white"
                        : "bg-white border-slate-200 text-slate-500 hover:border-brand-orange/50"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                <Box size={12} /> Work Packages (Multi-select)
              </label>
              <div className="flex flex-wrap gap-2">
                {WORK_PACKAGES.map(wp => (
                  <button
                    key={wp}
                    onClick={() => toggleWP(wp)}
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all",
                      selectedWPs.includes(wp)
                        ? "bg-brand-navy border-brand-navy text-white"
                        : "bg-white border-slate-200 text-slate-500 hover:border-brand-navy/50"
                    )}
                  >
                    {wp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                <LinkIcon size={12} /> Account Link Status
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {(['all', 'linked', 'unlinked'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setAccountFilter(mode)}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                      accountFilter === mode 
                        ? "bg-white text-brand-navy shadow-xs" 
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {(selectedRoles.length > 0 || selectedWPs.length > 0 || selectedCountry !== 'All' || searchTerm || accountFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCountry('All');
                  setSelectedRoles([]);
                  setSelectedWPs([]);
                  setAccountFilter('all');
                }}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Directory Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredMembers.map((member) => (
                <motion.div
                  layout
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between">
                      {member.photoUrl ? (
                        <img 
                          src={member.photoUrl} 
                          alt={member.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-lg">
                          {member.initials || member.name.split(' ').map(n => n[0]).filter(c => c === c.toUpperCase()).slice(0, 2).join('')}
                        </div>
                      )}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
                          {COUNTRY_FLAGS[member.country] && <span>{COUNTRY_FLAGS[member.country]}</span>}
                          {member.country}
                        </span>
                        {(canEdit || canDelete) && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <button 
                                onClick={() => handleOpenEdit(member)}
                                className="p-1 text-slate-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded"
                                title="Edit Member"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                onClick={() => onDelete(member.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                                title="Delete Member"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight group-hover:text-brand-orange transition-colors">
                        {member.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.roles && member.roles.length > 0 ? (
                          member.roles.map(role => (
                            <span key={role} className="text-[9px] font-bold bg-brand-orange/5 text-brand-orange px-1.5 py-0.5 rounded border border-brand-orange/10">
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 italic">No roles assigned</span>
                        )}
                      </div>
                    </div>

                    {member.bio && (
                      <div className="pt-2 border-t border-slate-50">
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          {member.bio}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 size={13} className="shrink-0 text-slate-400" />
                        <span className="text-xs font-medium truncate">{member.institution}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 group/link">
                        <Mail size={13} className="shrink-0 text-slate-400" />
                        <a href={`mailto:${member.email}`} className="text-xs truncate hover:text-brand-orange transition-colors">
                          {member.email}
                        </a>
                      </div>
                    </div>

                    {/* Linked User Account Indicator */}
                    {(() => {
                      const linkedAccount = registeredUsers.find(u => 
                        u.teamMemberId === member.id || 
                        (member.linkedUserId && (u.id === member.linkedUserId || u.uid === member.linkedUserId)) ||
                        (member.linkedUserEmail && u.email.toLowerCase() === member.linkedUserEmail.toLowerCase()) ||
                        (member.email && u.email.toLowerCase() === member.email.toLowerCase())
                      );

                      if (linkedAccount) {
                        return (
                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50/90 px-2 py-1 rounded-lg border border-blue-200/70 text-[10px] font-bold">
                              <UserCheck size={12} className="text-blue-600 shrink-0" />
                              <span className="truncate max-w-[120px]">{linkedAccount.displayName || linkedAccount.email}</span>
                              <span className="text-[8px] uppercase px-1 py-0.2 bg-blue-200/70 text-blue-900 rounded font-black">
                                {linkedAccount.role === 'admin' ? 'Admin' : 'Linked'}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {member.workPackages && member.workPackages.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {member.workPackages.map(wp => (
                          <span key={wp} className="text-[8px] font-black bg-brand-navy text-white px-1.5 py-0.5 rounded-sm uppercase">
                            {wp.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Decorative background circle */}
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-brand-orange/5 transition-colors duration-500" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No team members found matching your search.</p>
              <div className="flex flex-col items-center gap-2 mt-4">
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCountry('All');
                    setSelectedRoles([]);
                    setSelectedWPs([]);
                  }}
                  className="text-brand-orange font-bold text-sm hover:underline"
                >
                  Reset all filters
                </button>
                {isAdmin && members.length === 0 && (
                  <div className="flex flex-col items-center gap-3 mt-4">
                    <p className="text-xs text-slate-400">
                      The directory is empty. You can add members manually or seed initial data.
                    </p>
                    {onSeed && (
                      <button
                        onClick={onSeed}
                        disabled={isSaving}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                      >
                        {isSaving ? (
                          <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        ) : (
                          <Plus size={14} />
                        )}
                        Seed Initial data
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-brand-orange/5">
                <div>
                  <h2 className="text-2xl font-black text-brand-navy">
                    {editingMember ? 'Edit Team Member' : 'Add Team Member'}
                  </h2>
                  <p className="text-slate-500 text-sm font-medium">Update directory information</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none text-sm transition-all"
                      placeholder="e.g. Dr. Jane Smith"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Initials / ID</label>
                    <input 
                      value={formData.initials}
                      onChange={(e) => setFormData({...formData, initials: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none text-sm transition-all"
                      placeholder="e.g. JS"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institution</label>
                    <input 
                      required
                      value={formData.institution}
                      onChange={(e) => setFormData({...formData, institution: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none text-sm transition-all"
                      placeholder="University or Board"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none text-sm transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Country</label>
                  <select 
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none text-sm transition-all"
                  >
                    {COUNTRIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>
                        {COUNTRY_FLAGS[c] ? `${COUNTRY_FLAGS[c]} ${c}` : c}
                      </option>
                    ))}
                    {Object.keys(COUNTRY_FLAGS).filter(c => !COUNTRIES.includes(c) && c !== 'United Kingdom' && c !== 'United States').map(c => (
                      <option key={c} value={c}>{COUNTRY_FLAGS[c]} {c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {formData.photoUrl ? (
                      <img 
                        src={formData.photoUrl} 
                        alt="Preview" 
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-300 shrink-0" 
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                        No Photo
                      </div>
                    )}
                    <div className="flex-grow space-y-2">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, photoUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-orange file:text-white hover:file:bg-orange-600 cursor-pointer"
                      />
                      <input 
                        type="text"
                        placeholder="Or paste image URL (https://...)"
                        value={formData.photoUrl || ''}
                        onChange={(e) => setFormData({...formData, photoUrl: e.target.value})}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-orange"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bio / Profile Summary</label>
                  <textarea 
                    rows={3}
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 outline-none text-sm transition-all resize-none"
                    placeholder="Brief background, research interests, role description..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map(role => (
                      <button
                        type="button"
                        key={role}
                        onClick={() => handleFormToggleRole(role)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          formData.roles?.includes(role)
                            ? "bg-brand-orange border-brand-orange text-white shadow-md shadow-orange-100"
                            : "bg-white border-slate-200 text-slate-500 hover:border-brand-orange/30"
                        )}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Work Packages</label>
                  <div className="flex flex-wrap gap-2">
                    {WORK_PACKAGES.map(wp => (
                      <button
                        type="button"
                        key={wp}
                        onClick={() => handleFormToggleWP(wp)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          formData.workPackages?.includes(wp)
                            ? "bg-brand-navy border-brand-navy text-white shadow-md shadow-navy-100"
                            : "bg-white border-slate-200 text-slate-500 hover:border-brand-navy/30"
                        )}
                      >
                        {wp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <LinkIcon size={12} className="text-blue-600" /> Link to Registered User Account (Optional)
                  </label>
                  <select
                    value={formData.linkedUserId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) {
                        setFormData(prev => ({ ...prev, linkedUserId: undefined, linkedUserEmail: undefined }));
                      } else {
                        const user = registeredUsers.find(u => u.id === selectedId || u.uid === selectedId);
                        setFormData(prev => ({
                          ...prev,
                          linkedUserId: selectedId,
                          linkedUserEmail: user?.email || undefined
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">-- None / Unlinked --</option>
                    {registeredUsers.map(u => (
                      <option key={u.id} value={u.uid || u.id}>
                        {u.displayName || u.email} ({u.email}) - {u.role}
                      </option>
                    ))}
                  </select>
                  {formData.linkedUserEmail && (
                    <p className="text-[11px] text-blue-700 font-semibold px-1">
                      Linked to account: {formData.linkedUserEmail}
                    </p>
                  )}
                </div>

                <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-brand-orange text-white rounded-2xl text-sm font-black shadow-xl shadow-orange-100 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check size={18} />
                        {editingMember ? 'Update Member' : 'Save Member'}
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
