import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  Plus, 
  Edit2, 
  X, 
  Check, 
  FileText, 
  Calendar, 
  Share2, 
  Globe, 
  Trash2, 
  Download,
  Newspaper,
  BookOpen,
  Paperclip,
  Tag,
  Link as LinkIcon
} from 'lucide-react';
import { DisseminationItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';

interface CMSProps {
  items: DisseminationItem[];
  onAdd: (item: DisseminationItem) => void;
  onUpdate: (item: DisseminationItem) => void;
  onDelete: (id: string) => void;
}

type CmsPageTab = 'news_and_events' | 'resource_hub';

export const DisseminationRepo: React.FC<CMSProps> = ({ items, onAdd, onUpdate, onDelete }) => {
  const [activeCmsPage, setActiveCmsPage] = useState<CmsPageTab>('news_and_events');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [editingItem, setEditingItem] = useState<DisseminationItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Category options depending on active CMS page
  const newsAndEventsFilters = ['All', 'News & Updates', 'Publications', 'Events & Workshops'];
  const resourceHubFilters = ['All', 'Research', 'Policy', 'Guidance'];

  const currentFilters = activeCmsPage === 'news_and_events' ? newsAndEventsFilters : resourceHubFilters;

  // Filter logic
  const filteredItems = items.filter(item => {
    // Page filter
    const matchesPage = activeCmsPage === 'news_and_events'
      ? (item.cmsPage === 'news_and_events' || !item.cmsPage || ['Publication', 'Report', 'Event', 'Media', 'News & Updates', 'Publications', 'Events & Workshops'].includes(item.type))
      : (item.cmsPage === 'resource_hub' || ['Research', 'Policy', 'Guidance'].includes(item.type));

    // Category filter
    const matchesCategory = activeFilter === 'All' || item.type === activeFilter || item.category === activeFilter;

    // Search filter
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.summary.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPage && matchesCategory && matchesSearch;
  });

  const exportToCSV = () => {
    if (filteredItems.length === 0) return;

    const headers = ['Title', 'CMS Page', 'Category/Type', 'Date', 'Summary', 'Attachment/File', 'Links'];
    const rows = filteredItems.map(item => [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.cmsPage || activeCmsPage}"`,
      `"${item.type || item.category || 'General'}"`,
      `"${item.date}"`,
      `"${item.summary.replace(/"/g, '""')}"`,
      `"${item.fileName || item.attachmentUrl || ''}"`,
      `"${(item.links || []).map(l => `${l.label}: ${l.url}`).join('; ')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cms_${activeCmsPage}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = (item: DisseminationItem) => {
    const defaultType = activeCmsPage === 'news_and_events' ? 'News & Updates' : 'Research';
    const payload: DisseminationItem = {
      ...item,
      cmsPage: activeCmsPage,
      type: item.type || defaultType,
      category: item.type || defaultType
    };

    if (isAdding) {
      onAdd({ ...payload, id: Math.random().toString(36).substr(2, 9) });
    } else {
      onUpdate(payload);
    }
    setEditingItem(null);
    setIsAdding(false);
  };

  const handleDeleteItem = (id: string) => {
    onDelete(id);
    setEditingItem(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Publications':
      case 'Publication':
      case 'Research':
        return <FileText size={18} className="text-blue-500" />;
      case 'Events & Workshops':
      case 'Event':
        return <Calendar size={18} className="text-emerald-500" />;
      case 'News & Updates':
      case 'Media':
        return <Newspaper size={18} className="text-purple-500" />;
      case 'Policy':
      case 'Guidance':
        return <BookOpen size={18} className="text-amber-500" />;
      default:
        return <Globe size={18} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-brand-navy p-6 rounded-3xl text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-brand-orange text-white px-2.5 py-1 rounded-lg">
              Public Website CMS
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Connected with public-facing project website
            </span>
          </div>
          <h2 className="text-2xl font-black">Content Management System</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Manage public updates, research publications, upcoming workshops, policy guidance, and open access evidence resources.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={exportToCSV}
            disabled={filteredItems.length === 0}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/10 disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>

          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingItem({ 
                id: '', 
                title: '', 
                summary: '', 
                links: [], 
                date: new Date().toISOString().split('T')[0],
                type: activeCmsPage === 'news_and_events' ? 'News & Updates' : 'Research',
                cmsPage: activeCmsPage
              });
            }}
            className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            Add CMS Content
          </button>
        </div>
      </div>

      {/* Main Page Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveCmsPage('news_and_events');
              setActiveFilter('All');
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial justify-center",
              activeCmsPage === 'news_and_events'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Newspaper size={16} className={activeCmsPage === 'news_and_events' ? "text-brand-orange" : ""} />
            News and Events Page
          </button>

          <button
            onClick={() => {
              setActiveCmsPage('resource_hub');
              setActiveFilter('All');
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial justify-center",
              activeCmsPage === 'resource_hub'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <BookOpen size={16} className={activeCmsPage === 'resource_hub' ? "text-brand-orange" : ""} />
            Open Access Resource Hub
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search CMS entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
          />
        </div>
      </div>

      {/* Page Specific Subtitle & Sub-Filters */}
      {activeCmsPage === 'resource_hub' && (
        <div className="bg-orange-50/50 border border-brand-orange/20 p-4 rounded-2xl flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-700">
            <strong className="text-brand-orange">Open Access Resource Hub:</strong> A library of evidence-led materials, guidance documents, and research insights freely available for global use.
          </p>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">Filter By:</span>
        {currentFilters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap",
              activeFilter === filter 
                ? "bg-brand-navy text-white border-brand-navy shadow-sm" 
                : "bg-white text-slate-600 border-slate-200 hover:border-brand-orange/40 hover:text-brand-orange"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Grid of CMS Items */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <motion.div 
            layout
            key={item.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-brand-orange/30 transition-all group relative flex flex-col justify-between shadow-sm hover:shadow-md"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-brand-orange/10 transition-colors">
                    {getTypeIcon(item.type)}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {item.type || item.category || 'General'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400">{item.date}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button 
                      onClick={() => {
                        setIsAdding(false);
                        setEditingItem({
                          ...item,
                          links: item.links || (item.link ? [{ label: 'Link', url: item.link }] : [])
                        });
                      }}
                      className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:text-brand-orange hover:bg-brand-orange/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => setItemToDelete(item.id || null)}
                      className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug group-hover:text-brand-orange transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </div>

              {item.fileName && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Paperclip size={14} className="text-brand-orange shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 truncate flex-grow">
                    {item.fileName}
                  </span>
                  {item.attachmentUrl && (
                    <a 
                      href={item.attachmentUrl} 
                      download={item.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-brand-orange hover:underline shrink-0"
                    >
                      Download
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-slate-100">
              {item.links && item.links.length > 0 ? (
                item.links.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 bg-brand-orange/5 px-2.5 py-1 rounded-lg"
                  >
                    <LinkIcon size={12} />
                    {link.label || 'View Resource'}
                    <ExternalLink size={10} />
                  </a>
                ))
              ) : item.link && (
                <a 
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 bg-brand-orange/5 px-2.5 py-1 rounded-lg"
                >
                  <LinkIcon size={12} />
                  View Resource
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-medium text-sm">No items found for this selection.</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('All');
            }}
            className="text-brand-orange font-bold text-xs mt-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {isAdding ? 'Add Content Item' : 'Edit Content Item'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Page: {activeCmsPage === 'news_and_events' ? 'News & Events' : 'Open Access Resource Hub'}
                  </p>
                </div>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category / Type</label>
                    <select 
                      value={editingItem.type || ''}
                      onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    >
                      {activeCmsPage === 'news_and_events' ? (
                        <>
                          <option value="News & Updates">News & Updates</option>
                          <option value="Publications">Publications</option>
                          <option value="Events & Workshops">Events & Workshops</option>
                        </>
                      ) : (
                        <>
                          <option value="Research">Research</option>
                          <option value="Policy">Policy</option>
                          <option value="Guidance">Guidance</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Publication/Event Date</label>
                    <input 
                      type="date" 
                      value={editingItem.date || ''}
                      onChange={(e) => setEditingItem({...editingItem, date: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                  <input 
                    type="text" 
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    placeholder="Headline or document title"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Summary / Abstract</label>
                  <textarea 
                    rows={4}
                    value={editingItem.summary || ''}
                    onChange={(e) => setEditingItem({...editingItem, summary: e.target.value})}
                    placeholder="Brief description for public display..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none focus:ring-1 focus:ring-brand-orange"
                  />
                </div>

                {/* File Attachment */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Attach Document / Material File</label>
                  {editingItem.fileName && (
                    <p className="text-xs text-slate-700 font-semibold flex items-center gap-1">
                      <Paperclip size={12} className="text-brand-orange" /> {editingItem.fileName}
                    </p>
                  )}
                  <input 
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditingItem({
                            ...editingItem,
                            fileName: file.name,
                            attachmentUrl: reader.result as string
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-orange file:text-white cursor-pointer"
                  />
                </div>

                {/* Links */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">External Links</label>
                    <button 
                      type="button"
                      onClick={() => setEditingItem({
                        ...editingItem,
                        links: [...(editingItem.links || []), { label: '', url: '' }]
                      })}
                      className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Link
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {(editingItem.links || []).map((link, index) => (
                      <div key={index} className="flex gap-2 items-center p-2 bg-slate-50 rounded-xl">
                        <input 
                          placeholder="Label (e.g. PDF, Journal Link)"
                          value={link.label}
                          onChange={(e) => {
                            const newLinks = [...(editingItem.links || [])];
                            newLinks[index] = { ...newLinks[index], label: e.target.value };
                            setEditingItem({ ...editingItem, links: newLinks });
                          }}
                          className="w-1/3 px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none"
                        />
                        <input 
                          placeholder="URL (https://...)"
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...(editingItem.links || [])];
                            newLinks[index] = { ...newLinks[index], url: e.target.value };
                            setEditingItem({ ...editingItem, links: newLinks });
                          }}
                          className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const newLinks = [...(editingItem.links || [])];
                            newLinks.splice(index, 1);
                            setEditingItem({ ...editingItem, links: newLinks });
                          }}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
                {!isAdding ? (
                  <button 
                    onClick={() => setItemToDelete(editingItem.id || null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                ) : <div></div>}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleSave(editingItem)}
                    className="px-5 py-1.5 rounded-xl text-xs font-bold bg-brand-orange text-white shadow-md shadow-orange-100 hover:bg-orange-600 flex items-center gap-1"
                  >
                    <Check size={14} /> Save Entry
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => itemToDelete && handleDeleteItem(itemToDelete)}
        title="Delete Content Item?"
        message="Are you sure you want to remove this public website item? This action cannot be undone."
        confirmText="Yes, Delete Item"
      />
    </div>
  );
};
