import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Star, 
  MessageSquare, 
  User, 
  Calendar, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { TrainingFeedback, TrainingEvent } from '../types';

interface FeedbackProps {
  feedback: TrainingFeedback[];
  events: TrainingEvent[];
  onAdd: (feedback: Omit<TrainingFeedback, 'id'>) => Promise<any>;
  onUpdate: (feedback: TrainingFeedback) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  isAdmin: boolean;
}

export const CapacityBuildingFeedback: React.FC<FeedbackProps> = ({ feedback, events, onAdd, onUpdate, onDelete, isAdmin }) => {
  const [search, setSearch] = useState('');

  // Modals state
  const [isAdding, setIsAdding] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<TrainingFeedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [eventName, setEventName] = useState('');
  const [responsesCount, setResponsesCount] = useState<number>(0);
  const [avgUsefulnessRating, setAvgUsefulnessRating] = useState<number>(5);
  const [avgConfidenceRating, setAvgConfidenceRating] = useState<number>(5);
  const [qualitativeFeedback, setQualitativeFeedback] = useState('');
  const [suggestedImprovements, setSuggestedImprovements] = useState('');
  const [followUpNeeds, setFollowUpNeeds] = useState('');
  const [actionOwner, setActionOwner] = useState('');
  const [actionDeadline, setActionDeadline] = useState('');
  const [actionStatus, setActionStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');

  const filteredFeedback = feedback.filter(f => {
    return f.eventName.toLowerCase().includes(search.toLowerCase()) || 
           (f.qualitativeFeedback && f.qualitativeFeedback.toLowerCase().includes(search.toLowerCase())) ||
           (f.actionOwner && f.actionOwner.toLowerCase().includes(search.toLowerCase()));
  });

  const handleOpenAdd = () => {
    setEventName(events.length > 0 ? events[0].title : '');
    setResponsesCount(10);
    setAvgUsefulnessRating(4.5);
    setAvgConfidenceRating(4.5);
    setQualitativeFeedback('');
    setSuggestedImprovements('');
    setFollowUpNeeds('');
    setActionOwner('');
    setActionDeadline('');
    setActionStatus('Pending');
    setIsAdding(true);
  };

  const handleOpenEdit = (f: TrainingFeedback) => {
    setEditingFeedback(f);
    setEventName(f.eventName);
    setResponsesCount(f.responsesCount);
    setAvgUsefulnessRating(f.avgUsefulnessRating);
    setAvgConfidenceRating(f.avgConfidenceRating);
    setQualitativeFeedback(f.qualitativeFeedback || '');
    setSuggestedImprovements(f.suggestedImprovements || '');
    setFollowUpNeeds(f.followUpNeeds || '');
    setActionOwner(f.actionOwner || '');
    setActionDeadline(f.actionDeadline || '');
    setActionStatus(f.actionStatus);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || responsesCount <= 0) {
      alert('Please select an Event and ensure the Responses Count is greater than 0.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        eventName,
        responsesCount: Number(responsesCount),
        avgUsefulnessRating: Number(avgUsefulnessRating) || 5,
        avgConfidenceRating: Number(avgConfidenceRating) || 5,
        qualitativeFeedback,
        suggestedImprovements,
        followUpNeeds,
        actionOwner,
        actionDeadline: actionDeadline || undefined,
        actionStatus
      };

      if (editingFeedback) {
        await onUpdate({ ...editingFeedback, ...payload });
        setEditingFeedback(null);
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

  // Render yellow stars based on score
  const renderStars = (rating: number) => {
    const total = 5;
    const rounded = Math.round(rating * 10) / 10;
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
        <div className="flex gap-0.5">
          {Array.from({ length: total }).map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              fill={i < Math.floor(rating) ? '#f59e0b' : 'none'} 
              className={i < Math.floor(rating) ? 'text-amber-500' : 'text-slate-200'} 
            />
          ))}
        </div>
        <span>{rounded} / 5.0</span>
      </div>
    );
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
              placeholder="Search qualitative notes, events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-transparent border-b border-slate-200 focus:border-brand-orange outline-none transition-colors text-sm"
            />
          </div>
        </div>

        <div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand-orange hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-100"
          >
            <Plus size={14} />
            Add Feedback Summary
          </button>
        </div>
      </div>

      {/* Grid of Feedback records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredFeedback.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-semibold bg-white border border-slate-200 rounded-3xl">
            No evaluations uploaded yet. Click "Add Feedback" to publish training assessments.
          </div>
        ) : (
          filteredFeedback.map(item => (
            <div 
              key={item.id} 
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-brand-orange/30 transition-all flex flex-col justify-between h-full shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xs font-bold text-slate-900 pr-4">{item.eventName}</h4>
                  <span className="text-[10px] bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-500 font-bold tracking-tight whitespace-nowrap">
                    {item.responsesCount} Responses
                  </span>
                </div>

                {/* Score Indicators */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-3">
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Usefulness Rating</span>
                    {renderStars(item.avgUsefulnessRating)}
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Confidence Improvement</span>
                    {renderStars(item.avgConfidenceRating)}
                  </div>
                </div>

                {/* Narrative Quotes */}
                {item.qualitativeFeedback && (
                  <div className="mt-4 pt-3 border-t border-slate-50 text-xs">
                    <div className="flex items-start gap-2 text-slate-600">
                      <MessageSquare size={14} className="text-slate-300 mt-1 shrink-0" />
                      <p className="italic leading-relaxed">"{item.qualitativeFeedback}"</p>
                    </div>
                  </div>
                )}

                {/* Action steps tracker */}
                {item.actionOwner && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-2">Evaluative Action Tracking</span>
                    <div className="bg-orange-50/20 border border-orange-100/50 rounded-2xl p-4 text-[11px] grid grid-cols-2 gap-y-2 gap-x-4">
                      <div className="col-span-2">
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Topic/Need for follow-up</span>
                        <span className="font-semibold text-slate-700">{item.followUpNeeds || 'Review materials'}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Action Owner</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5"><User size={10} /> {item.actionOwner}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-bold uppercase">Deadline</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5"><Calendar size={10} /> {item.actionDeadline || 'Soon'}</span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.actionStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          item.actionStatus === 'In Progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {item.actionStatus === 'Completed' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                          Status: {item.actionStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action trigger row */}
              <div className="flex gap-1 justify-end pt-4 mt-6 border-t border-slate-50 text-[10px]">
                <button 
                  onClick={() => handleOpenEdit(item)}
                  className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 text-slate-500 font-bold transition-all"
                >
                  Edit Feedback
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want delete this feedback summary?')) {
                        onDelete(item.id!);
                      }
                    }}
                    className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 text-rose-500 font-bold transition-all"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual log Modal */}
      {(isAdding || editingFeedback) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingFeedback ? 'Edit Qualitative Workshop Feedback' : 'Log Qualitative Evaluation Summary'}
              </h3>
              <button 
                onClick={() => { setIsAdding(false); setEditingFeedback(null); }}
                className="p-1 text-slate-400 hover:bg-slate-200 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Title Selector */}
                <div className="md:col-span-2 text-xs">
                  <label className="block text-slate-500 font-bold mb-1">Training Event Link *</label>
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
                      placeholder="Type Event Title..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                    />
                  )}
                </div>

                {/* Responses Count */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Responses Count *</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={responsesCount}
                    onChange={e => setResponsesCount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent font-medium"
                  />
                </div>

                {/* Rating Usefulness */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Average Usefulness (1.0 to 5.0) *</label>
                  <input 
                    type="number" 
                    required
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={avgUsefulnessRating}
                    onChange={e => setAvgUsefulnessRating(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent font-medium"
                  />
                </div>

                {/* Improvement confidence scale */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Average Confidence Gain (1.0 to 5.0) *</label>
                  <input 
                    type="number" 
                    required
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={avgConfidenceRating}
                    onChange={e => setAvgConfidenceRating(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent font-medium"
                  />
                </div>

                {/* Qualifier text description */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Narrative Comment highlights (Key Quotes)</label>
                  <textarea 
                    rows={2}
                    value={qualitativeFeedback}
                    onChange={e => setQualitativeFeedback(e.target.value)}
                    placeholder="Participant comments, highlight quotes..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent text-xs font-medium"
                  />
                </div>

                {/* Areas for Improvement */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Areas for Improvement / Suggestions</label>
                  <textarea 
                    rows={2}
                    value={suggestedImprovements}
                    onChange={e => setSuggestedImprovements(e.target.value)}
                    placeholder="Provide templates, shorten sessions..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent text-xs font-medium"
                  />
                </div>

                {/* Followup action requirements / needs */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Actionable Needs identified</label>
                  <input 
                    type="text" 
                    value={followUpNeeds}
                    onChange={e => setFollowUpNeeds(e.target.value)}
                    placeholder="Provide custom Excel spreadsheets..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent text-xs font-medium"
                  />
                </div>

                {/* Action Owner */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Action Assigned Owner</label>
                  <input 
                    type="text" 
                    value={actionOwner}
                    onChange={e => setActionOwner(e.target.value)}
                    placeholder="e.g. Dr. Jane Mpofu"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent text-xs font-medium"
                  />
                </div>

                {/* Action Deadline */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Action deadline</label>
                  <input 
                    type="date" 
                    value={actionDeadline}
                    onChange={e => setActionDeadline(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent text-xs font-medium"
                  />
                </div>

                {/* Action status */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Action status *</label>
                  <select 
                    value={actionStatus}
                    onChange={e => setActionStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white text-xs font-semibold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-50 mt-4">
                <button 
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingFeedback(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-orange hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold transition-all text-xs"
                >
                  {isSaving ? 'Logging...' : 'Publish Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
