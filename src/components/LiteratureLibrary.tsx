import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { LiteratureItem, UserProfile } from '../types';
import { hasActionPermission } from '../lib/permissions';
import { 
  BookOpen, 
  Search, 
  Plus, 
  FileText, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  ExternalLink,
  Eye,
  Link,
  Copy,
  BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';

interface LiteratureLibraryProps {
  isAdmin?: boolean;
  userProfile?: UserProfile | null;
}

const MATERIAL_TYPES = [
  'Academic Journal Article',
  'Methodology Guide',
  'Internal Programme Document',
  'Policy Brief',
  'Training Material',
  'Working Paper'
];

const WORK_PACKAGES = [
  'All WPs',
  'WP1 Survivor Panels',
  'WP2 Healthcare Burden',
  'WP3 Economic Cost',
  'WP4 What Works',
  'WP5 Knowledge Exchange',
  'Cross-cutting'
];

const DEMO_LITERATURE: Omit<LiteratureItem, 'id'>[] = [
  {
    title: 'Health System Interventions for Intimate Partner Violence in LMICs: Systematic Review',
    materialType: 'Academic Journal Article',
    description: 'A comprehensive review of primary care and hospital-based interventions for IPV in low- and middle-income country settings, evaluating screening protocols, referral cascades, and survivor-informed outcomes.',
    workPackageTag: 'WP2 Healthcare Burden',
    fileUrl: 'https://doi.org/10.1016/j.socscimed.2024.116890',
    uploadedAt: '2025-11-10'
  },
  {
    title: 'NIHR GHG VAWC Standardized Economic Costing Methodology Framework',
    materialType: 'Methodology Guide',
    description: 'Protocol document for quantifying direct and indirect costs of violence against women across our global research sites (India, South Africa, Sri Lanka), using micro-costing and lost-productivity instruments.',
    workPackageTag: 'WP3 Economic Cost',
    fileUrl: 'https://www.nihr.ac.uk/global-health/vawc-economic-costing',
    uploadedAt: '2026-02-01'
  },
  {
    title: 'Centering Lived Experience: Survivor Advisory Panels in Global Health Research',
    materialType: 'Policy Brief',
    description: 'Core briefing note on safeguarding, trauma-informed consent, equitable compensation, and governance for survivor-led research panels in resource-constrained environments.',
    workPackageTag: 'WP1 Survivor Panels',
    fileUrl: 'https://doi.org/10.1136/bmjgh-2025-014231',
    uploadedAt: '2026-03-15'
  }
];

export const LiteratureLibrary: React.FC<LiteratureLibraryProps> = ({ 
  isAdmin = false,
  userProfile = null 
}) => {
  const canEdit = hasActionPermission(userProfile, 'createEdit', !!isAdmin);
  // Users with create/edit functions are permitted to edit, add, and delete capacity building records
  const canDelete = hasActionPermission(userProfile, 'delete', !!isAdmin) || canEdit;

  const [items, setItems] = useState<LiteratureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWp, setSelectedWp] = useState('All WPs');
  const [selectedType, setSelectedType] = useState('All Types');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedViewItem, setSelectedViewItem] = useState<LiteratureItem | null>(null);
  const [editingItem, setEditingItem] = useState<LiteratureItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [copiedDoi, setCopiedDoi] = useState(false);

  const emptyForm: Omit<LiteratureItem, 'id'> = {
    title: '',
    materialType: 'Academic Journal Article',
    description: '',
    workPackageTag: 'WP1 Survivor Panels',
    fileUrl: ''
  };

  const [formData, setFormData] = useState<Omit<LiteratureItem, 'id'>>(emptyForm);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'literature_library'), (snapshot) => {
      const list: LiteratureItem[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as LiteratureItem);
      });
      setItems(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching literature library:', err);
      handleFirestoreError(err, OperationType.LIST, 'literature_library');
    });

    return () => unsub();
  }, []);

  const handleSeed = async () => {
    if (!canEdit) {
      alert('You do not have permission to seed literature records.');
      return;
    }
    try {
      for (const item of DEMO_LITERATURE) {
        const id = doc(collection(db, 'literature_library')).id;
        await setDoc(doc(db, 'literature_library', id), {
          ...item,
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser?.uid || 'system'
        });
      }
    } catch (err) {
      console.error('Error seeding demo literature:', err);
      handleFirestoreError(err, OperationType.CREATE, 'literature_library');
    }
  };

  const handleOpenAdd = () => {
    if (!canEdit) {
      alert('You do not have permission to add literature records.');
      return;
    }
    setEditingItem(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: LiteratureItem) => {
    if (!canEdit) {
      alert('You do not have permission to edit literature records.');
      return;
    }
    setEditingItem(item);
    setFormData({
      title: item.title,
      materialType: item.materialType,
      description: item.description,
      workPackageTag: item.workPackageTag || 'Cross-cutting',
      fileUrl: item.fileUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('You do not have permission to save literature records.');
      return;
    }
    try {
      const docId = editingItem?.id || doc(collection(db, 'literature_library')).id;
      
      const payload: Partial<LiteratureItem> = {
        title: formData.title,
        materialType: formData.materialType,
        description: formData.description,
        workPackageTag: formData.workPackageTag,
        fileUrl: formData.fileUrl?.trim() || '',
        updatedAt: new Date().toISOString()
      };

      if (!editingItem) {
        payload.createdAt = new Date().toISOString();
        payload.uploadedAt = new Date().toISOString().split('T')[0];
        payload.createdBy = auth.currentUser?.uid || 'user';
        payload.uploadedBy = auth.currentUser?.displayName || auth.currentUser?.email || 'Programme Member';
      }

      await setDoc(doc(db, 'literature_library', docId), payload, { merge: true });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving literature item:', err);
      handleFirestoreError(err, OperationType.CREATE, 'literature_library');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('You do not have permission to delete literature records.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'literature_library', id));
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting literature item:', err);
      handleFirestoreError(err, OperationType.DELETE, `literature_library/${id}`);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedDoi(true);
    setTimeout(() => setCopiedDoi(false), 2000);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.workPackageTag && item.workPackageTag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesWp = selectedWp === 'All WPs' || item.workPackageTag === selectedWp;
    const matchesType = selectedType === 'All Types' || item.materialType === selectedType;

    return matchesSearch && matchesWp && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-brand-orange font-black text-xs uppercase tracking-widest mb-1">
            <BookMarked size={16} /> Capacity Building Literature
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Programme Literature & Resource Library</h2>
          <p className="text-xs text-slate-500 mt-1">
            Official journal publications, methodology frameworks, policy briefs, and guidance documents across all work packages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-brand-orange text-white rounded-xl text-xs font-black shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add Literature Material
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex-1 min-w-[260px]">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search literature title, abstract, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-xs outline-none w-full text-slate-700 placeholder:text-slate-400 font-medium"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedWp}
            onChange={(e) => setSelectedWp(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            {WORK_PACKAGES.map(wp => (
              <option key={wp} value={wp}>{wp}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="All Types">All Material Types</option>
            {MATERIAL_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {canEdit && items.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Seed Initial Literature
            </button>
          )}
        </div>
      </div>

      {/* Literature Items Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-400 font-bold">
            Loading literature repository...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-2 p-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
            <BookOpen className="mx-auto text-slate-300" size={48} />
            <p className="text-sm font-bold text-slate-600">No literature items found.</p>
            <p className="text-xs text-slate-400">
              {canEdit ? 'Click "Add Literature Material" to catalog a publication or academic paper.' : 'Check back later or adjust your search filters.'}
            </p>
          </div>
        ) : (
          filteredItems.map(item => (
            <motion.div
              key={item.id}
              layout
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-brand-orange/40 transition-all shadow-sm hover:shadow-md relative flex flex-col justify-between group overflow-hidden"
            >
              <div 
                className="space-y-3 cursor-pointer"
                onClick={() => setSelectedViewItem(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-2 bg-brand-orange/10 text-brand-orange rounded-xl shrink-0">
                      <FileText size={18} />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange bg-brand-orange/5 px-2 py-0.5 rounded border border-brand-orange/10">
                        {item.materialType}
                      </span>
                      {item.workPackageTag && (
                        <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {item.workPackageTag}
                        </span>
                      )}
                    </div>
                  </div>

                  {(canEdit || canDelete) && (
                    <div 
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded-lg cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setItemToDelete(item.id || null)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-orange transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Card Footer: clean, fully contained */}
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                {item.fileUrl && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-150 rounded-xl min-w-0">
                    <Link size={12} className="shrink-0 text-blue-500" />
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline truncate"
                      title={item.fileUrl}
                    >
                      {item.fileUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <span className="text-[11px] text-slate-400 font-medium truncate">
                    {item.uploadedAt ? `Added ${item.uploadedAt}` : 'Programme Reference'}
                  </span>

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <button
                      onClick={() => setSelectedViewItem(item)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={13} className="text-brand-orange" /> View Details
                    </button>

                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 bg-brand-orange text-white hover:bg-orange-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <ExternalLink size={13} /> Open Link
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingItem ? 'Edit Literature Material' : 'Add Literature Material'}
                  </h3>
                  <p className="text-xs text-slate-500">Publication & Academic Reference Repository</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Title *</label>
                  <input 
                    required
                    type="text"
                    placeholder="Document title or research article headline"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Material Type</label>
                    <select
                      value={formData.materialType}
                      onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      {MATERIAL_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Work Package Tag</label>
                    <select
                      value={formData.workPackageTag}
                      onChange={(e) => setFormData({ ...formData, workPackageTag: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      {WORK_PACKAGES.filter(wp => wp !== 'All WPs').map(wp => (
                        <option key={wp} value={wp}>{wp}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description / Abstract *</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Brief abstract, methodology summary, or findings of the literature..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resource Web Link / DOI (Optional)</label>
                  <div className="relative">
                    <Link size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input 
                      type="url"
                      placeholder="https://doi.org/... or journal web URL"
                      value={formData.fileUrl || ''}
                      onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Provide direct DOI or journal link for readers to access the publication.</p>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={16} /> Save Literature
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Literature Detail Viewer Modal */}
      <AnimatePresence>
        {selectedViewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-2 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-lg border border-brand-orange/20">
                      {selectedViewItem.materialType}
                    </span>
                    {selectedViewItem.workPackageTag && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {selectedViewItem.workPackageTag}
                      </span>
                    )}
                    {selectedViewItem.uploadedAt && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        Added {selectedViewItem.uploadedAt}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                    {selectedViewItem.title}
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedViewItem(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Description / Abstract */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <FileText size={14} className="text-brand-orange" /> Abstract & Overview
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedViewItem.description}
                </p>
              </div>

              {/* Resource Web Link / DOI Card */}
              {selectedViewItem.fileUrl ? (
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Link size={12} /> Resource Web Link / DOI
                    </p>
                    <p className="text-xs font-bold text-slate-900 break-all">
                      {selectedViewItem.fileUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyLink(selectedViewItem.fileUrl || '')}
                      className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                    >
                      {copiedDoi ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedDoi ? 'Copied' : 'Copy'}
                    </button>
                    <a
                      href={selectedViewItem.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <ExternalLink size={12} /> Open Resource
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                  No external URL or DOI specified for this entry.
                </div>
              )}

              {/* Citation Suggestion */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Suggested Citation Format</p>
                <p className="font-mono text-slate-700 text-[11px] leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                  NIHR Global Health Research Group on Preventing Violence Against Women and Children. ({selectedViewItem.uploadedAt?.substring(0, 4) || '2026'}). {selectedViewItem.title}. {selectedViewItem.fileUrl || '[NIHR Programme Library]'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-medium">
                  {selectedViewItem.uploadedBy ? `Uploaded by: ${selectedViewItem.uploadedBy}` : 'NIHR Literature Library'}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedViewItem(null)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>

                  {selectedViewItem.fileUrl && (
                    <a
                      href={selectedViewItem.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                    >
                      <ExternalLink size={14} /> Open External Link / DOI
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => itemToDelete && handleDelete(itemToDelete)}
        title="Delete Literature Item?"
        message="Are you sure you want to remove this document from the Literature Library? This action cannot be undone."
        confirmText="Yes, Delete"
      />
    </div>
  );
};
