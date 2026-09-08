import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  BookOpen, 
  ExternalLink, 
  Video, 
  FileText, 
  Bookmark, 
  Calendar, 
  User
} from 'lucide-react';
import { TrainingResource } from '../types';

interface ResourcesProps {
  resources: TrainingResource[];
  onAdd: (resource: Omit<TrainingResource, 'id'>) => Promise<any>;
  onUpdate: (resource: TrainingResource) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  isAdmin: boolean;
}

const RESOURCE_TYPES = ['Slides', 'Video', 'Recording', 'Reading list', 'Template', 'Guidance document', 'Certificate', 'Other'] as const;
const TOPIC_AREAS = [
  'Survivor engagement in research', 
  'Trauma-informed research', 
  'Health data science', 
  'Health economics', 
  'Complex evaluation', 
  'Policy evaluation', 
  'Safeguarding', 
  'Knowledge mobilisation', 
  'Research ethics'
] as const;
const WORK_PACKAGES = ['WP1', 'WP2', 'WP3', 'WP4', 'WP5', 'Cross-cutting'] as const;
const STATUSES = ['Draft', 'Approved', 'Archived'] as const;

export const CapacityBuildingResources: React.FC<ResourcesProps> = ({ resources, onAdd, onUpdate, onDelete, isAdmin }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterTopic, setFilterTopic] = useState('All');

  // Modal controls
  const [isAdding, setIsAdding] = useState(false);
  const [editingResource, setEditingResource] = useState<TrainingResource | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState<typeof RESOURCE_TYPES[number]>('Guidance document');
  const [topicArea, setTopicArea] = useState<typeof TOPIC_AREAS[number]>('Trauma-informed research');
  const [workPackage, setWorkPackage] = useState<typeof WORK_PACKAGES[number]>('Cross-cutting');
  const [countryRelevance, setCountryRelevance] = useState('');
  const [uploadUrlOrLink, setUploadUrlOrLink] = useState('');
  const [owner, setOwner] = useState('');
  const [dateUploaded, setDateUploaded] = useState('');
  const [versionNumber, setVersionNumber] = useState('V1.0');
  const [status, setStatus] = useState<typeof STATUSES[number]>('Approved');

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
                          r.topicArea.toLowerCase().includes(search.toLowerCase()) ||
                          r.owner.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || r.resourceType === filterType;
    const matchesTopic = filterTopic === 'All' || r.topicArea === filterTopic;
    return matchesSearch && matchesType && matchesTopic;
  });

  const handleOpenAdd = () => {
    setTitle('');
    setResourceType('Guidance document');
    setTopicArea('Trauma-informed research');
    setWorkPackage('Cross-cutting');
    setCountryRelevance('All partner countries');
    setUploadUrlOrLink('');
    setOwner('');
    setDateUploaded(new Date().toISOString().split('T')[0]);
    setVersionNumber('V1.0');
    setStatus('Approved');
    setIsAdding(true);
  };

  const handleOpenEdit = (res: TrainingResource) => {
    setEditingResource(res);
    setTitle(res.title);
    setResourceType(res.resourceType);
    setTopicArea(res.topicArea);
    setWorkPackage(res.workPackage);
    setCountryRelevance(res.countryRelevance);
    setUploadUrlOrLink(res.uploadUrlOrLink);
    setOwner(res.owner);
    setDateUploaded(res.dateUploaded);
    setVersionNumber(res.versionNumber);
    setStatus(res.status);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !uploadUrlOrLink.trim() || !owner.trim()) {
      alert('Please fill out all required fields: Title, Reference URL, and Owner.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        resourceType,
        topicArea,
        workPackage,
        countryRelevance,
        uploadUrlOrLink,
        owner,
        dateUploaded,
        versionNumber,
        status
      };

      if (editingResource) {
        await onUpdate({ ...editingResource, ...payload });
        setEditingResource(null);
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

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Video':
      case 'Recording':
        return <Video size={18} className="text-pink-500" />;
      case 'Slides':
        return <Bookmark size={18} className="text-orange-500" />;
      case 'Reading list':
      case 'Guidance document':
        return <BookOpen size={18} className="text-blue-500" />;
      default:
        return <FileText size={18} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header filter controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-3xl">
          {/* Search bar */}
          <div className="relative flex-grow max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search resource titles or topic areas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-transparent border-b border-slate-200 focus:border-brand-orange outline-none transition-colors text-sm"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400"><BookOpen size={12} className="inline mr-1" />Type:</span>
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700 font-bold"
            >
              <option value="All">All Types</option>
              {RESOURCE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          {/* Special Topic area Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400"><Filter size={12} className="inline mr-1" />Topic:</span>
            <select 
              value={filterTopic} 
              onChange={e => setFilterTopic(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700 font-bold"
            >
              <option value="All">All Topics</option>
              {TOPIC_AREAS.map(topic => <option key={topic} value={topic}>{topic}</option>)}
            </select>
          </div>
        </div>

        <div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand-orange hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-100"
          >
            <Plus size={14} />
            Add Resource
          </button>
        </div>
      </div>

      {/* Grid of Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-semibold bg-white border border-slate-200 rounded-3xl">
            No training resources match the search. Add a file link to populate your library.
          </div>
        ) : (
          filteredResources.map(res => (
            <div 
              key={res.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-brand-orange/30 transition-all flex flex-col justify-between group h-full shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    {getIconForType(res.resourceType)}
                  </div>
                  
                  <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full bg-slate-50">
                    {res.versionNumber}
                  </span>
                </div>

                {/* Info titles */}
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-orange transition-colors">
                  {res.title}
                </h4>
                
                {/* Categorisations */}
                <span className="text-[10px] text-brand-orange bg-orange-50 px-2 py-0.5 rounded mt-3 inline-block font-semibold">
                  {res.topicArea}
                </span>

                {/* Additional list attributes */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                  <div>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Work Package</span>
                    <span className="font-bold text-slate-700">{res.workPackage}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Country Relevance</span>
                    <span className="font-bold text-slate-700 truncate block">{res.countryRelevance}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Uploaded By</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                      <User size={10} /> {res.owner}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Date Added</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                      <Calendar size={10} /> {res.dateUploaded}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom footer button bar */}
              <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-50 text-[10px]">
                <a 
                  href={res.uploadUrlOrLink}
                  target="_blank"
                  rel="noreferrer referrer"
                  className="flex items-center gap-1 text-slate-600 hover:text-brand-orange hover:underline font-bold"
                >
                  <ExternalLink size={12} /> Access Document
                </a>

                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenEdit(res)}
                    className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  >
                    Edit
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this resource?')) {
                          onDelete(res.id!);
                        }
                      }}
                      className="p-1 hover:bg-slate-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
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

      {/* Resource Modal */}
      {(isAdding || editingResource) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingResource ? 'Edit Resource Details' : 'Publish Resource Entry'}
              </h3>
              <button 
                onClick={() => { setIsAdding(false); setEditingResource(null); }}
                className="p-1 text-slate-400 hover:bg-slate-200 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Resource Title *</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Guidance Protocol on Survivor Ethics in Low-Resource Research"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Resource Type *</label>
                  <select 
                    value={resourceType}
                    onChange={e => setResourceType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Topic Area */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Topic / Practice Area *</label>
                  <select 
                    value={topicArea}
                    onChange={e => setTopicArea(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    {TOPIC_AREAS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* WP */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Relevance (Work Package) *</label>
                  <select 
                    value={workPackage}
                    onChange={e => setWorkPackage(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    {WORK_PACKAGES.map(wp => <option key={wp} value={wp}>{wp}</option>)}
                  </select>
                </div>

                {/* Relevance (Country) */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Partner Country Relevance</label>
                  <input 
                    type="text" 
                    value={countryRelevance}
                    onChange={e => setCountryRelevance(e.target.value)}
                    placeholder="e.g. All partner countries, South Africa, Sri Lanka"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Reference URL */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">Upload Reference Link / File Hyperlink *</label>
                  <input 
                    type="url" 
                    required
                    value={uploadUrlOrLink}
                    onChange={e => setUploadUrlOrLink(e.target.value)}
                    placeholder="https://drive.google.com/file/..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Owner */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Resource Author / Owner *</label>
                  <input 
                    type="text" 
                    required
                    value={owner}
                    onChange={e => setOwner(e.target.value)}
                    placeholder="e.g. Dr. Jane Mpofu or Survivor Advisory Board"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Date Upl */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Date Uploaded *</label>
                  <input 
                    type="date" 
                    required
                    value={dateUploaded}
                    onChange={e => setDateUploaded(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Version */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Version Number</label>
                  <input 
                    type="text" 
                    value={versionNumber}
                    onChange={e => setVersionNumber(e.target.value)}
                    placeholder="V1.0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Resource Status *</label>
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-50 mt-4">
                <button 
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingResource(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-orange hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
                >
                  {isSaving ? 'Uploading...' : 'Publish Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
