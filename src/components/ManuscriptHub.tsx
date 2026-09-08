import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { Manuscript, TeamMember, UserProfile } from '../types';
import { hasActionPermission } from '../lib/permissions';
import { 
  FileText, 
  Search, 
  Plus, 
  Mail, 
  ExternalLink, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Users, 
  Sparkles, 
  BookOpen, 
  Send, 
  Globe, 
  Building, 
  Clock, 
  Download,
  MessageSquare,
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';

interface ManuscriptHubProps {
  isAdmin?: boolean;
  teamMembers?: TeamMember[];
  userProfile?: UserProfile | null;
}

const WRITING_STAGES = [
  'Concept / Outlining',
  'Drafting',
  'Internal Review & Feedback',
  'Under Revision',
  'Ready for Submission',
  'Submitted / Under Review'
];

const WORK_PACKAGES = [
  'All WPs',
  'Core',
  'WP1 Survivor Panels',
  'WP2 Healthcare Burden',
  'WP3 Economic Cost',
  'WP4 What Works',
  'WP5 Knowledge Exchange',
  'Cross-cutting'
];

const DEMO_MANUSCRIPTS: Omit<Manuscript, 'id'>[] = [
  {
    title: 'Healthcare Provider Preparedness and Readiness for Intimate Partner Violence in Primary Care: A Multi-Country Cross-Sectional Analysis',
    leadAuthorName: 'Dr. Shoba Suri',
    leadAuthorEmail: 'shoba.suri@phfi.org',
    leadAuthorInstitution: 'Public Health Foundation of India',
    leadAuthorCountry: 'India',
    leadAuthorOrcid: '0000-0002-1825-0097',
    coAuthors: ['Prof. Gene Feder', 'Dr. Neha Dhole', 'Mr. Mohammed Akbar', 'Prof. Sudha Ramalingam'],
    workPackage: 'WP2 Healthcare Burden',
    targetJournal: 'The Lancet Global Health',
    writingStage: 'Drafting',
    abstract: 'This multi-site study investigates primary healthcare provider knowledge, attitudes, institutional preparedness, and screening barriers when identifying and supporting survivors of intimate partner violence across public clinics in Tamil Nadu and Maharashtra.',
    keywords: ['Primary healthcare', 'Intimate partner violence', 'Provider readiness', 'Health systems', 'India'],
    ecrOpportunities: 'Welcoming ECR contribution on statistical subgroup analysis of rural vs urban clinic response times and qualitative provider quotes appraisal.',
    isOpenForCollaboration: true,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-28T14:30:00Z'
  },
  {
    title: 'Trauma-Informed Emergency Care Protocols for Women and Children in Resource-Constrained Settings',
    leadAuthorName: 'Ms. Athraa Fakier',
    leadAuthorEmail: 'athraa.fakier@uct.ac.za',
    leadAuthorInstitution: 'University of Cape Town',
    leadAuthorCountry: 'South Africa',
    leadAuthorOrcid: '0000-0003-4912-7714',
    coAuthors: ['Prof. Lillian Artz', 'Dr. Shanaaz Mathews', 'Dr. Nicolas Metheny'],
    workPackage: 'WP2 Healthcare Burden',
    targetJournal: 'BMC Public Health',
    writingStage: 'Internal Review & Feedback',
    abstract: 'A qualitative synthesis and protocol evaluation of hospital-level triage, forensic documentation, psychosocial referral pathways, and secondary trauma prevention among nurses treating survivors of gender-based violence in Cape Town metropolitan facilities.',
    keywords: ['Emergency medicine', 'Trauma-informed care', 'South Africa', 'Nursing protocols', 'Psychosocial support'],
    ecrOpportunities: 'Open to ECRs interested in reviewing the clinical referral algorithm flowchart and conducting literature comparisons with Latin American trauma models.',
    isOpenForCollaboration: true,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-03-01T11:20:00Z'
  },
  {
    title: 'Establishing Survivor Advisory Panels in Post-Conflict and LMIC Environments: Ethical Imperatives and Methodological Learnings',
    leadAuthorName: 'Miss Kamshana Kajendran',
    leadAuthorEmail: 'kamshana.k@univ.jfn.ac.lk',
    leadAuthorInstitution: 'University of Jaffna',
    leadAuthorCountry: 'Sri Lanka',
    leadAuthorOrcid: '0000-0001-8390-4421',
    coAuthors: ['Dr. S. Sivayokan', 'Prof. Kumaran', 'Dr. Jane Freedman', 'Ms. Moutushi Majumder'],
    workPackage: 'WP1 Survivor Panels',
    targetJournal: 'Social Science & Medicine',
    writingStage: 'Concept / Outlining',
    abstract: 'Synthesizes practical governance lessons from creating institutional survivor consultation panels in Northern Sri Lanka, addressing power asymmetries, linguistic adaptation of consent forms, re-traumatization safeguards, and participatory action research frameworks.',
    keywords: ['Survivor engagement', 'Participatory research', 'Northern Sri Lanka', 'Research ethics', 'Trauma safeguards'],
    ecrOpportunities: 'Seeking an ECR co-author to help draft the comparative methodology section on participatory research ethics across conflict-affected settings.',
    isOpenForCollaboration: true,
    createdAt: '2026-02-14T08:30:00Z',
    updatedAt: '2026-03-02T16:00:00Z'
  },
  {
    title: 'Micro-Costing the Economic Burden of Violence Against Women and Children on Primary Health Systems: A Standardized Measurement Protocol',
    leadAuthorName: 'Dr. Nicolas Metheny',
    leadAuthorEmail: 'nicolas.metheny@bristol.ac.uk',
    leadAuthorInstitution: 'University of Bristol',
    leadAuthorCountry: 'UK',
    leadAuthorOrcid: '0000-0002-9184-5510',
    coAuthors: ['Prof. Gene Feder', 'Mr. S Siva Prasad Dora', 'Prof. Lillian Artz'],
    workPackage: 'WP3 Economic Cost',
    targetJournal: 'Health Economics',
    writingStage: 'Under Revision',
    abstract: 'Presents a bottom-up micro-costing tool designed for LMIC health facilities, capturing clinician consultation minutes, medication expenses, forensic laboratory supplies, lost economic productivity, and downstream referral costs attributable to interpersonal violence.',
    keywords: ['Health economics', 'Micro-costing', 'Violence burden', 'Productivity loss', 'Economic evaluation'],
    ecrOpportunities: 'Currently seeking ECR assistance with Excel/R health-economic model sensitivity testing and formatting tables for final resubmission.',
    isOpenForCollaboration: true,
    createdAt: '2025-11-20T12:00:00Z',
    updatedAt: '2026-02-25T17:45:00Z'
  },
  {
    title: 'Survivor-Centered Qualitative Inquiry in Violence Prevention: Reflexivity, Power, and Emotional Safety for Researchers',
    leadAuthorName: 'Mr. Mohammed Akbar',
    leadAuthorEmail: 'mohammed.akbar@phfi.org',
    leadAuthorInstitution: 'Public Health Foundation of India',
    leadAuthorCountry: 'India',
    leadAuthorOrcid: '0000-0002-4419-8832',
    coAuthors: ['Ms. Moutushi Majumder', 'Dr. Neha Dhole', 'Dr. Shoba Suri'],
    workPackage: 'WP5 Knowledge Exchange',
    targetJournal: 'Qualitative Health Research',
    writingStage: 'Drafting',
    abstract: 'An empirical reflection on researcher emotional wellbeing, peer debriefing routines, and trauma-informed interviewing techniques practiced during deep qualitative field interviews with survivors and grassroots social workers in South Asia.',
    keywords: ['Qualitative methods', 'Researcher wellbeing', 'Reflexivity', 'South Asia', 'Trauma-informed interviewing'],
    ecrOpportunities: 'ECRs are warmly encouraged to join as co-authors to share qualitative field reflections or contribute to the debriefing protocols section.',
    isOpenForCollaboration: true,
    createdAt: '2026-01-28T14:15:00Z',
    updatedAt: '2026-03-03T10:00:00Z'
  }
];

export const ManuscriptHub: React.FC<ManuscriptHubProps> = ({ 
  isAdmin = false, 
  teamMembers = [], 
  userProfile 
}) => {
  const canEdit = hasActionPermission(userProfile, 'createEdit', !!isAdmin);
  // Users with create/edit functions are permitted to edit, add, and delete capacity building records
  const canDelete = hasActionPermission(userProfile, 'delete', !!isAdmin) || canEdit;
  const canExport = hasActionPermission(userProfile, 'export', !!isAdmin);

  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWp, setSelectedWp] = useState('All WPs');
  const [selectedStage, setSelectedStage] = useState('All Stages');
  const [onlyOpenCollab, setOnlyOpenCollab] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManuscript, setEditingManuscript] = useState<Manuscript | null>(null);
  const [selectedManuscriptForContact, setSelectedManuscriptForContact] = useState<Manuscript | null>(null);
  const [manuscriptToDelete, setManuscriptToDelete] = useState<string | null>(null);
  const [viewingManuscript, setViewingManuscript] = useState<Manuscript | null>(null);

  // ECR Contact Form State
  const [ecrName, setEcrName] = useState('');
  const [ecrEmail, setEcrEmail] = useState('');
  const [ecrRole, setEcrRole] = useState('Early Career Researcher / Fellow');
  const [collabType, setCollabType] = useState('Interested in contributing as Co-Author / Analysis');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSentToast, setContactSentToast] = useState(false);

  // Add/Edit Form State
  const emptyForm: Omit<Manuscript, 'id'> = {
    title: '',
    leadAuthorName: '',
    leadAuthorEmail: '',
    leadAuthorInstitution: '',
    leadAuthorCountry: 'India',
    leadAuthorOrcid: '',
    coAuthors: [],
    workPackage: 'WP1 Survivor Panels',
    targetJournal: '',
    writingStage: 'Drafting',
    abstract: '',
    keywords: [],
    ecrOpportunities: 'Open to ECR contributions; please get in touch with the lead author.',
    isOpenForCollaboration: true
  };

  const [formData, setFormData] = useState<Omit<Manuscript, 'id'>>(emptyForm);
  const [coAuthorsText, setCoAuthorsText] = useState('');
  const [keywordsText, setKeywordsText] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'manuscript_hub'), (snapshot) => {
      const list: Manuscript[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Manuscript);
      });
      setManuscripts(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching manuscripts:', err);
      handleFirestoreError(err, OperationType.LIST, 'manuscript_hub');
    });

    return () => unsub();
  }, []);

  // Pre-fill ECR info when opening contact modal
  useEffect(() => {
    if (selectedManuscriptForContact) {
      const defaultName = userProfile?.displayName || auth.currentUser?.displayName || '';
      const defaultEmail = userProfile?.email || auth.currentUser?.email || '';
      setEcrName(defaultName);
      setEcrEmail(defaultEmail);
      setContactMessage(
        `Dear ${selectedManuscriptForContact.leadAuthorName},\n\nI am writing as an Early Career Researcher in the NIHR Global Health Group on Preventing Violence Against Women and Children regarding your manuscript in progress: "${selectedManuscriptForContact.title}".\n\nI would be very interested in discussing how I could contribute to this work (e.g. data analysis, literature synthesis, or peer feedback).\n\nBest regards,\n${defaultName || '[Your Name]'}\n${defaultEmail || '[Your Email]'}`
      );
    }
  }, [selectedManuscriptForContact, userProfile]);

  const handleSeed = async () => {
    try {
      for (const m of DEMO_MANUSCRIPTS) {
        const id = doc(collection(db, 'manuscript_hub')).id;
        await setDoc(doc(db, 'manuscript_hub', id), {
          ...m,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: auth.currentUser?.uid || 'system'
        });
      }
    } catch (err) {
      console.error('Error seeding manuscripts:', err);
      handleFirestoreError(err, OperationType.CREATE, 'manuscript_hub');
    }
  };

  const handleOpenAdd = () => {
    if (!canEdit) {
      alert('You do not have permission to register manuscripts.');
      return;
    }
    setEditingManuscript(null);
    setFormData(emptyForm);
    setCoAuthorsText('');
    setKeywordsText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Manuscript) => {
    if (!canEdit) {
      alert('You do not have permission to edit manuscripts.');
      return;
    }
    setEditingManuscript(item);
    setFormData({
      title: item.title,
      leadAuthorName: item.leadAuthorName,
      leadAuthorEmail: item.leadAuthorEmail,
      leadAuthorInstitution: item.leadAuthorInstitution,
      leadAuthorCountry: item.leadAuthorCountry,
      leadAuthorOrcid: item.leadAuthorOrcid || '',
      coAuthors: item.coAuthors || [],
      workPackage: item.workPackage,
      targetJournal: item.targetJournal || '',
      writingStage: item.writingStage,
      abstract: item.abstract,
      keywords: item.keywords || [],
      ecrOpportunities: item.ecrOpportunities || '',
      isOpenForCollaboration: item.isOpenForCollaboration !== false
    });
    setCoAuthorsText((item.coAuthors || []).join(', '));
    setKeywordsText((item.keywords || []).join(', '));
    setIsModalOpen(true);
  };

  // Helper to pick team member and fill first author
  const handleSelectLeadFromTeam = (memberId: string) => {
    const found = teamMembers.find(t => t.id === memberId);
    if (!found) return;
    setFormData(prev => ({
      ...prev,
      leadAuthorName: found.name,
      leadAuthorEmail: found.email,
      leadAuthorInstitution: found.institution,
      leadAuthorCountry: found.country
    }));
  };

  const handleSaveManuscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('You do not have permission to save manuscripts.');
      return;
    }
    try {
      const docId = editingManuscript?.id || doc(collection(db, 'manuscript_hub')).id;
      const coAuthorsList = coAuthorsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const keywordsList = keywordsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload: Partial<Manuscript> = {
        title: formData.title,
        leadAuthorName: formData.leadAuthorName,
        leadAuthorEmail: formData.leadAuthorEmail,
        leadAuthorInstitution: formData.leadAuthorInstitution,
        leadAuthorCountry: formData.leadAuthorCountry,
        leadAuthorOrcid: formData.leadAuthorOrcid,
        coAuthors: coAuthorsList,
        workPackage: formData.workPackage,
        targetJournal: formData.targetJournal,
        writingStage: formData.writingStage,
        abstract: formData.abstract,
        keywords: keywordsList,
        ecrOpportunities: formData.ecrOpportunities,
        isOpenForCollaboration: formData.isOpenForCollaboration,
        updatedAt: new Date().toISOString()
      };

      if (!editingManuscript) {
        payload.createdAt = new Date().toISOString();
        payload.createdBy = auth.currentUser?.uid || 'user';
      }

      await setDoc(doc(db, 'manuscript_hub', docId), payload, { merge: true });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving manuscript:', err);
      handleFirestoreError(err, OperationType.CREATE, 'manuscript_hub');
    }
  };

  const handleDeleteManuscript = async (id: string) => {
    if (!canDelete && !isAdmin) {
      alert('You do not have permission to delete this manuscript.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'manuscript_hub', id));
      setManuscriptToDelete(null);
    } catch (err) {
      console.error('Error deleting manuscript:', err);
      handleFirestoreError(err, OperationType.DELETE, `manuscript_hub/${id}`);
    }
  };

  // ECR Contact submit
  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManuscriptForContact) return;

    const subject = encodeURIComponent(`[NIHR VAW/VAC ECR Inquiry] Collaboration on: "${selectedManuscriptForContact.title.substring(0, 45)}..."`);
    const body = encodeURIComponent(
      `To: ${selectedManuscriptForContact.leadAuthorName} (${selectedManuscriptForContact.leadAuthorInstitution})\n` +
      `From: ${ecrName} (${ecrEmail})\n` +
      `Role / Career Stage: ${ecrRole}\n` +
      `Inquiry Topic: ${collabType}\n` +
      `Manuscript: "${selectedManuscriptForContact.title}"\n` +
      `Work Package: ${selectedManuscriptForContact.workPackage}\n\n` +
      `Message:\n${contactMessage}\n\n` +
      `-- Sent via NIHR Global Health Manuscript Hub`
    );

    // Launch mailto
    const mailtoUrl = `mailto:${selectedManuscriptForContact.leadAuthorEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;

    setContactSentToast(true);
    setTimeout(() => {
      setContactSentToast(false);
      setSelectedManuscriptForContact(null);
    }, 2500);
  };

  const handleExportCsv = () => {
    const headers = [
      'Title',
      'First Author Name',
      'First Author Email',
      'Institution',
      'Country',
      'Work Package',
      'Writing Stage',
      'Target Journal',
      'Co-Authors',
      'Open For ECR Collaboration',
      'ECR Opportunities'
    ];

    const rows = manuscripts.map(m => [
      `"${(m.title || '').replace(/"/g, '""')}"`,
      `"${(m.leadAuthorName || '').replace(/"/g, '""')}"`,
      `"${m.leadAuthorEmail || ''}"`,
      `"${(m.leadAuthorInstitution || '').replace(/"/g, '""')}"`,
      `"${m.leadAuthorCountry || ''}"`,
      `"${m.workPackage || ''}"`,
      `"${m.writingStage || ''}"`,
      `"${(m.targetJournal || '').replace(/"/g, '""')}"`,
      `"${(m.coAuthors || []).join('; ').replace(/"/g, '""')}"`,
      m.isOpenForCollaboration ? 'Yes' : 'No',
      `"${(m.ecrOpportunities || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NIHR_Manuscript_Hub_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredManuscripts = manuscripts.filter(m => {
    const matchesSearch = 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.leadAuthorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.leadAuthorInstitution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.targetJournal && m.targetJournal.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.keywords && m.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesWp = selectedWp === 'All WPs' || m.workPackage === selectedWp;
    const matchesStage = selectedStage === 'All Stages' || m.writingStage === selectedStage;
    const matchesCollab = !onlyOpenCollab || m.isOpenForCollaboration;

    return matchesSearch && matchesWp && matchesStage && matchesCollab;
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Concept / Outlining':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Drafting':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Internal Review & Feedback':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Under Revision':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Ready for Submission':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Submitted / Under Review':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-brand-orange font-black text-xs uppercase tracking-widest mb-1">
            <BookOpen size={16} /> Inter-Team Academic Writing & Mentorship
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manuscript Hub & ECR Collaboration</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Explore manuscripts currently being authored across work packages and country teams (India, South Africa, Sri Lanka, UK).
            Early Career Researchers (ECRs) can directly contact first authors to inquire about co-authorship, data analysis, or internal peer review.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {canExport && (
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Download registry spreadsheet"
            >
              <Download size={14} /> Export CSV
            </button>
          )}

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-brand-orange text-white rounded-xl text-xs font-black shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Register Manuscript
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Manuscripts</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{manuscripts.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">In active development</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-widest text-brand-orange">Open to ECRs</p>
          <p className="text-2xl font-black text-brand-orange mt-1">
            {manuscripts.filter(m => m.isOpenForCollaboration).length}
          </p>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Active collaboration calls</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">In Review / Revision</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {manuscripts.filter(m => m.writingStage.includes('Review') || m.writingStage.includes('Revision')).length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Near submission</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Country Hubs</p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {new Set(manuscripts.map(m => m.leadAuthorCountry)).size || 4}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Multi-country writing teams</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex-1 min-w-[260px]">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search manuscript title, first author, target journal, or keyword..."
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
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="All Stages">All Stages</option>
            {WRITING_STAGES.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyOpenCollab}
              onChange={(e) => setOnlyOpenCollab(e.target.checked)}
              className="rounded text-brand-orange focus:ring-brand-orange"
            />
            <span>Open to ECRs</span>
          </label>

          {manuscripts.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Seed Initial Manuscripts
            </button>
          )}
        </div>
      </div>

      {/* Manuscripts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-400 font-bold">
            Loading Manuscript Hub...
          </div>
        ) : filteredManuscripts.length === 0 ? (
          <div className="col-span-2 p-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
            <FileText className="mx-auto text-slate-300" size={48} />
            <p className="text-base font-bold text-slate-700">No manuscripts found matching criteria.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try adjusting your search filters or click "Register Manuscript" to add a new writing project.
            </p>
            {manuscripts.length === 0 && (
              <button
                onClick={handleSeed}
                className="mt-3 px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl shadow-sm hover:bg-orange-600"
              >
                Load Default NIHR Research Manuscripts
              </button>
            )}
          </div>
        ) : (
          filteredManuscripts.map(manuscript => (
            <motion.div
              key={manuscript.id}
              layout
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-brand-orange/40 transition-all shadow-sm hover:shadow-md flex flex-col justify-between group space-y-4"
            >
              {/* Top Meta Badges & Actions */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {manuscript.workPackage}
                    </span>
                    <span className={cn("text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border", getStageColor(manuscript.writingStage))}>
                      {manuscript.writingStage}
                    </span>
                    {manuscript.isOpenForCollaboration && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Sparkles size={10} /> ECR Open
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(manuscript)}
                        className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded-lg cursor-pointer"
                        title="Edit Manuscript"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {(isAdmin || canDelete || manuscript.createdBy === auth.currentUser?.uid) && (
                      <button
                        onClick={() => setManuscriptToDelete(manuscript.id || null)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Manuscript"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Working Title */}
                <h3 
                  onClick={() => setViewingManuscript(manuscript)}
                  className="text-base font-bold text-slate-900 group-hover:text-brand-orange transition-colors leading-snug cursor-pointer"
                >
                  {manuscript.title}
                </h3>

                {/* Target Journal */}
                {manuscript.targetJournal && (
                  <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                    <Award size={12} className="text-brand-orange" /> Target Journal: <span className="text-slate-800 font-bold">{manuscript.targetJournal}</span>
                  </p>
                )}

                {/* Lead Author Profile Strip */}
                <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-xs font-black shrink-0">
                      {manuscript.leadAuthorName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {manuscript.leadAuthorName}
                        <span className="text-[10px] text-slate-400 font-medium font-mono">({manuscript.leadAuthorCountry})</span>
                      </p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[230px]">
                        {manuscript.leadAuthorInstitution}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded shrink-0">
                    First Author
                  </span>
                </div>

                {/* Abstract Preview */}
                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed font-medium">
                  {manuscript.abstract}
                </p>

                {/* ECR Collaboration Note Box */}
                {manuscript.ecrOpportunities && (
                  <div className="mt-3 p-2.5 bg-orange-50/70 border border-orange-200/70 rounded-xl text-xs text-orange-950 font-medium flex items-start gap-2">
                    <Sparkles size={14} className="text-brand-orange shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span className="font-bold text-brand-orange text-[10px] uppercase tracking-wider block">ECR Collaboration Opportunity:</span>
                      {manuscript.ecrOpportunities}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewingManuscript(manuscript)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                >
                  View Details <ChevronRight size={14} />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedManuscriptForContact(manuscript)}
                    className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                  >
                    <Mail size={13} /> Contact First Author
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Contact First Author Modal */}
      <AnimatePresence>
        {selectedManuscriptForContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 text-brand-orange text-[11px] font-black uppercase tracking-wider">
                    <Mail size={14} /> ECR Mentorship & Collaboration
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Contact First Author
                  </h3>
                  <p className="text-xs text-slate-500">Reach out directly to propose collaboration or review</p>
                </div>
                <button 
                  onClick={() => setSelectedManuscriptForContact(null)} 
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              {/* First Author Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange text-white flex items-center justify-center text-sm font-black shrink-0">
                    {selectedManuscriptForContact.leadAuthorName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedManuscriptForContact.leadAuthorName}
                    </p>
                    <p className="text-xs text-slate-600">
                      {selectedManuscriptForContact.leadAuthorInstitution} • {selectedManuscriptForContact.leadAuthorCountry}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {selectedManuscriptForContact.leadAuthorEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Manuscript Title Snippet */}
              <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange block mb-0.5">
                  Target Manuscript ({selectedManuscriptForContact.workPackage})
                </span>
                <p className="font-bold text-slate-800 leading-snug">
                  {selectedManuscriptForContact.title}
                </p>
              </div>

              {contactSentToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check size={16} className="text-emerald-600" />
                  Your mail client has been opened with your message. The inquiry draft has been sent to {selectedManuscriptForContact.leadAuthorName}!
                </div>
              )}

              {/* Contact Form */}
              <form onSubmit={handleSendContact} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="Your full name"
                      value={ecrName}
                      onChange={(e) => setEcrName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Email *</label>
                    <input
                      required
                      type="email"
                      placeholder="you@institution.ac.uk"
                      value={ecrEmail}
                      onChange={(e) => setEcrEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Career Stage / Role</label>
                    <select
                      value={ecrRole}
                      onChange={(e) => setEcrRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      <option value="PhD Fellow (NIHR Academy)">PhD Fellow (NIHR Academy)</option>
                      <option value="Early Career Researcher (ECR)">Early Career Researcher (ECR)</option>
                      <option value="Research Assistant / Officer">Research Assistant / Officer</option>
                      <option value="Master's Student (MPH / MSc)">Master's Student (MPH / MSc)</option>
                      <option value="Postdoctoral Research Fellow">Postdoctoral Research Fellow</option>
                      <option value="Other Project Team Member">Other Project Team Member</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Collaboration Interest</label>
                    <select
                      value={collabType}
                      onChange={(e) => setCollabType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      <option value="Interested in contributing as Co-Author / Analysis">Co-Author / Analysis</option>
                      <option value="Offer Peer Review / Internal Feedback">Internal Peer Review</option>
                      <option value="Cross-WP Data / Findings Alignment">Cross-WP Alignment</option>
                      <option value="Request Draft for Learning & Mentorship">Mentorship Discussion</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Message Body *</label>
                  <textarea
                    required
                    rows={6}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none focus:ring-2 focus:ring-brand-orange/20 font-sans"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Clicking send will automatically format an official email addressed to {selectedManuscriptForContact.leadAuthorName}.
                  </p>
                </div>

                <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedManuscriptForContact(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand-orange text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 flex items-center gap-2 cursor-pointer"
                  >
                    <Send size={14} /> Send Inquiry to First Author
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Manuscript Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingManuscript ? 'Edit Manuscript Record' : 'Register New Project Manuscript'}
                  </h3>
                  <p className="text-xs text-slate-500">Track papers in preparation and invite ECR co-authors</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveManuscript} className="space-y-4">
                {/* Team Directory Quick-Pick */}
                {teamMembers.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Quick-Select Lead Author from Team Directory (Optional)
                    </label>
                    <select
                      onChange={(e) => handleSelectLeadFromTeam(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none text-slate-700"
                    >
                      <option value="">-- Choose team member to populate author details --</option>
                      {teamMembers.map(tm => (
                        <option key={tm.id} value={tm.id}>
                          {tm.name} ({tm.institution}, {tm.country})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Manuscript Working Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="Full working title of the paper or review"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">First Author Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Dr. Shoba Suri"
                      value={formData.leadAuthorName}
                      onChange={(e) => setFormData({ ...formData, leadAuthorName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">First Author Email *</label>
                    <input
                      required
                      type="email"
                      placeholder="author@institution.org"
                      value={formData.leadAuthorEmail}
                      onChange={(e) => setFormData({ ...formData, leadAuthorEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employing Institution *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. PHFI, UCT, Univ of Jaffna"
                      value={formData.leadAuthorInstitution}
                      onChange={(e) => setFormData({ ...formData, leadAuthorInstitution: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Country *</label>
                    <input
                      required
                      type="text"
                      placeholder="India, South Africa, Sri Lanka, UK"
                      value={formData.leadAuthorCountry}
                      onChange={(e) => setFormData({ ...formData, leadAuthorCountry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ORCiD (Optional)</label>
                    <input
                      type="text"
                      placeholder="0000-0000-0000-0000"
                      value={formData.leadAuthorOrcid || ''}
                      onChange={(e) => setFormData({ ...formData, leadAuthorOrcid: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Work Package Tag</label>
                    <select
                      value={formData.workPackage}
                      onChange={(e) => setFormData({ ...formData, workPackage: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      {WORK_PACKAGES.filter(wp => wp !== 'All WPs').map(wp => (
                        <option key={wp} value={wp}>{wp}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Writing Stage</label>
                    <select
                      value={formData.writingStage}
                      onChange={(e) => setFormData({ ...formData, writingStage: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      {WRITING_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Journal</label>
                    <input
                      type="text"
                      placeholder="e.g. Lancet Global Health"
                      value={formData.targetJournal || ''}
                      onChange={(e) => setFormData({ ...formData, targetJournal: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Co-Authors (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Prof. Gene Feder, Dr. Neha Dhole, Athraa Fakier..."
                    value={coAuthorsText}
                    onChange={(e) => setCoAuthorsText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abstract / Summary *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide overview of objectives, methodology, preliminary findings, or scope..."
                    value={formData.abstract}
                    onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ECR Collaboration Opportunities</label>
                  <textarea
                    rows={2}
                    placeholder="Describe specific ways Early Career Researchers can contribute (e.g. data synthesis, review, statistical appendix)..."
                    value={formData.ecrOpportunities || ''}
                    onChange={(e) => setFormData({ ...formData, ecrOpportunities: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50/60 rounded-xl border border-orange-200">
                  <input
                    type="checkbox"
                    id="collabCheck"
                    checked={formData.isOpenForCollaboration}
                    onChange={(e) => setFormData({ ...formData, isOpenForCollaboration: e.target.checked })}
                    className="rounded text-brand-orange focus:ring-brand-orange h-4 w-4"
                  />
                  <label htmlFor="collabCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Flag as "Open to ECR Collaboration" (shows active call on the hub)
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
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
                    <Check size={16} /> Save Manuscript
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Viewing Manuscript Full Modal */}
      <AnimatePresence>
        {viewingManuscript && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="space-y-1.5 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {viewingManuscript.workPackage}
                    </span>
                    <span className={cn("text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border", getStageColor(viewingManuscript.writingStage))}>
                      {viewingManuscript.writingStage}
                    </span>
                    {viewingManuscript.targetJournal && (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                        Target: {viewingManuscript.targetJournal}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 leading-snug">
                    {viewingManuscript.title}
                  </h2>
                </div>
                <button onClick={() => setViewingManuscript(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {/* Lead Author Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange">Lead / First Author</span>
                  <p className="text-sm font-bold text-slate-900">{viewingManuscript.leadAuthorName}</p>
                  <p className="text-xs text-slate-600">{viewingManuscript.leadAuthorInstitution} • {viewingManuscript.leadAuthorCountry}</p>
                  <p className="text-xs font-mono text-slate-500">{viewingManuscript.leadAuthorEmail}</p>
                  {viewingManuscript.leadAuthorOrcid && (
                    <p className="text-[11px] font-mono text-slate-400">ORCiD: {viewingManuscript.leadAuthorOrcid}</p>
                  )}
                </div>

                <button
                  onClick={() => {
                    const m = viewingManuscript;
                    setViewingManuscript(null);
                    setSelectedManuscriptForContact(m);
                  }}
                  className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  <Mail size={14} /> Contact First Author
                </button>
              </div>

              {/* Co-Authors */}
              {viewingManuscript.coAuthors && viewingManuscript.coAuthors.length > 0 && (
                <div className="space-y-1 text-xs">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Co-Authors & Collaborators</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingManuscript.coAuthors.map((author, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs">
                        {author}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Abstract */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Manuscript Abstract / Scope</p>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {viewingManuscript.abstract}
                </p>
              </div>

              {/* ECR Collaboration Note */}
              {viewingManuscript.ecrOpportunities && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange flex items-center gap-1">
                    <Sparkles size={12} /> Early Career Researcher Collaboration Opportunity
                  </p>
                  <p className="text-xs text-orange-950 font-medium leading-relaxed">
                    {viewingManuscript.ecrOpportunities}
                  </p>
                </div>
              )}

              <div className="pt-3 flex justify-end border-t border-slate-100">
                <button
                  onClick={() => setViewingManuscript(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!manuscriptToDelete}
        onClose={() => setManuscriptToDelete(null)}
        onConfirm={() => manuscriptToDelete && handleDeleteManuscript(manuscriptToDelete)}
        title="Delete Manuscript Record?"
        message="Are you sure you want to remove this manuscript from the Manuscript Hub? This action cannot be undone."
        confirmText="Yes, Delete"
      />
    </div>
  );
};
