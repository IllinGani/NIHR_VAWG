import React, { useState, useEffect } from 'react';
import { 
  db, 
  auth 
} from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { NihrTrainee, UserProfile } from '../types';
import { hasActionPermission } from '../lib/permissions';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Download, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  UserCheck, 
  Mail, 
  Building2, 
  Globe, 
  Award, 
  BookOpen, 
  Info,
  Calendar,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';

interface NihrAcademyProps {
  isAdmin?: boolean;
  userProfile?: UserProfile | null;
}

const COUNTRIES = ['India', 'South Africa', 'Sri Lanka', 'UK', 'Brazil', 'Peru', 'Mexico', 'Canada', 'USA', 'Other'];

export const NIHR_ACADEMY_PDF_TRAINEES: NihrTrainee[] = [
  {
    id: 'nihr-moutushi-majumder',
    title: 'Ms.',
    firstName: 'Moutushi',
    lastName: 'Majumder',
    degreeType: 'PhD',
    startDate: 'TBD',
    finishDate: 'TBD',
    anticipatedDegreeAwardDate: 'TBD',
    professionalBackground: 'other health professional',
    percentNihrFunding: '25%+',
    nationality: 'Indian',
    employingOrgCountry: 'India',
    employingOrgName: 'Public Health Foundation of India',
    traineeMainLocationCountry: 'India',
    projectName: 'Research Group Violence Against Women and Violence Against Children (VAW&VAC).',
    nextDestination: 'N/A',
    orcid: '0000-0002-0012-5896',
    email: 'moutushi.majumder@phfi.org',
    hasMentor: 'LMIC',
    plainEnglishSummary: 'Tentative PhD theme - Real engagement with VAW/C survivors in health system and policy landscape',
    gender: 'F'
  },
  {
    id: 'nihr-neha-dhole',
    title: 'Dr.',
    firstName: 'Neha',
    lastName: 'Dhole',
    degreeType: 'NA',
    startDate: 'TBD',
    finishDate: 'TBD',
    anticipatedDegreeAwardDate: 'N/A',
    professionalBackground: 'other health professional',
    percentNihrFunding: '25%+',
    nationality: 'Indian',
    employingOrgCountry: 'India',
    employingOrgName: 'Public Health Foundation of India',
    traineeMainLocationCountry: 'India',
    projectName: 'Research Group Violence Against Women and Violence Against Children (VAW&VAC).',
    nextDestination: 'N/A',
    orcid: '0009-0005-8092-3757',
    email: 'neha.dhole@phfi.org',
    hasMentor: 'LMIC',
    plainEnglishSummary: 'Capacity-building in trauma-informed research',
    gender: 'F'
  },
  {
    id: 'nihr-mohammed-akbar',
    title: 'Mr.',
    firstName: 'Mohammed',
    lastName: 'Akbar',
    degreeType: 'NA',
    startDate: 'TBD',
    finishDate: 'TBD',
    anticipatedDegreeAwardDate: 'N/A',
    professionalBackground: 'other health professional',
    percentNihrFunding: '25%+',
    nationality: 'Indian',
    employingOrgCountry: 'India',
    employingOrgName: 'Public Health Foundation of India',
    traineeMainLocationCountry: 'India',
    projectName: 'Research Group Violence Against Women and Violence Against Children (VAW&VAC).',
    nextDestination: 'N/A',
    orcid: '0000-0001-6354-2016',
    email: 'md.akbar@phfi.org',
    hasMentor: 'LMIC',
    plainEnglishSummary: 'Capacity-building in trauma-informed research, qualitative research methods',
    gender: 'M'
  },
  {
    id: 'nihr-s-siva-prasad-dora',
    title: 'Mr.',
    firstName: 'S Siva Prasad',
    lastName: 'Dora',
    degreeType: 'NA',
    startDate: 'TBD',
    finishDate: 'TBD',
    anticipatedDegreeAwardDate: 'N/A',
    professionalBackground: 'not a health professional',
    percentNihrFunding: '25%+',
    nationality: 'Indian',
    employingOrgCountry: 'India',
    employingOrgName: 'Public Health Foundation of India',
    traineeMainLocationCountry: 'India',
    projectName: 'Research Group Violence Against Women and Violence Against Children (VAW&VAC).',
    nextDestination: 'N/A',
    orcid: '0009-0003-2290-7463',
    email: 'ssiva.dora@phfi.org',
    hasMentor: 'LMIC',
    plainEnglishSummary: 'Capacity-building in trauma-informed research, qualitative research methods',
    gender: 'M'
  },
  {
    id: 'nihr-athraa-fakier',
    title: 'Ms.',
    firstName: 'Athraa',
    lastName: 'Fakier',
    degreeType: 'Masters Degree in Public Health',
    startDate: 'Jan-25',
    finishDate: 'Dec-26',
    anticipatedDegreeAwardDate: 'Dec-26',
    professionalBackground: 'Social Work',
    percentNihrFunding: '70%',
    nationality: 'South African',
    employingOrgCountry: 'South Africa',
    employingOrgName: 'University of Cape Town',
    traineeMainLocationCountry: 'South Africa',
    projectName: 'Research Group Violence Against Women and Violence Against Children (VAW&VAC).',
    nextDestination: 'N/A',
    orcid: '',
    email: 'athraa.fakier@uct.ac.za',
    hasMentor: 'LMIC',
    plainEnglishSummary: 'Ms Fakier has been part of team who are working on a range of violence prevention projects. She has been embedded in the team and had developed skills to conduct systematic review ; conducting qualitaive interviews and focus group as well as analysis of qualitative data. She has also been focussed on understanding violence prevention programming.',
    gender: 'F'
  },
  {
    id: 'nihr-kamshana-kajendran',
    title: 'Miss',
    firstName: 'Kamshana',
    lastName: 'Kajendran',
    degreeType: 'Selected as Project based PhD fellow',
    startDate: '2026',
    finishDate: '2029',
    anticipatedDegreeAwardDate: 'N/A',
    professionalBackground: '1. Bachelors of Pharmacy Hons in University of Jaffna, 2. Certificate in Postgraduate research in University of Colombo, 3. Graduate teaching assistant for 1 year in department of pharmacy, Faculty of Allied Health Sciences, 4. Research assistant in Regional Collaborating Centre, Faculty of Medicine, University of Jaffna',
    percentNihrFunding: '100% (fully funded)',
    nationality: 'Sri Lankan',
    employingOrgCountry: 'Sri Lanka',
    employingOrgName: 'University of Jaffna',
    traineeMainLocationCountry: 'Sri Lanka',
    projectName: 'Global NIHR Violence Against Women and Children Project (Work Package 01)',
    nextDestination: 'N/A',
    orcid: '0009-0007-1937-5442',
    email: 'kamshanak@univ.jfn.ac.lk',
    hasMentor: 'LMIC - Sri Lanka',
    plainEnglishSummary: 'Ms.Kamshana has been selected as the project based PhD fellow for the Work Package 01 (developing diverse representative and inclusive survivor panels) of Global NIHR VAWC Project.',
    gender: 'F'
  }
];

export const NihrAcademy: React.FC<NihrAcademyProps> = ({ 
  isAdmin = false,
  userProfile = null 
}) => {
  const canEdit = hasActionPermission(userProfile, 'createEdit', !!isAdmin);
  // Users with create/edit functions are permitted to edit, add, and delete capacity building records
  const canDelete = hasActionPermission(userProfile, 'delete', !!isAdmin) || canEdit;
  const canExport = hasActionPermission(userProfile, 'export', !!isAdmin);

  const [trainees, setTrainees] = useState<NihrTrainee[]>(NIHR_ACADEMY_PDF_TRAINEES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('All');
  const [filterFunding, setFilterFunding] = useState<string>('All');
  const [filterDegree, setFilterDegree] = useState<string>('All');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState<NihrTrainee | null>(null);
  const [traineeToDelete, setTraineeToDelete] = useState<string | null>(null);
  const [selectedTraineeForView, setSelectedTraineeForView] = useState<NihrTrainee | null>(null);

  const emptyFormData: Omit<NihrTrainee, 'id'> = {
    title: 'Dr.',
    firstName: '',
    lastName: '',
    degreeType: 'PhD',
    startDate: 'TBD',
    finishDate: 'TBD',
    anticipatedDegreeAwardDate: '',
    professionalBackground: 'other health professional',
    percentNihrFunding: '25%+',
    nationality: '',
    employingOrgCountry: 'India',
    employingOrgName: '',
    traineeMainLocationCountry: 'India',
    projectName: 'Research Group Violence Against Women and Violence Against Children (VAW&VAC).',
    nextDestination: '',
    orcid: '',
    email: '',
    hasMentor: 'LMIC',
    plainEnglishSummary: '',
    gender: 'F'
  };

  const [formData, setFormData] = useState<Omit<NihrTrainee, 'id'>>(emptyFormData);

  // Firestore Real-time Sync
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'nihr_academy_trainees'), async (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed from PDF if collection is currently empty
        setTrainees(NIHR_ACADEMY_PDF_TRAINEES);
        setLoading(false);
        try {
          for (const item of NIHR_ACADEMY_PDF_TRAINEES) {
            await setDoc(doc(db, 'nihr_academy_trainees', item.id!), {
              ...item,
              createdAt: new Date().toISOString(),
              createdBy: 'system_pdf_import'
            });
          }
        } catch (err) {
          console.warn('Could not auto-write to Firestore, local state active:', err);
        }
      } else {
        const list: NihrTrainee[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as NihrTrainee);
        });
        list.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
        setTrainees(list);
        setLoading(false);
      }
    }, (err) => {
      console.warn('Firestore subscription fallback to PDF data:', err);
      setTrainees(NIHR_ACADEMY_PDF_TRAINEES);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Sync / Re-import official PDF data into Firestore
  const handleSyncPdfData = async () => {
    if (!canEdit) {
      alert('You do not have permission to sync or edit NIHR Academy records.');
      return;
    }
    setIsSyncing(true);
    try {
      for (const item of NIHR_ACADEMY_PDF_TRAINEES) {
        await setDoc(doc(db, 'nihr_academy_trainees', item.id!), {
          ...item,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser?.uid || 'pdf_import'
        }, { merge: true });
      }
      setSyncSuccessMessage('Successfully imported all 6 trainee records from official NIHR PDF!');
      setTimeout(() => setSyncSuccessMessage(null), 4000);
    } catch (e) {
      console.error('Error syncing PDF data:', e);
      handleFirestoreError(e, OperationType.WRITE, 'nihr_academy_trainees');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenAdd = () => {
    if (!canEdit) {
      alert('You do not have permission to create or edit trainee records.');
      return;
    }
    setEditingTrainee(null);
    setFormData(emptyFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (trainee: NihrTrainee) => {
    if (!canEdit) {
      alert('You do not have permission to edit trainee records.');
      return;
    }
    setEditingTrainee(trainee);
    const { id, ...rest } = trainee;
    setFormData(rest);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('You do not have permission to create or edit trainee records.');
      return;
    }
    const user = auth.currentUser;
    if (!formData.firstName || !formData.lastName || !formData.email) return;

    try {
      if (editingTrainee?.id) {
        await setDoc(doc(db, 'nihr_academy_trainees', editingTrainee.id), {
          ...formData,
          id: editingTrainee.id,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.uid || ''
        }, { merge: true });
      } else {
        const newDocRef = doc(collection(db, 'nihr_academy_trainees'));
        await setDoc(newDocRef, {
          ...formData,
          id: newDocRef.id,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || ''
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'nihr_academy_trainees');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('You do not have permission to delete trainee records.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'nihr_academy_trainees', id));
      setTraineeToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `nihr_academy_trainees/${id}`);
    }
  };

  // CSV Export for NIHR Governance Reporting
  const exportToCSV = () => {
    if (trainees.length === 0) return;

    const headers = [
      'Title',
      'First Name',
      'Last Name',
      'Type of Higher Degree Being Undertaken',
      'Start Date',
      'Finish Date',
      'Anticipated Degree Award Date',
      'Professional Background',
      '% Time Funded Through NIHR Funding',
      "Trainee's Nationality",
      'Country of Employing Organisation',
      'Name of Employing Organisation',
      'Main Location of Trainee (country)',
      'Name of Project',
      'Next Destination',
      'ORCiD',
      "Trainee's Email Address",
      'Does the trainee have a mentor?',
      'Plain English Summary',
      "Trainee's Gender"
    ];

    const rows = filteredTrainees.map(t => [
      `"${t.title || ''}"`,
      `"${t.firstName || ''}"`,
      `"${t.lastName || ''}"`,
      `"${t.degreeType || ''}"`,
      `"${t.startDate || ''}"`,
      `"${t.finishDate || ''}"`,
      `"${t.anticipatedDegreeAwardDate || ''}"`,
      `"${t.professionalBackground || ''}"`,
      `"${t.percentNihrFunding || ''}"`,
      `"${t.nationality || ''}"`,
      `"${t.employingOrgCountry || ''}"`,
      `"${t.employingOrgName || ''}"`,
      `"${t.traineeMainLocationCountry || ''}"`,
      `"${(t.projectName || '').replace(/"/g, '""')}"`,
      `"${(t.nextDestination || '').replace(/"/g, '""')}"`,
      `"${t.orcid || ''}"`,
      `"${t.email || ''}"`,
      `"${t.hasMentor || ''}"`,
      `"${(t.plainEnglishSummary || '').replace(/"/g, '""')}"`,
      `"${t.gender || ''}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NIHR_Academy_Trainees_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTrainees = trainees.filter(t => {
    const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
    const searchMatch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.projectName && t.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.employingOrgName && t.employingOrgName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.professionalBackground && t.professionalBackground.toLowerCase().includes(searchTerm.toLowerCase()));

    const countryMatch = filterCountry === 'All' || 
      t.employingOrgCountry === filterCountry || 
      t.traineeMainLocationCountry === filterCountry ||
      t.nationality.toLowerCase().includes(filterCountry.toLowerCase());

    const fundingMatch = filterFunding === 'All' || 
      (filterFunding === '100%' && (t.percentNihrFunding.includes('100%') || t.percentNihrFunding.includes('fully funded'))) ||
      (filterFunding === '70%' && t.percentNihrFunding.includes('70%')) ||
      (filterFunding === '25%+' && t.percentNihrFunding.includes('25%+'));

    const degreeMatch = filterDegree === 'All' ||
      (filterDegree === 'PhD' && t.degreeType.toLowerCase().includes('phd')) ||
      (filterDegree === 'Masters' && (t.degreeType.toLowerCase().includes('master') || t.degreeType.toLowerCase().includes('mph') || t.degreeType.toLowerCase().includes('msc'))) ||
      (filterDegree === 'Fellow' && (t.degreeType.toLowerCase().includes('fellow') || t.degreeType.toLowerCase().includes('na') || t.degreeType === 'NA'));

    return searchMatch && countryMatch && fundingMatch && degreeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Governance Context Header */}
      <div className="bg-gradient-to-br from-slate-900 via-brand-navy to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-brand-orange text-white px-3 py-1 rounded-lg">
              NIHR Academy Governance Registry
            </span>
            <span className="text-xs text-slate-300 font-bold bg-white/10 px-3 py-1 rounded-lg">
              Training Lead: Nicolas Metheny
            </span>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg flex items-center gap-1.5">
              <Sparkles size={13} /> Official PDF Data Imported (6 Trainees)
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">NIHR Academy Trainees & Academic Career Development</h2>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Official registry of researchers receiving funding from and supported by the NIHR Global Health Research Group on Preventing Violence Against Women and Children across India (PHFI), South Africa (UCT), and Sri Lanka (University of Jaffna).
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Registered</p>
            <p className="text-2xl font-black text-brand-orange mt-1">{trainees.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Official NIHR Cohort</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400">India Hub (PHFI)</p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {trainees.filter(t => t.employingOrgCountry === 'India').length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">PhD & Research Staff</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400">South Africa (UCT)</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">
              {trainees.filter(t => t.employingOrgCountry === 'South Africa').length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">MPH Fellow (70% funding)</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400">Sri Lanka (Univ. Jaffna)</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {trainees.filter(t => t.employingOrgCountry === 'Sri Lanka').length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">PhD Fellow (100% funded)</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400">LMIC Mentorship</p>
            <p className="text-2xl font-black text-purple-400 mt-1">
              {trainees.filter(t => t.hasMentor && t.hasMentor.toLowerCase().includes('lmic')).length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">LMIC / Regional Mentors</p>
          </div>
        </div>
      </div>

      {/* Sync Banner Notification */}
      {syncSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span>{syncSuccessMessage}</span>
          </div>
          <button onClick={() => setSyncSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search by name, email, project, background..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all shadow-sm"
            />
          </div>

          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none shadow-sm"
          >
            <option value="All">All Countries</option>
            <option value="India">India (PHFI)</option>
            <option value="South Africa">South Africa (UCT)</option>
            <option value="Sri Lanka">Sri Lanka (Univ. Jaffna)</option>
          </select>

          <select
            value={filterFunding}
            onChange={(e) => setFilterFunding(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none shadow-sm"
          >
            <option value="All">All Funding Levels</option>
            <option value="100%">100% Fully Funded</option>
            <option value="70%">70% Funded</option>
            <option value="25%+">25%+ Support</option>
          </select>

          <select
            value={filterDegree}
            onChange={(e) => setFilterDegree(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none shadow-sm"
          >
            <option value="All">All Degree / Roles</option>
            <option value="PhD">PhD Fellows</option>
            <option value="Masters">Masters / MPH</option>
            <option value="Fellow">Project Fellows & Research Staff</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {canEdit && (
            <button 
              onClick={handleSyncPdfData}
              disabled={isSyncing}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Re-sync and import canonical data from official NIHR PDF"
            >
              <RefreshCw size={14} className={cn("text-brand-orange", isSyncing && "animate-spin")} />
              {isSyncing ? 'Syncing PDF...' : 'Sync PDF Records'}
            </button>
          )}

          {canExport && (
            <button 
              onClick={exportToCSV}
              disabled={filteredTrainees.length === 0}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Export official NIHR CSV report"
            >
              <FileSpreadsheet size={16} className="text-emerald-600" />
              Export NIHR CSV
            </button>
          )}

          {canEdit && (
            <button 
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              Register Trainee
            </button>
          )}
        </div>
      </div>

      {/* Trainees List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">
            Synchronizing NIHR Academy records...
          </div>
        ) : filteredTrainees.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <GraduationCap className="mx-auto text-slate-300" size={48} />
            <p className="text-sm font-bold text-slate-600">No NIHR trainees found.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Register new PhD students, Master's students, postdocs, or research staff receiving NIHR career support.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-6 min-w-[230px]">Trainee Name</th>
                  <th className="py-4 px-4 min-w-[210px]">Higher Degree</th>
                  <th className="py-4 px-4 min-w-[170px]">% NIHR Funding</th>
                  <th className="py-4 px-4 min-w-[200px]">Employing Org & Location</th>
                  <th className="py-4 px-4 min-w-[160px]">Dates / Duration</th>
                  <th className="py-4 px-4 min-w-[120px]">Mentor Status</th>
                  <th className="py-4 px-6 text-right min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTrainees.map((trainee) => {
                  const is100Funding = trainee.percentNihrFunding.includes('100%') || trainee.percentNihrFunding.toLowerCase().includes('fully funded');
                  const is70Funding = trainee.percentNihrFunding.includes('70%');
                  const isPhd = trainee.degreeType && trainee.degreeType.toLowerCase().includes('phd');
                  const isMasters = trainee.degreeType && (trainee.degreeType.toLowerCase().includes('master') || trainee.degreeType.toLowerCase().includes('mph') || trainee.degreeType.toLowerCase().includes('msc'));
                  const hasNoDegree = !trainee.degreeType || trainee.degreeType === 'NA' || trainee.degreeType === 'N/A';

                  return (
                    <tr key={trainee.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-orange/10 text-brand-orange font-bold flex items-center justify-center shrink-0">
                            {trainee.firstName[0]}{trainee.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-brand-orange transition-colors">
                              {trainee.title} {trainee.firstName} {trainee.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500">{trainee.email}</p>
                            {trainee.orcid && (
                              <p className="text-[9px] text-slate-400 font-mono">ORCiD: {trainee.orcid}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col items-start gap-1 max-w-[210px]">
                          <span className={cn(
                            "inline-block px-2.5 py-1 rounded-lg text-xs font-bold leading-snug border break-words",
                            isPhd
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : isMasters
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : !hasNoDegree
                              ? "bg-slate-100 text-slate-800 border-slate-200"
                              : "bg-slate-50 text-slate-500 border-slate-200 font-medium"
                          )}>
                            {hasNoDegree ? 'Staff (No Degree Enrolled)' : trainee.degreeType}
                          </span>
                          {trainee.anticipatedDegreeAwardDate && trainee.anticipatedDegreeAwardDate !== 'N/A' && trainee.anticipatedDegreeAwardDate !== 'TBD' && (
                            <span className="text-[10px] text-slate-400 font-medium pl-0.5">
                              Expected: {trainee.anticipatedDegreeAwardDate}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="inline-flex items-center">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border shadow-xs",
                            is100Funding
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : is70Funding
                              ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              is100Funding ? "bg-emerald-500" : is70Funding ? "bg-cyan-500" : "bg-amber-500"
                            )} />
                            {is100Funding 
                              ? '100% Fully Funded' 
                              : is70Funding 
                              ? '70% Co-Funded' 
                              : trainee.percentNihrFunding.includes('25%+')
                              ? '25%+ Supported'
                              : trainee.percentNihrFunding
                            }
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 space-y-0.5">
                        <p className="font-semibold text-slate-800 leading-snug">{trainee.employingOrgName || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Globe size={10} className="shrink-0" /> {trainee.employingOrgCountry} ({trainee.nationality})
                        </p>
                      </td>

                      <td className="py-4 px-4 space-y-0.5">
                        <p className="text-slate-700 font-medium">
                          {trainee.startDate} to {trainee.finishDate || 'Ongoing'}
                        </p>
                        {trainee.anticipatedDegreeAwardDate && trainee.anticipatedDegreeAwardDate !== 'N/A' && (
                          <p className="text-[10px] text-slate-400">Award: {trainee.anticipatedDegreeAwardDate}</p>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-brand-navy/10 text-brand-navy border border-brand-navy/20 whitespace-nowrap uppercase">
                          {trainee.hasMentor}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        <button 
                          onClick={() => setSelectedTraineeForView(trainee)}
                          className="p-1.5 text-slate-400 hover:text-brand-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full NIHR Profile"
                        >
                          <Info size={16} />
                        </button>
                        {canEdit && (
                          <button 
                            onClick={() => handleOpenEdit(trainee)}
                            className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Trainee Record"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={() => setTraineeToDelete(trainee.id || null)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Trainee Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Trainee Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 bg-brand-navy text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    {editingTrainee ? 'Edit NIHR Trainee Record' : 'Register NIHR Trainee'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Official NIHR Career Development Data Collection
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-300 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Title</label>
                    <select
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Mx.">Mx.</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">First Name *</label>
                    <input 
                      required
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Name *</label>
                    <input 
                      required
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type of Higher Degree</label>
                    <input 
                      type="text"
                      placeholder="e.g. PhD, MSc, MPhil, N/A"
                      value={formData.degreeType}
                      onChange={(e) => setFormData({ ...formData, degreeType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date *</label>
                    <input 
                      required
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Finish Date</label>
                    <input 
                      type="date"
                      value={formData.finishDate}
                      onChange={(e) => setFormData({ ...formData, finishDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Anticipated Award Date</label>
                    <input 
                      type="date"
                      value={formData.anticipatedDegreeAwardDate}
                      onChange={(e) => setFormData({ ...formData, anticipatedDegreeAwardDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Professional Background</label>
                    <select
                      value={formData.professionalBackground}
                      onChange={(e) => setFormData({ ...formData, professionalBackground: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      <option value="AHP">AHP (Allied Health Professional)</option>
                      <option value="dentist">Dentist</option>
                      <option value="medically qualified">Medically qualified</option>
                      <option value="midwife">Midwife</option>
                      <option value="nurse">Nurse</option>
                      <option value="other health professional">Other health professional</option>
                      <option value="not a health professional">Not a health professional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">% Time Funded Through NIHR</label>
                    <select
                      value={formData.percentNihrFunding}
                      onChange={(e) => setFormData({ ...formData, percentNihrFunding: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      <option value="fully funded">Fully funded (100%)</option>
                      <option value="25%+">25%+</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trainee's Nationality</label>
                    <input 
                      type="text"
                      placeholder="e.g. British, Sri Lankan"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employing Org Country</label>
                    <select
                      value={formData.employingOrgCountry}
                      onChange={(e) => setFormData({ ...formData, employingOrgCountry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Name of Employing Org</label>
                    <input 
                      type="text"
                      placeholder="University or Board"
                      value={formData.employingOrgName}
                      onChange={(e) => setFormData({ ...formData, employingOrgName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Main Location (Country)</label>
                    <select
                      value={formData.traineeMainLocationCountry}
                      onChange={(e) => setFormData({ ...formData, traineeMainLocationCountry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address *</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ORCiD</label>
                    <input 
                      type="text"
                      placeholder="0000-0000-0000-0000"
                      value={formData.orcid}
                      onChange={(e) => setFormData({ ...formData, orcid: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Has Mentor?</label>
                    <select
                      value={formData.hasMentor}
                      onChange={(e) => setFormData({ ...formData, hasMentor: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      <option value="both">Both (UK & LMIC)</option>
                      <option value="UK">UK Mentor</option>
                      <option value="LMIC">LMIC Mentor</option>
                      <option value="no">No Mentor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    >
                      <option value="M">Male (M)</option>
                      <option value="F">Female (F)</option>
                      <option value="not stated">Not Stated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Next Destination (if known)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Postdoc, Senior Lecturer"
                      value={formData.nextDestination}
                      onChange={(e) => setFormData({ ...formData, nextDestination: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Name of Project</label>
                  <input 
                    type="text"
                    placeholder="Associated work package or research project title"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plain English Summary</label>
                  <textarea 
                    rows={3}
                    placeholder="Brief plain English summary for training / career development award..."
                    value={formData.plainEnglishSummary}
                    onChange={(e) => setFormData({ ...formData, plainEnglishSummary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-brand-orange text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 flex items-center gap-1.5"
                  >
                    <Check size={16} /> Save Trainee Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trainee Detail View Modal */}
      <AnimatePresence>
        {selectedTraineeForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-brand-orange bg-orange-50 px-2 py-0.5 rounded">
                    NIHR Trainee Profile
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {selectedTraineeForView.title} {selectedTraineeForView.firstName} {selectedTraineeForView.lastName}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedTraineeForView.email}</p>
                </div>
                <button onClick={() => setSelectedTraineeForView(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Higher Degree / Status</p>
                  <p className="font-bold text-slate-800">{selectedTraineeForView.degreeType || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">NIHR Funding Level</p>
                  <p className="font-bold text-brand-orange">{selectedTraineeForView.percentNihrFunding}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Employing Organisation</p>
                  <p className="font-bold text-slate-800">{selectedTraineeForView.employingOrgName} ({selectedTraineeForView.employingOrgCountry})</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Nationality & Location</p>
                  <p className="font-bold text-slate-800">{selectedTraineeForView.nationality} / {selectedTraineeForView.traineeMainLocationCountry}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Dates / Duration</p>
                  <p className="font-bold text-slate-800">
                    {selectedTraineeForView.startDate} to {selectedTraineeForView.finishDate || 'Ongoing'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Anticipated Award Date</p>
                  <p className="font-bold text-slate-800">{selectedTraineeForView.anticipatedDegreeAwardDate || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">ORCiD</p>
                  <p className="font-mono font-bold text-slate-800">{selectedTraineeForView.orcid || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Mentorship Status</p>
                  <p className="font-bold text-slate-800">{selectedTraineeForView.hasMentor}</p>
                </div>
              </div>

              {selectedTraineeForView.professionalBackground && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Professional & Academic Background</p>
                  <p className="font-medium text-slate-800 leading-relaxed">{selectedTraineeForView.professionalBackground}</p>
                </div>
              )}

              {selectedTraineeForView.projectName && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Project / Work Package</p>
                  <p className="font-medium text-slate-800 mt-0.5">{selectedTraineeForView.projectName}</p>
                </div>
              )}

              {selectedTraineeForView.plainEnglishSummary && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Plain English Summary</p>
                  <p className="text-slate-700 leading-relaxed">{selectedTraineeForView.plainEnglishSummary}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={() => setSelectedTraineeForView(null)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!traineeToDelete}
        onClose={() => setTraineeToDelete(null)}
        onConfirm={() => traineeToDelete && handleDelete(traineeToDelete)}
        title="Delete Trainee Record?"
        message="Are you sure you want to remove this trainee from the NIHR Academy governance registry?"
        confirmText="Yes, Delete"
      />
    </div>
  );
};
