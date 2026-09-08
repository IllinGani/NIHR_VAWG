import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  User, 
  Calendar, 
  Award, 
  Globe, 
  CheckSquare, 
  Bell
} from 'lucide-react';
import { MentoringRecord } from '../types';

interface MentoringProps {
  records: MentoringRecord[];
  onAdd: (record: Omit<MentoringRecord, 'id'>) => Promise<any>;
  onUpdate: (record: MentoringRecord) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  isAdmin: boolean;
}

const CAREER_STAGES = ['ECR', 'Doctoral student', 'Master’s student', 'Postgraduate researcher', 'Research fellow', 'Other'] as const;
const FOCUSES = ['Publication', 'Methods', 'Leadership', 'Policy engagement', 'Grant writing', 'Data analysis', 'Career development', 'Other'] as const;
const COUNTRIES = ['UK', 'South Africa', 'Sri Lanka', 'Brazil', 'Mexico', 'Peru', 'Other'] as const;
const STATUSES = ['Active', 'Paused', 'Completed'] as const;

export const CapacityBuildingMentoring: React.FC<MentoringProps> = ({ records, onAdd, onUpdate, onDelete, isAdmin }) => {
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [filterFocus, setFilterFocus] = useState('All');

  // Modal handlers
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MentoringRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [menteeName, setMenteeName] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [country, setCountry] = useState<typeof COUNTRIES[number]>('UK');
  const [institution, setInstitution] = useState('');
  const [careerStage, setCareerStage] = useState<typeof CAREER_STAGES[number]>('ECR');
  const [mentoringFocus, setMentoringFocus] = useState<typeof FOCUSES[number]>('Publication');
  const [meetingDate, setMeetingDate] = useState('');
  const [nextMeetingDate, setNextMeetingDate] = useState('');
  const [status, setStatus] = useState<typeof STATUSES[number]>('Active');
  const [keyActions, setKeyActions] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState('No');
  const [notes, setNotes] = useState('');

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.menteeName.toLowerCase().includes(search.toLowerCase()) ||
                          r.mentorName.toLowerCase().includes(search.toLowerCase()) ||
                          r.institution.toLowerCase().includes(search.toLowerCase());
    const matchesStage = filterStage === 'All' || r.careerStage === filterStage;
    const matchesFocus = filterFocus === 'All' || r.mentoringFocus === filterFocus;
    return matchesSearch && matchesStage && matchesFocus;
  });

  const handleOpenAdd = () => {
    setMenteeName('');
    setMentorName('');
    setCountry('UK');
    setInstitution('');
    setCareerStage('ECR');
    setMentoringFocus('Publication');
    setMeetingDate(new Date().toISOString().split('T')[0]);
    setNextMeetingDate('');
    setStatus('Active');
    setKeyActions('');
    setFollowUpRequired('No');
    setNotes('');
    setIsAdding(true);
  };

  const handleOpenEdit = (rec: MentoringRecord) => {
    setEditingRecord(rec);
    setMenteeName(rec.menteeName);
    setMentorName(rec.mentorName);
    setCountry(rec.country);
    setInstitution(rec.institution);
    setCareerStage(rec.careerStage);
    setMentoringFocus(rec.mentoringFocus);
    setMeetingDate(rec.meetingDate);
    setNextMeetingDate(rec.nextMeetingDate || '');
    setStatus(rec.status);
    setKeyActions(rec.keyActions);
    setFollowUpRequired(rec.followUpRequired);
    setNotes(rec.notes || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menteeName.trim() || !mentorName.trim() || !meetingDate) {
      alert('Please fill out all required fields: Mentee, Mentor, and Meeting Date.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        menteeName,
        mentorName,
        country,
        institution,
        careerStage,
        mentoringFocus,
        meetingDate,
        nextMeetingDate: nextMeetingDate || undefined,
        status,
        keyActions,
        followUpRequired,
        notes
      };

      if (editingRecord) {
        await onUpdate({ ...editingRecord, ...payload });
        setEditingRecord(null);
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

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-3xl">
          {/* Search bar */}
          <div className="relative flex-grow max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search mentee or mentor name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-transparent border-b border-slate-200 focus:border-brand-orange outline-none transition-colors text-sm"
            />
          </div>

          {/* Stage filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400"><Award size={12} className="inline mr-1" />Stage:</span>
            <select 
              value={filterStage} 
              onChange={e => setFilterStage(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700 font-bold"
            >
              <option value="All">All Stages</option>
              {CAREER_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
            </select>
          </div>

          {/* Focus filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400"><CheckSquare size={12} className="inline mr-1" />Focus:</span>
            <select 
              value={filterFocus} 
              onChange={e => setFilterFocus(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700 font-bold"
            >
              <option value="All">All Focuses</option>
              {FOCUSES.map(focus => <option key={focus} value={focus}>{focus}</option>)}
            </select>
          </div>
        </div>

        <div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand-orange hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-100"
          >
            <Plus size={14} />
            Log Meeting
          </button>
        </div>
      </div>

      {/* Grid of Mentoring Relationships */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecords.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-semibold bg-white border border-slate-200 rounded-3xl">
            No mentoring records match selected filters. Log a new session to populate logs.
          </div>
        ) : (
          filteredRecords.map(rec => (
            <div 
              key={rec.id} 
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-brand-orange/30 transition-all flex flex-col justify-between group h-full shadow-sm"
            >
              <div>
                {/* Header tag */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-orange-50 text-brand-orange px-2.5 py-0.5 rounded-full">
                    {rec.mentoringFocus}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      rec.status === 'Active' ? 'bg-emerald-500' :
                      rec.status === 'Paused' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <span className="text-[11px] font-bold text-slate-500">{rec.status}</span>
                  </div>
                </div>

                {/* Names */}
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-orange transition-colors">
                  {rec.menteeName}
                </h4>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Mentored by: {rec.mentorName}</p>

                {/* Core Attributes */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 pt-4 border-t border-slate-50 text-[11px]">
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Country & Hub</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                      <Globe size={11} className="text-slate-400" /> {rec.country}
                    </span>
                  </div>
                  
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Role / Career Stage</span>
                    <span className="font-bold text-slate-700 mt-0.5 truncate block">{rec.careerStage}</span>
                  </div>

                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Last Contact</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar size={11} className="text-slate-400" /> {rec.meetingDate}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Next Meeting</span>
                    <span className="font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                      <Calendar size={11} className="text-blue-400" /> {rec.nextMeetingDate || 'Not set'}
                    </span>
                  </div>
                </div>

                {/* Key Actions Block */}
                {rec.keyActions && (
                  <div className="bg-slate-50/50 rounded-2xl p-4 mt-4 border border-slate-100 text-[11px]">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Agreed Actions:</span>
                    <p className="text-slate-600 leading-relaxed italic">"{rec.keyActions}"</p>
                  </div>
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50 text-[10px]">
                <div className="flex items-center gap-1">
                  {rec.followUpRequired === 'Yes' && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                      <Bell size={10} /> Active Follow-Up
                    </span>
                  )}
                </div>

                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenEdit(rec)}
                    className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-colors border border-slate-100 font-bold"
                  >
                    Edit Log
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this mentoring record?')) {
                          onDelete(rec.id!);
                        }
                      }}
                      className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-slate-100 font-bold"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Log Modal */}
      {(isAdding || editingRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingRecord ? 'Edit Mentoring Log' : 'Log Mentoring Interaction'}
              </h3>
              <button 
                onClick={() => { setIsAdding(false); setEditingRecord(null); }}
                className="p-1 text-slate-400 hover:bg-slate-200 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mentee */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Mentee Name *</label>
                  <input 
                    type="text" 
                    required
                    value={menteeName}
                    onChange={e => setMenteeName(e.target.value)}
                    placeholder="e.g. Elena Gomez"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Mentor */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Mentor Name *</label>
                  <input 
                    type="text" 
                    required
                    value={mentorName}
                    onChange={e => setMentorName(e.target.value)}
                    placeholder="e.g. Dr. Jane Mpofu"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Partner Country *</label>
                  <select 
                    value={country}
                    onChange={e => setCountry(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Institution */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Institution Academic Hub</label>
                  <input 
                    type="text" 
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    placeholder="e.g. University of Colombo"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Career Stage */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Mentee Career Stage *</label>
                  <select 
                    value={careerStage}
                    onChange={e => setCareerStage(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    {CAREER_STAGES.map(cs => <option key={cs} value={cs}>{cs}</option>)}
                  </select>
                </div>

                {/* Focus Area */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Mentoring Focus Goal *</label>
                  <select 
                    value={mentoringFocus}
                    onChange={e => setMentoringFocus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    {FOCUSES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Meeting Date */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Interaction Date *</label>
                  <input 
                    type="date" 
                    required
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Next Meeting Date */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Follow-Up Date</label>
                  <input 
                    type="date" 
                    value={nextMeetingDate}
                    onChange={e => setNextMeetingDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Relationship Status */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Status *</label>
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Follow-up Indicator */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Requires Follow-up *</label>
                  <select 
                    value={followUpRequired}
                    onChange={e => setFollowUpRequired(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* Key Actions */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Actions Taken or Next Steps *</label>
                  <textarea 
                    rows={2}
                    required
                    value={keyActions}
                    onChange={e => setKeyActions(e.target.value)}
                    placeholder="Submit revised draft of journal paper by middle of June..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Narrative Discussion Notes / Comments</label>
                  <textarea 
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Brief highlights or background on mentee's research progress..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-50 mt-4">
                <button 
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingRecord(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-orange hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
                >
                  {isSaving ? 'Logging...' : 'Log Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
