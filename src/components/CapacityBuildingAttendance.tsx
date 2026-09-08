import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Award, 
  CheckCircle, 
  Globe, 
  Mail, 
  Grid,
  FileText
} from 'lucide-react';
import { AttendanceRecord, TrainingEvent } from '../types';

interface AttendanceProps {
  records: AttendanceRecord[];
  events: TrainingEvent[];
  onAdd: (record: Omit<AttendanceRecord, 'id'>) => Promise<any>;
  onUpdate: (record: AttendanceRecord) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  isAdmin: boolean;
}

const COUNTRIES = ['UK', 'South Africa', 'Sri Lanka', 'Brazil', 'Mexico', 'Peru', 'Other'] as const;

export const CapacityBuildingAttendance: React.FC<AttendanceProps> = ({ records, events, onAdd, onUpdate, onDelete, isAdmin }) => {
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [eventName, setEventName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<typeof COUNTRIES[number]>('UK');
  const [institution, setInstitution] = useState('');
  const [roleCareerStage, setRoleCareerStage] = useState('');
  const [attendanceConfirmed, setAttendanceConfirmed] = useState<'Yes' | 'No'>('Yes');
  const [certificateIssued, setCertificateIssued] = useState<'Yes' | 'No'>('Yes');
  const [dateCertificateIssued, setDateCertificateIssued] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<'Yes' | 'No'>('No');

  const filteredRecords = records.filter(r => {
    return r.participantName.toLowerCase().includes(search.toLowerCase()) ||
           r.eventName.toLowerCase().includes(search.toLowerCase()) ||
           r.email.toLowerCase().includes(search.toLowerCase());
  });

  const handleOpenAdd = () => {
    // default event is the first one or empty
    setEventName(events.length > 0 ? events[0].title : '');
    setParticipantName('');
    setEmail('');
    setCountry('UK');
    setInstitution('');
    setRoleCareerStage('ECR');
    setAttendanceConfirmed('Yes');
    setCertificateIssued('Yes');
    setDateCertificateIssued(new Date().toISOString().split('T')[0]);
    setFeedbackSubmitted('No');
    setIsAdding(true);
  };

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEventName(rec.eventName);
    setParticipantName(rec.participantName);
    setEmail(rec.email);
    setCountry(rec.country);
    setInstitution(rec.institution);
    setRoleCareerStage(rec.roleCareerStage);
    setAttendanceConfirmed(rec.attendanceConfirmed);
    setCertificateIssued(rec.certificateIssued);
    setDateCertificateIssued(rec.dateCertificateIssued || '');
    setFeedbackSubmitted(rec.feedbackSubmitted);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim() || !email.trim() || !eventName.trim()) {
      alert('Please fill out all required fields: Participant Name, Email, and Training Event.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        eventName,
        participantName,
        email,
        country,
        institution,
        roleCareerStage,
        attendanceConfirmed,
        certificateIssued,
        dateCertificateIssued: certificateIssued === 'Yes' ? dateCertificateIssued : undefined,
        feedbackSubmitted
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

  // Generate mock certificate template logs instantly
  const handleGenerateCertificateRecord = async (participantName: string, eventName: string, email: string) => {
    setIsSaving(true);
    try {
      const payload: Omit<AttendanceRecord, 'id'> = {
        eventName,
        participantName,
        email,
        country: 'UK',
        institution: 'University of Birmingham',
        roleCareerStage: 'ECR',
        attendanceConfirmed: 'Yes',
        certificateIssued: 'Yes',
        dateCertificateIssued: new Date().toISOString().split('T')[0],
        feedbackSubmitted: 'Yes'
      };
      await onAdd(payload);
      alert(`Certificate Record successfully generated and saved for ${participantName}!`);
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
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search participant name, email, event..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-transparent border-b border-slate-200 focus:border-brand-orange outline-none transition-colors text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {events.length > 0 && (
            <button 
              onClick={() => handleGenerateCertificateRecord('Dr. Sarah Connor', events[0].title, 's.connor@bham.ac.uk')}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
            >
              <Award size={14} className="text-orange-500" />
              Auto-generate Certificate Log
            </button>
          )}

          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand-orange hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-100"
          >
            <Plus size={14} />
            Log Attendance
          </button>
        </div>
      </div>

      {/* Attendance records table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Participant</th>
                <th className="py-4 px-6">Training Event</th>
                <th className="py-4 px-6">Country & Institution</th>
                <th className="py-4 px-6 text-center">Attended</th>
                <th className="py-4 px-6 text-center">Feedback</th>
                <th className="py-4 px-6">Certificate Issued?</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No attendance records added yet. Add records manually or click "Auto-generate Certificate Log" above.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{rec.participantName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail size={10} /> {rec.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800 max-w-xs truncate">
                      {rec.eventName}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{rec.institution || '-'}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Globe size={11} /> {rec.country}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block w-4 h-4 rounded-full ${rec.attendanceConfirmed === 'Yes' ? 'text-emerald-500' : 'text-slate-300'}`}>
                        <CheckCircle size={16} className="mx-auto" />
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-800">
                      {rec.feedbackSubmitted}
                    </td>
                    <td className="py-4 px-6">
                      {rec.certificateIssued === 'Yes' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5">
                            <Award size={10} /> Certified
                          </span>
                          {rec.dateCertificateIssued && (
                            <div className="text-[9px] text-slate-400 mt-0.5">Issued: {rec.dateCertificateIssued}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                          title="Edit record"
                        >
                          <Edit2 size={13} />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this record?')) {
                                onDelete(rec.id!);
                              }
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Delete record"
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

      {/* Manual log Modal */}
      {(isAdding || editingRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingRecord ? 'Edit Attendance Log' : 'Log Session Attendance'}
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
                {/* Event Dropdown/Select */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Select Training Event *</label>
                  {events.length > 0 ? (
                    <select 
                      value={eventName}
                      onChange={e => setEventName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                    >
                      {events.map(ev => <option key={ev.id} value={ev.title}>{ev.title}</option>)}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      required
                      value={eventName}
                      onChange={e => setEventName(e.target.value)}
                      placeholder="Type Event Name..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                    />
                  )}
                </div>

                {/* Participant Name */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Participant Name *</label>
                  <input 
                    type="text" 
                    required
                    value={participantName}
                    onChange={e => setParticipantName(e.target.value)}
                    placeholder="e.g. Priyantha Jayasuriya"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Contact Email *</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. p.jayasuriya@colombo.ac.lk"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Participant country *</label>
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
                  <label className="block font-bold text-slate-500 mb-1">Academic Institution / Entity</label>
                  <input 
                    type="text" 
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    placeholder="e.g. University of Colombo"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Stage role */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Trainee Career Role</label>
                  <input 
                    type="text" 
                    value={roleCareerStage}
                    onChange={e => setRoleCareerStage(e.target.value)}
                    placeholder="e.g. ECR, Doctoral student, Survivor panel"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Confirmed */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Attendance Confirmed? *</label>
                  <select 
                    value={attendanceConfirmed}
                    onChange={e => setAttendanceConfirmed(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Certified */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Certificate Issued? *</label>
                  <select 
                    value={certificateIssued}
                    onChange={e => setCertificateIssued(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Certificate Date */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Date Certificate Issued</label>
                  <input 
                    type="date" 
                    value={dateCertificateIssued}
                    onChange={e => setDateCertificateIssued(e.target.value)}
                    disabled={certificateIssued === 'No'}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                {/* Feedback */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Feedback Submitted? *</label>
                  <select 
                    value={feedbackSubmitted}
                    onChange={e => setFeedbackSubmitted(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
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
                  {isSaving ? 'Logging...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
