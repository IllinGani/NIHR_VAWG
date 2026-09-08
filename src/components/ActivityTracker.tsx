import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Clock, User, Tag, Filter, X, Edit2, Check, AlertCircle, Search, Trash2, Target, Calendar, Download, Archive, Link, ExternalLink, Globe, Lock } from 'lucide-react';
import { Ticket, ResourceLink, UserProfile, TeamMember } from '../types';
import { MOCK_TICKETS } from '../constants';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';
import { DatePicker, parseFlexibleDate } from './DatePicker';
import { hasActionPermission, getUserAllowedCountries, isCountryAllowedForUser, ACTIVITY_COUNTRIES } from '../lib/permissions';

interface ActivityTrackerProps {
  tickets: Ticket[];
  registeredUsers: UserProfile[];
  teamMembers?: TeamMember[];
  userProfile?: UserProfile | null;
  onAdd: (ticket: Ticket) => void;
  onUpdate: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
  isAdmin?: boolean;
  onSeed?: () => Promise<void>;
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({ 
  tickets, 
  registeredUsers, 
  teamMembers = [],
  userProfile,
  onAdd, 
  onUpdate, 
  onDelete, 
  isSaving,
  isAdmin,
  onSeed
}) => {
  const canExport = hasActionPermission(userProfile, 'export', !!isAdmin);
  const canEdit = hasActionPermission(userProfile, 'createEdit', !!isAdmin);
  const canDelete = hasActionPermission(userProfile, 'delete', !!isAdmin);
  const allowedCountries = getUserAllowedCountries(userProfile, !!isAdmin);
  const availableCountries = allowedCountries !== null ? allowedCountries : ACTIVITY_COUNTRIES;

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeOwner, setActiveOwner] = useState<string>('All');
  const [activeCountry, setActiveCountry] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [ownerTab, setOwnerTab] = useState<'team' | 'accounts'>('team');
  const [ownerSearch, setOwnerSearch] = useState('');

  const categories = [
    { id: 'All', label: 'All Parts', color: 'bg-slate-100', prefix: '' },
    { id: 'Core', label: 'Core (High Priority)', color: 'bg-rose-100', prefix: '' },
    { id: 'WP1', label: 'WP1', color: 'bg-yellow-100', prefix: '1' },
    { id: 'WP2', label: 'WP2', color: 'bg-orange-100', prefix: '2' },
    { id: 'WP3', label: 'WP3', color: 'bg-purple-100', prefix: '3' },
    { id: 'WP4', label: 'WP4', color: 'bg-blue-100', prefix: '4' },
    { id: 'WP5', label: 'WP5', color: 'bg-indigo-100', prefix: '5' },
    { id: 'Project_admin', label: 'Project Admin', color: 'bg-red-100', prefix: '6' },
    { id: 'OHID_evaluation', label: 'Any Other Business (AOB)', color: 'bg-stone-100', prefix: '7' },
    { id: 'Archive', label: 'Archive', color: 'bg-slate-200', prefix: 'A' },
  ];

  const columns = [
    { id: 'To Do', title: 'To Do', color: 'bg-slate-100 text-slate-600' },
    { id: 'In Progress', title: 'In Progress', color: 'bg-blue-50 text-blue-600' },
    { id: 'Completed', title: 'Completed', color: 'bg-emerald-50 text-emerald-600' }
  ];

  const allTeamMemberNames = (teamMembers || []).map(m => m.name.trim()).filter(Boolean);
  const allRegisteredUserNames = (registeredUsers || []).map(u => (u.displayName || u.email).trim()).filter(Boolean);
  const ticketOwnerList = tickets.flatMap(t => {
    if (t.owners && t.owners.length > 0) return t.owners;
    return t.owner ? [t.owner] : [];
  });

  const allUniqueOwners = Array.from(new Set([
    ...ticketOwnerList,
    ...allTeamMemberNames,
    ...allRegisteredUserNames
  ])).filter((owner: unknown): owner is string => {
    if (typeof owner !== 'string') return false;
    const trimmed = owner.trim();
    if (!trimmed || trimmed === 'All') return false;

    // Split by common delimiters to check individual parts
    const parts = trimmed.split(/[,\s/]+/).filter(p => p.length > 0);
    if (parts.length === 0) return false;

    const isRealNamePart = (p: string) => (p.length >= 2 && /[a-z]/.test(p)) || p.length > 3;
    const hasRealName = parts.some(isRealNamePart);
    
    return hasRealName;
  }).sort();

  const filteredTickets = tickets.filter(t => {
    const matchesCategory = activeCategory === 'All' 
      ? !t.isArchived && t.category !== 'Archive'
      : activeCategory === 'Core' 
        ? t.isCore && !t.isArchived
        : activeCategory === 'Archive'
          ? t.isArchived || t.category === 'Archive'
          : t.category === activeCategory && !t.isArchived;

    const ticketOwners = t.owners && t.owners.length > 0 ? t.owners : (t.owner ? [t.owner] : []);
    const matchesOwner = activeOwner === 'All' || ticketOwners.includes(activeOwner);

    const matchesCountry = activeCountry === 'All' || (t.countries && t.countries.includes(activeCountry));
    const isAllowedCountry = isCountryAllowedForUser(userProfile, t.countries, !!isAdmin);

    const matchesSearch = (t.ticketInfo || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (t.no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticketOwners.some(o => o.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesOwner && matchesCountry && isAllowedCountry && matchesSearch;
  });

  const getNextTicketNo = (category: string) => {
    const cat = categories.find(c => c.id === category);
    if (!cat || cat.id === 'All') return (tickets.length + 1).toString();
    
    const prefix = cat.prefix;
    const catTickets = tickets.filter(t => t.category === category);
    
    // Find highest suffix
    let maxSuffix = 0;
    catTickets.forEach(t => {
      const parts = t.no.split('.');
      if (parts.length === 2 && parts[0] === prefix) {
        const suffix = parseInt(parts[1]);
        if (!isNaN(suffix) && suffix > maxSuffix) maxSuffix = suffix;
      }
    });
    
    return `${prefix}.${(maxSuffix + 1).toString().padStart(2, '0')}`;
  };

  const handleStatusChange = (ticket: Ticket, newStatus: string) => {
    const updatedTicket = { ...ticket, status: newStatus };
    if (newStatus === 'Completed' && !ticket.completedDate) {
      updatedTicket.completedDate = new Date().toLocaleDateString('en-GB');
    } else if (newStatus !== 'Completed') {
      updatedTicket.completedDate = '';
    }
    onUpdate(updatedTicket);
  };

  const handleSaveTicket = (ticket: Ticket) => {
    // Filter out empty links
    const cleanedLinks = (ticket.links || []).filter(l => l.label.trim() !== '' || l.url.trim() !== '');
    const cleanedTicket = { ...ticket, links: cleanedLinks };

    if (isAdding) {
      onAdd(cleanedTicket);
    } else {
      onUpdate(cleanedTicket);
    }
    setEditingTicket(null);
    setIsAdding(false);
  };

  const handleDeleteTicket = (id: string) => {
    onDelete(id);
    setEditingTicket(null);
    setTicketToDelete(null);
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Date', 'Ticket Info', 'Owners', 'Action', 'Status', 'Completed Date', 'Deadline', 'Comments', 'Category', 'Core', 'Archived'];
    const csvContent = [
      headers.join(','),
      ...filteredTickets.map(t => [
        `"${t.no}"`,
        `"${t.date}"`,
        `"${t.ticketInfo.replace(/"/g, '""')}"`,
        `"${(t.owners ? t.owners.join('; ') : (t.owner || '')).replace(/"/g, '""')}"`,
        `"${t.action.replace(/"/g, '""')}"`,
        `"${t.status}"`,
        `"${t.completedDate}"`,
        `"${t.deadline}"`,
        `"${t.comments.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        t.isCore ? 'Yes' : 'No',
        t.isArchived ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `BRIG_Activity_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddTicket = () => {
    const category = (activeCategory === 'All' || activeCategory === 'Core' || activeCategory === 'Archive') ? 'WP1' : activeCategory;
    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9),
      no: getNextTicketNo(category),
      date: new Date().toLocaleDateString(),
      ticketInfo: 'New Task',
      owners: [],
      action: '',
      status: 'To Do',
      completedDate: '',
      deadline: '',
      comments: '',
      category: category,
      isCore: activeCategory === 'Core'
    };
    setIsAdding(true);
    setEditingTicket(newTicket);
  };

  const getDeadlineColor = (deadlineStr: string) => {
    if (!deadlineStr) return 'text-slate-400';
    try {
      const deadlineDate = parseFlexibleDate(deadlineStr);
      if (!deadlineDate || isNaN(deadlineDate.getTime())) return 'text-slate-400';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'text-rose-600 font-bold';
      if (diffDays <= 14) return 'text-rose-500 font-bold';
      if (diffDays <= 28) return 'text-amber-500 font-bold';
      return 'text-emerald-500 font-bold';
    } catch (e) {
      return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Country Access Restriction Info Banner */}
      {allowedCountries !== null && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 font-bold">
              <Globe size={18} />
            </div>
            <div>
              <p className="font-bold text-amber-900">Country Access Restricted</p>
              <p className="text-amber-700">
                Your role restricts Activity Tracker view and edit privileges to: <span className="font-bold text-amber-900 underline">{allowedCountries.join(', ')}</span>
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-200 text-amber-900 font-bold rounded-xl text-[10px] uppercase shrink-0">
            Stratified View Active
          </span>
        </div>
      )}

      {/* Category Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="overflow-x-auto pb-2 flex-grow">
          <div className="flex items-center gap-2 min-w-max">
            <Filter size={14} className="text-slate-400 mr-2" />
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-bold transition-all border",
                  activeCategory === cat.id 
                    ? "bg-brand-orange text-white border-brand-orange" 
                    : "bg-white text-slate-500 border-slate-200 hover:border-brand-orange/50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-start sm:items-center">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <User size={14} className="text-slate-400" />
            <select 
              value={activeOwner}
              onChange={(e) => setActiveOwner(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 cursor-pointer min-w-[100px]"
            >
              <option value="All">All Owners</option>
              {allUniqueOwners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Globe size={14} className="text-slate-400" />
            <select 
              value={activeCountry}
              onChange={(e) => setActiveCountry(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 cursor-pointer min-w-[100px]"
            >
              <option value="All">{allowedCountries !== null ? 'All Allowed Countries' : 'All Countries'}</option>
              {availableCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-transparent border-b border-slate-200 focus:border-brand-orange outline-none transition-colors text-xs"
            />
          </div>
          {canExport && (
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-brand-orange hover:text-brand-orange transition-all shadow-sm cursor-pointer"
            >
              <Download size={14} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {tickets.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-amber-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <h4 className="font-bold text-base flex items-center gap-2">
              <AlertCircle className="text-amber-600 shrink-0" size={20} />
              Activity Tracker is empty
            </h4>
            <p className="text-sm text-slate-600">
              No tasks exist in your new Firebase database. You can bulk-restore the entire default suite of high-fidelity team directory members, activity tracker columns, dissemination records, and task boards, all pre-configured under your administrator profile.
            </p>
          </div>
          {isAdmin && onSeed && (
            <button
              onClick={async () => {
                try {
                  await onSeed();
                } catch (err) {
                  console.error('Seeding error:', err);
                }
              }}
              disabled={isSaving}
              className="bg-brand-orange text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-100 hover:shadow-orange-200 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Restore Default Demo Data
            </button>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid lg:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900">{column.title}</h3>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", column.color)}>
                  {filteredTickets.filter(t => t.status === column.id).length}
                </span>
              </div>
              <button 
                onClick={handleAddTicket}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex-grow space-y-3">
              {filteredTickets
                .filter((t) => t.status === column.id)
                .map((ticket) => (
                  <motion.div
                    layoutId={ticket.id}
                    key={ticket.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-brand-orange/30 transition-colors group relative"
                  >
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingTicket(ticket)}
                        className="p-1.5 bg-white text-slate-400 rounded-lg shadow-sm border border-slate-100 hover:text-brand-orange hover:border-brand-orange/30 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ticket.id) setTicketToDelete(ticket.id);
                        }}
                        className="p-1.5 bg-white text-slate-400 rounded-lg shadow-sm border border-slate-100 hover:text-red-500 hover:border-red-200 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange bg-brand-orange/5 px-2 py-0.5 rounded">
                          #{ticket.no}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {ticket.category}
                        </span>
                        {ticket.isCore && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Target size={10} />
                            CORE
                          </span>
                        )}
                        {ticket.isArchived && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Archive size={10} />
                            ARCHIVED
                          </span>
                        )}
                        {ticket.countries && ticket.countries.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {ticket.countries.map(country => (
                              <span key={country} className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                {country}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2 leading-snug pr-6">{ticket.ticketInfo}</h4>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Action</p>
                      <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-3">{ticket.action || 'No action specified'}</p>
                    </div>
                    
                    {ticket.comments && (
                      <div className="bg-slate-50 p-2 rounded-lg mb-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Latest Update</p>
                        <p className="text-[10px] text-slate-500 italic line-clamp-2">{ticket.comments}</p>
                      </div>
                    )}

                    {ticket.links && ticket.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {ticket.links.map((link, idx) => (
                          <a 
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-brand-orange/10 text-slate-600 hover:text-brand-orange rounded-lg text-[10px] font-bold transition-all border border-slate-200 hover:border-brand-orange/30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link size={10} />
                            {link.label}
                            <ExternalLink size={8} />
                          </a>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <User size={12} className="text-slate-400 shrink-0" />
                          {(ticket.owners && ticket.owners.length > 0) ? (
                            ticket.owners.map((owner, idx) => (
                              <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                {owner}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                              {ticket.owner || 'Unassigned'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                          <select 
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket, e.target.value)}
                            className="text-[10px] font-bold text-brand-orange bg-transparent border-none outline-none cursor-pointer hover:underline p-0"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5 text-slate-400" title="Date Created">
                          <Calendar size={12} />
                          <span className="text-[10px]">{ticket.date}</span>
                        </div>
                        <div className={cn("flex items-center gap-1.5", getDeadlineColor(ticket.deadline))}>
                          <Clock size={12} />
                          <span className="text-[10px]">{ticket.deadline || 'No deadline'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">{isAdding ? 'Add Ticket' : `Edit Ticket #${editingTicket.no}`}</h3>
                <button onClick={() => { setEditingTicket(null); setIsAdding(false); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ticket Info</label>
                    <input 
                      type="text" 
                      value={editingTicket.ticketInfo}
                      onChange={(e) => setEditingTicket({...editingTicket, ticketInfo: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date Created</label>
                    <DatePicker 
                      value={editingTicket.date || ''}
                      onChange={(val) => setEditingTicket({...editingTicket, date: val})}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Countries (Multi-Select)</label>
                      {allowedCountries !== null && (
                        <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                          <Lock size={10} /> Restrictive role active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[42px]">
                      {ACTIVITY_COUNTRIES.map(country => {
                        const isSelected = (editingTicket.countries || []).includes(country);
                        const isPermitted = allowedCountries === null || allowedCountries.includes(country);
                        
                        return (
                          <button
                            key={country}
                            type="button"
                            disabled={!isPermitted}
                            onClick={() => {
                              if (!isPermitted) return;
                              const currentCountries = editingTicket.countries || [];
                              const newCountries = isSelected 
                                ? currentCountries.filter(c => c !== country)
                                : [...currentCountries, country];
                              setEditingTicket({...editingTicket, countries: newCountries});
                            }}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1",
                              !isPermitted
                                ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-60"
                                : isSelected 
                                  ? "bg-indigo-600 text-white border-indigo-600" 
                                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-600/50 cursor-pointer"
                            )}
                            title={!isPermitted ? `Your account does not have access to ${country}` : undefined}
                          >
                            {!isPermitted && <Lock size={10} className="shrink-0" />}
                            {country}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Owners / Assignees (Attach from Team Directory or Accounts)
                      </label>
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setOwnerTab('team')}
                          className={cn(
                            "px-3 py-1 text-[11px] font-bold rounded-lg transition-all",
                            ownerTab === 'team' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          Team Directory ({teamMembers.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setOwnerTab('accounts')}
                          className={cn(
                            "px-3 py-1 text-[11px] font-bold rounded-lg transition-all",
                            ownerTab === 'accounts' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          Registered Users ({registeredUsers.length})
                        </button>
                      </div>
                    </div>

                    {/* Filter search box for owner picker */}
                    <div className="mb-2">
                      <input
                        type="text"
                        placeholder={`Search ${ownerTab === 'team' ? 'team members by name, country, or institution' : 'registered user accounts'}...`}
                        value={ownerSearch}
                        onChange={(e) => setOwnerSearch(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20 placeholder:text-slate-400 font-medium"
                      />
                    </div>

                    {/* Selected Owners Badges */}
                    {(editingTicket.owners || []).length > 0 && (
                      <div className="mb-2 p-2.5 bg-orange-50/70 border border-orange-200/80 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange block mb-1.5">
                          Attached Owners ({(editingTicket.owners || []).length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(editingTicket.owners || []).map((ownerName) => (
                            <span
                              key={ownerName}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-brand-orange/40 text-slate-800 rounded-full text-xs font-bold shadow-xs"
                            >
                              <span>{ownerName}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = editingTicket.owners || [];
                                  setEditingTicket({ ...editingTicket, owners: current.filter(o => o !== ownerName) });
                                }}
                                className="text-slate-400 hover:text-rose-600 rounded-full p-0.5 hover:bg-rose-50"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Owner Directory Listing */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto space-y-1.5">
                      {ownerTab === 'team' ? (
                        <>
                          {teamMembers
                            .filter(m => 
                              m.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
                              (m.institution || '').toLowerCase().includes(ownerSearch.toLowerCase()) ||
                              (m.country || '').toLowerCase().includes(ownerSearch.toLowerCase())
                            )
                            .map(member => {
                              const isSelected = (editingTicket.owners || []).includes(member.name);
                              return (
                                <button
                                  key={member.id}
                                  type="button"
                                  onClick={() => {
                                    const currentOwners = editingTicket.owners || [];
                                    const newOwners = isSelected 
                                      ? currentOwners.filter(o => o !== member.name)
                                      : [...currentOwners, member.name];
                                    setEditingTicket({ ...editingTicket, owners: newOwners });
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between text-left transition-all border",
                                    isSelected
                                      ? "bg-orange-50/90 border-brand-orange text-brand-orange font-bold shadow-xs"
                                      : "bg-white border-slate-200 text-slate-700 hover:border-brand-orange/40"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                                      isSelected ? "bg-brand-orange text-white" : "bg-slate-200 text-slate-700"
                                    )}>
                                      {member.initials || member.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-bold leading-tight text-slate-900">{member.name}</p>
                                      <p className="text-[10px] text-slate-400 font-normal leading-tight">
                                        {member.institution} • {member.country}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {member.country}
                                    </span>
                                    {isSelected && <Check size={14} className="text-brand-orange font-bold shrink-0" />}
                                  </div>
                                </button>
                              );
                            })}
                          {teamMembers.length === 0 && (
                            <div className="text-xs text-slate-400 text-center py-4 italic">
                              No team members found in directory.
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {registeredUsers
                            .filter(u => 
                              (u.displayName || '').toLowerCase().includes(ownerSearch.toLowerCase()) ||
                              (u.email || '').toLowerCase().includes(ownerSearch.toLowerCase())
                            )
                            .map(user => {
                              const userName = user.displayName || user.email;
                              const isSelected = (editingTicket.owners || []).includes(userName);
                              return (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => {
                                    const currentOwners = editingTicket.owners || [];
                                    const newOwners = isSelected 
                                      ? currentOwners.filter(o => o !== userName)
                                      : [...currentOwners, userName];
                                    setEditingTicket({ ...editingTicket, owners: newOwners });
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between text-left transition-all border",
                                    isSelected
                                      ? "bg-orange-50/90 border-brand-orange text-brand-orange font-bold shadow-xs"
                                      : "bg-white border-slate-200 text-slate-700 hover:border-brand-orange/40"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                                      isSelected ? "bg-brand-orange text-white" : "bg-slate-200 text-slate-700"
                                    )}>
                                      {userName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-bold leading-tight text-slate-900">{userName}</p>
                                      <p className="text-[10px] text-slate-400 font-normal leading-tight">{user.email}</p>
                                    </div>
                                  </div>
                                  {isSelected && <Check size={14} className="text-brand-orange font-bold shrink-0" />}
                                </button>
                              );
                            })}
                          {registeredUsers.length === 0 && (
                            <div className="text-xs text-slate-400 text-center py-4 italic">
                              No registered user accounts found.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                    <select 
                      value={editingTicket.status || ''}
                      onChange={(e) => setEditingTicket({...editingTicket, status: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <select 
                      value={editingTicket.category || ''}
                      onChange={(e) => setEditingTicket({...editingTicket, category: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none mb-4"
                    >
                      {categories.filter(c => c.id !== 'All' && c.id !== 'Core').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-3 cursor-pointer group mb-2">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={editingTicket.isArchived || false}
                          onChange={(e) => setEditingTicket({...editingTicket, isArchived: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-10 h-6 rounded-full transition-colors",
                          editingTicket.isArchived ? "bg-slate-600" : "bg-slate-200"
                        )} />
                        <div className={cn(
                          "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                          editingTicket.isArchived ? "translate-x-4" : "translate-x-0"
                        )} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Archive Ticket</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={editingTicket.isCore || false}
                          onChange={(e) => setEditingTicket({...editingTicket, isCore: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-10 h-6 rounded-full transition-colors",
                          editingTicket.isCore ? "bg-brand-orange" : "bg-slate-200"
                        )} />
                        <div className={cn(
                          "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                          editingTicket.isCore ? "translate-x-4" : "translate-x-0"
                        )} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-brand-orange transition-colors">Mark as Core (High Priority)</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deadline</label>
                    <DatePicker 
                      value={editingTicket.deadline || ''}
                      onChange={(val) => setEditingTicket({...editingTicket, deadline: val})}
                      placeholder="Select deadline date (DD/MM/YYYY)"
                      align="right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Action</label>
                  <textarea 
                    rows={3}
                    value={editingTicket.action || ''}
                    onChange={(e) => setEditingTicket({...editingTicket, action: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Comments / Updates</label>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const timestamp = `[${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}] `;
                        const currentComments = editingTicket.comments || '';
                        // Better user experience: append if empty, or prepend if existing?
                        // Usually people want newest at top if it's a log, or simple append.
                        // Let's prepend with a newline if not empty for a chronological log feel.
                        const newComments = currentComments ? `${timestamp}\n${currentComments}` : timestamp;
                        setEditingTicket({...editingTicket, comments: newComments});
                      }}
                      className="text-[10px] font-bold text-brand-orange hover:text-orange-600 transition-colors flex items-center gap-1"
                    >
                      <Clock size={12} />
                      Add Timestamp
                    </button>
                  </div>
                  <textarea 
                    rows={4}
                    value={editingTicket.comments || ''}
                    onChange={(e) => setEditingTicket({...editingTicket, comments: e.target.value})}
                    placeholder="Add updates here..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none resize-none text-sm"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Resource Links</label>
                  </div>
                  
                  <div className="space-y-3">
                    {(editingTicket.links || []).map((link, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                        <div className="flex-grow grid grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            placeholder="Label (e.g. Protocol)"
                            value={link.label}
                            onChange={(e) => {
                              const newLinks = [...(editingTicket.links || [])];
                              newLinks[idx] = { ...newLinks[idx], label: e.target.value };
                              setEditingTicket({ ...editingTicket, links: newLinks });
                            }}
                            className="bg-transparent border-none outline-none text-sm font-medium"
                          />
                          <input 
                            type="text" 
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...(editingTicket.links || [])];
                              newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                              setEditingTicket({ ...editingTicket, links: newLinks });
                            }}
                            className="bg-transparent border-none outline-none text-sm text-slate-500"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const newLinks = (editingTicket.links || []).filter((_, i) => i !== idx);
                            setEditingTicket({ ...editingTicket, links: newLinks });
                          }}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => {
                        const newLinks = [...(editingTicket.links || []), { label: '', url: '' }];
                        setEditingTicket({ ...editingTicket, links: newLinks });
                      }}
                      className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:border-brand-orange/50 hover:text-brand-orange transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      Add Another Link
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3">
                <button 
                  onClick={() => editingTicket.id && setTicketToDelete(editingTicket.id)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setEditingTicket(null); setIsAdding(false); }}
                    className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleSaveTicket(editingTicket)}
                    disabled={isSaving}
                    className="px-6 py-2 rounded-xl text-sm font-bold bg-brand-orange text-white shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check size={18} />
                    )}
                    {isAdding ? 'Add Ticket' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!ticketToDelete}
        onClose={() => !isSaving && setTicketToDelete(null)}
        onConfirm={() => {
          console.log('ActivityTracker: ConfirmationModal onConfirm triggered for ticket:', ticketToDelete);
          if (ticketToDelete) handleDeleteTicket(ticketToDelete);
        }}
        title="Delete Ticket?"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
        confirmText={isSaving ? "Deleting..." : "Yes, Delete Ticket"}
        variant="danger"
      />
    </div>
  );
};
