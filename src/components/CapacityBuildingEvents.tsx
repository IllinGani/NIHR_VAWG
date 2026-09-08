import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  X, 
  Calendar, 
  User, 
  Globe, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { TrainingEvent } from '../types';

interface EventsProps {
  events: TrainingEvent[];
  onAdd: (event: Omit<TrainingEvent, 'id'>) => Promise<any>;
  onUpdate: (event: TrainingEvent) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  isAdmin: boolean;
}

const EVENT_TYPES = ['Short course', 'Workshop', 'Video', 'Lecture', 'Mentoring', 'Conference', 'Other'] as const;
const WORK_PACKAGES = ['WP1', 'WP2', 'WP3', 'WP4', 'WP5', 'Cross-cutting'] as const;
const COUNTRIES = ['UK', 'South Africa', 'Sri Lanka', 'Brazil', 'Mexico', 'Peru', 'Other'] as const;
const DELIVERY_MODES = ['Online', 'In-person', 'Hybrid'] as const;
const STATUSES = ['Planned', 'Confirmed', 'Delivered', 'Cancelled'] as const;

export const CapacityBuildingEvents: React.FC<EventsProps> = ({ events, onAdd, onUpdate, onDelete, isAdmin }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  
  // Modals state
  const [editingEvent, setEditingEvent] = useState<TrainingEvent | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState<typeof EVENT_TYPES[number]>('Workshop');
  const [workPackage, setWorkPackage] = useState<typeof WORK_PACKAGES[number]>('Cross-cutting');
  const [country, setCountry] = useState<typeof COUNTRIES[number]>('UK');
  const [leadFacilitator, setLeadFacilitator] = useState('');
  const [partnerOrganisation, setPartnerOrganisation] = useState('');
  const [date, setDate] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<typeof DELIVERY_MODES[number]>('Online');
  const [status, setStatus] = useState<typeof STATUSES[number]>('Planned');
  const [attendeesCount, setAttendeesCount] = useState<number>(0);
  const [targetAudience, setTargetAudience] = useState('');
  const [notes, setNotes] = useState('');
  const [evidenceUploaded, setEvidenceUploaded] = useState('');

  // Filtering
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.leadFacilitator.toLowerCase().includes(search.toLowerCase()) ||
                          e.partnerOrganisation.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || e.type === filterType;
    const matchesCountry = filterCountry === 'All' || e.country === filterCountry;
    return matchesSearch && matchesType && matchesCountry;
  });

  // Open Add modal
  const handleOpenAdd = () => {
    setTitle('');
    setType('Workshop');
    setWorkPackage('Cross-cutting');
    setCountry('UK');
    setLeadFacilitator('');
    setPartnerOrganisation('');
    setDate(new Date().toISOString().split('T')[0]);
    setDeliveryMode('Online');
    setStatus('Planned');
    setAttendeesCount(0);
    setTargetAudience('');
    setNotes('');
    setEvidenceUploaded('');
    setIsAdding(true);
  };

  // Open Edit modal
  const handleOpenEdit = (event: TrainingEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setType(event.type);
    setWorkPackage(event.workPackage);
    setCountry(event.country);
    setLeadFacilitator(event.leadFacilitator);
    setPartnerOrganisation(event.partnerOrganisation);
    setDate(event.date);
    setDeliveryMode(event.deliveryMode);
    setStatus(event.status);
    setAttendeesCount(event.attendeesCount);
    setTargetAudience(event.targetAudience || '');
    setNotes(event.notes || '');
    setEvidenceUploaded(event.evidenceUploaded || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !leadFacilitator.trim() || !date) {
      alert('Please fill out all required fields: Title, Lead Facilitator, and Date.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        type,
        workPackage,
        country,
        leadFacilitator,
        partnerOrganisation,
        date,
        deliveryMode,
        status,
        attendeesCount: Number(attendeesCount) || 0,
        targetAudience,
        notes,
        evidenceUploaded
      };

      if (editingEvent) {
        await onUpdate({ ...editingEvent, ...payload });
        setEditingEvent(null);
      } else {
        await onAdd(payload);
        setIsAdding(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCSVExport = () => {
    if (filteredEvents.length === 0) return;
    const headers = ['Title', 'Type', 'Work Package', 'Country', 'Lead Facilitator', 'Partner Organisation', 'Date', 'Delivery Mode', 'Status', 'Attendees Count', 'Target Audience'];
    const rows = filteredEvents.map(e => [
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.type}"`,
      `"${e.workPackage}"`,
      `"${e.country}"`,
      `"${e.leadFacilitator.replace(/"/g, '""')}"`,
      `"${e.partnerOrganisation.replace(/"/g, '""')}"`,
      `"${e.date}"`,
      `"${e.deliveryMode}"`,
      `"${e.status}"`,
      e.attendeesCount,
      `"${e.targetAudience.replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "training_events_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Table Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-3xl">
          {/* Search */}
          <div className="relative flex-grow max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search event, facilitator..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-transparent border-b border-slate-200 focus:border-brand-orange outline-none transition-colors text-sm"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400"><Filter size={12} className="inline mr-1" />Type:</span>
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700 font-bold"
            >
              <option value="All">All Types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Country Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400"><Globe size={12} className="inline mr-1" />Country:</span>
            <select 
              value={filterCountry} 
              onChange={e => setFilterCountry(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700 font-bold"
            >
              <option value="All">All Countries</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCSVExport}
            disabled={filteredEvents.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
          
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand-orange hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-100"
          >
            <Plus size={14} />
            New Event
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Event Details</th>
                <th className="py-4 px-6">Work Package & Country</th>
                <th className="py-4 px-6">Facilitator / Partner</th>
                <th className="py-4 px-6">Mode & Date</th>
                <th className="py-4 px-6 text-center">Trainees</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No training sessions added yet. Click "New Event" to log a record.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(event => (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 max-w-xs">
                      <div>
                        <div className="font-bold text-slate-900 mb-0.5">{event.title}</div>
                        <div className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                          {event.type}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{event.workPackage}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Globe size={11} /> {event.country}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <User size={11} className="text-slate-400" />
                        {event.leadFacilitator}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{event.partnerOrganisation || '-'}</div>
                    </td>
                    <td className="py-4 px-6 font-medium">
                      <div className="text-slate-800">{event.deliveryMode}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> {event.date}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-900">
                      {event.status === 'Delivered' ? event.attendeesCount : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-0.5 rounded-full ${
                        event.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        event.status === 'Confirmed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        event.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEdit(event)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                          title="Edit event"
                        >
                          <Edit2 size={13} />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this event?')) {
                                onDelete(event.id!);
                              }
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Delete event"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {(isAdding || editingEvent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingEvent ? 'Modify Capacity Session' : 'Register New Capacity Building Event'}
              </h3>
              <button 
                onClick={() => { setIsAdding(false); setEditingEvent(null); }}
                className="p-1 text-slate-400 hover:bg-slate-200 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Session Title *</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Trauma-Informed Interviewing Techniques"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Session Type *</label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-white"
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Work Package */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Work Package Relevance *</label>
                  <select 
                    value={workPackage}
                    onChange={e => setWorkPackage(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-white"
                  >
                    {WORK_PACKAGES.map(wp => <option key={wp} value={wp}>{wp}</option>)}
                  </select>
                </div>

                {/* Lead Country */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">National Partner Country *</label>
                  <select 
                    value={country}
                    onChange={e => setCountry(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-white"
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Delivery Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Delivery Configuration *</label>
                  <select 
                    value={deliveryMode}
                    onChange={e => setDeliveryMode(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-white"
                  >
                    {DELIVERY_MODES.map(dm => <option key={dm} value={dm}>{dm}</option>)}
                  </select>
                </div>

                {/* Lead Facilitator */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Lead Facilitator Name *</label>
                  <input 
                    type="text" 
                    required
                    value={leadFacilitator}
                    onChange={e => setLeadFacilitator(e.target.value)}
                    placeholder="e.g. Dr. Jane Mpofu"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Partner Organisation */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Partner Academic Institution</label>
                  <input 
                    type="text" 
                    value={partnerOrganisation}
                    onChange={e => setPartnerOrganisation(e.target.value)}
                    placeholder="e.g. University of the Witwatersrand"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Event Schedule Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Event Date *</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Project Status *</label>
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-white"
                  >
                    {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                {/* Attendees Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Attendees Handcount</label>
                  <input 
                    type="number" 
                    min={0}
                    value={attendeesCount}
                    onChange={e => setAttendeesCount(Number(e.target.value))}
                    disabled={status !== 'Delivered'}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-transparent disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Target Participant Cohorts</label>
                  <input 
                    type="text" 
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    placeholder="e.g. ECRs, doctoral students, survivor panels"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Evidence agenda Link */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Evidence / Agenda Hyperlink</label>
                  <input 
                    type="url" 
                    value={evidenceUploaded}
                    onChange={e => setEvidenceUploaded(e.target.value)}
                    placeholder="https://drive.google.com/file/..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Narrative Notes */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Session Narrative / Comments Summary</label>
                  <textarea 
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Brief highlights or course descriptions..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-50 mt-4">
                <button 
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingEvent(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-orange hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
