import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ShieldCheck, 
  HeartHandshake, 
  Database, 
  Building2, 
  GraduationCap, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  Download, 
  Edit3, 
  Save, 
  X, 
  Info, 
  Layers, 
  Globe, 
  Users, 
  BookOpen, 
  TrendingUp, 
  ShieldAlert, 
  CheckSquare, 
  Sparkles,
  FileCheck2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_ANNUAL_REPORT_DATA } from '../data/annualReportData';
import { AnnualReportData, AnnualReportMetric, UserProfile } from '../types';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { hasActionPermission } from '../lib/permissions';
import { cn } from '../lib/utils';

interface AnnualReportProps {
  userProfile?: UserProfile | null;
  isAdmin?: boolean;
}

export const AnnualReport: React.FC<AnnualReportProps> = ({ userProfile, isAdmin = false }) => {
  const [reportData, setReportData] = useState<AnnualReportData>(INITIAL_ANNUAL_REPORT_DATA);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [expandedWpId, setExpandedWpId] = useState<string | null>('wp-1');
  const [metricFilter, setMetricFilter] = useState<'all' | 'Completed' | 'Active' | 'Planned'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'highlights' | 'workpackages' | 'governance'>('all');

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<AnnualReportData>>({});

  const canEdit = isAdmin || hasActionPermission(userProfile, 'createEdit', isAdmin);

  // Load from Firestore if available
  useEffect(() => {
    const loadReport = async () => {
      try {
        const reportDocRef = doc(db, 'annual_reports', 'current');
        const snap = await getDoc(reportDocRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<AnnualReportData>;
          setReportData({
            ...INITIAL_ANNUAL_REPORT_DATA,
            ...data,
            // Ensure array fallbacks
            metrics: data.metrics || INITIAL_ANNUAL_REPORT_DATA.metrics,
            highlights: data.highlights || INITIAL_ANNUAL_REPORT_DATA.highlights,
            workPackages: data.workPackages || INITIAL_ANNUAL_REPORT_DATA.workPackages,
            priorities: data.priorities || INITIAL_ANNUAL_REPORT_DATA.priorities,
            risks: data.risks || INITIAL_ANNUAL_REPORT_DATA.risks,
            sdgs: data.sdgs || INITIAL_ANNUAL_REPORT_DATA.sdgs,
          });
        }
      } catch (err) {
        console.error('Error fetching annual report from Firestore, using initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, []);

  // Compute countdown to Next Report Due Date
  const countdown = useMemo(() => {
    const targetDate = new Date(reportData.nextReportDueDateISO || '2027-02-28');
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    
    if (diffTime <= 0) {
      return { days: 0, months: 0, isPast: true, text: 'Reporting window open' };
    }

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30.4375);
    const remainingDays = Math.floor(diffDays % 30.4375);

    return {
      totalDays: diffDays,
      months,
      remainingDays,
      isPast: false,
      text: `${months} months (${diffDays} days) remaining`
    };
  }, [reportData.nextReportDueDateISO]);

  // Timeline progress percentage (from July 8, 2026 to February 28, 2027)
  const timelineProgress = useMemo(() => {
    const start = new Date('2026-07-08').getTime();
    const end = new Date('2027-02-28').getTime();
    const now = new Date().getTime();
    const pct = Math.min(Math.max(((now - start) / (end - start)) * 100, 5), 95);
    return Math.round(pct);
  }, []);

  // Filtered metrics
  const filteredMetrics = useMemo(() => {
    if (metricFilter === 'all') return reportData.metrics;
    return reportData.metrics.filter(m => m.status === metricFilter);
  }, [reportData.metrics, metricFilter]);

  const handleStartEdit = () => {
    setEditForm({
      documentUrl: reportData.documentUrl,
      latestReportSubmitted: reportData.latestReportSubmitted,
      latestDocumentVersion: reportData.latestDocumentVersion,
      nextReportDue: reportData.nextReportDue,
      lastUpdated: reportData.lastUpdated,
      statusLabel: reportData.statusLabel,
      statusSummary: reportData.statusSummary,
      financeAssurance: reportData.financeAssurance,
      safeguardingAssurance: reportData.safeguardingAssurance,
      safeguardingNote: reportData.safeguardingNote,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaveStatus('saving');
    try {
      const updated: AnnualReportData = {
        ...reportData,
        ...editForm,
        lastUpdated: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.displayName || userProfile?.email || 'User'
      };

      setReportData(updated);

      try {
        await setDoc(doc(db, 'annual_reports', 'current'), updated, { merge: true });
      } catch (e) {
        console.warn('Could not persist to Firestore, stored in local state:', e);
      }

      setSaveStatus('saved');
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus('idle');
      }, 800);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 print:p-0 print:space-y-4 max-w-7xl mx-auto">
      {/* 1. PAGE HEADER */}
      <header className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm relative overflow-hidden print:border-none print:shadow-none print:p-2">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/50 via-amber-50/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 print:hidden" />
        
        <div className="relative z-10">
          {/* Top metadata tags & Project Ref */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-brand-orange border border-orange-200/70">
                <FileCheck2 size={13} />
                NIHR Project Reference: {reportData.projectReference}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <Clock size={13} className="text-slate-400" />
                Latest submission: {reportData.latestReportSubmitted}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <Calendar size={13} className="text-slate-400" />
                Doc version: {reportData.latestDocumentVersion}
              </span>
            </div>

            {/* Print & Edit Controls */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="Print or save as PDF"
              >
                <Printer size={14} />
                <span>Print / PDF</span>
              </button>

              {canEdit && (
                <button
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-orange bg-orange-50 hover:bg-orange-100 border border-orange-200/80 rounded-xl transition-colors cursor-pointer shadow-2xs"
                  title="Edit document link and reporting dates"
                >
                  <Edit3 size={14} />
                  <span>Edit Details</span>
                </button>
              )}
            </div>
          </div>

          {/* Titles & Programme Description */}
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {reportData.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed mb-1">
              {reportData.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {reportData.projectTitle}
            </p>
          </div>

          {/* Prominent Action & Countdown Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            {/* Primary Action Button: View latest progress report */}
            <div className="md:col-span-1 flex flex-col justify-center">
              <a
                href={reportData.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full inline-flex items-center justify-between px-5 py-4 bg-brand-orange hover:bg-orange-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-[0.99] cursor-pointer"
                title="Open the latest 6-month progress report documentation"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">View latest progress report</div>
                    <div className="text-xs text-orange-100 font-normal">Official NIHR 6-month submission</div>
                  </div>
                </div>
                <ExternalLink size={18} className="text-orange-200 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            {/* Prominent Next Report Due Countdown Card */}
            <div className="md:col-span-2 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-50 rounded-2xl border border-amber-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    6-Month Reporting Milestone
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Next progress report due February 2027
                </h3>
                <p className="text-xs text-slate-600">
                  Countdown: <strong className="text-slate-800 font-semibold">{countdown.text}</strong> · Six-monthly reporting cycle
                </p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <div className="px-3.5 py-1.5 bg-white rounded-xl border border-amber-300/80 shadow-xs text-center">
                  <span className="block text-xl font-black text-amber-600">
                    {countdown.months}
                  </span>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Months to Due Date
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Last updated: {reportData.lastUpdated}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. OVERALL STATUS & VISUAL TIMELINE */}
      <section className="bg-white rounded-3xl border border-amber-200/80 p-6 md:p-8 shadow-sm relative overflow-hidden bg-gradient-to-br from-amber-50/40 via-white to-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-amber-100">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 shrink-0 border border-amber-200">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
                  Overall Status
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Consortium Review
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {reportData.statusLabel}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/80 rounded-xl border border-amber-200/60 text-xs font-semibold text-amber-800 self-start lg:self-auto">
            <Info size={14} className="shrink-0 text-amber-600" />
            <span>Timetable adjustments without scope reduction</span>
          </div>
        </div>

        {/* Narrative summary */}
        <div className="mt-5 text-sm sm:text-base text-slate-700 leading-relaxed max-w-5xl">
          <p className="font-normal text-slate-700">
            {reportData.statusSummary}
          </p>
        </div>

        {/* Visual Timeline: July 2026 to February 2027 */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-brand-orange" />
              Six-Monthly Reporting Cycle Timeline (2026 – 2027)
            </h4>
            <span className="text-xs font-bold text-brand-orange">
              {timelineProgress}% cycle elapsed
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6 relative">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-brand-orange rounded-full transition-all duration-700"
              style={{ width: `${timelineProgress}%` }}
            />
          </div>

          {/* Timeline steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Step 1: July 2026 */}
            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 relative">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
                <CheckCircle2 size={14} />
                <span>8 July 2026</span>
              </div>
              <p className="text-xs font-bold text-slate-800">Report Submitted</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Comprehensive 6-month report submitted to NIHR</p>
              <span className="mt-2 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                Completed
              </span>
            </div>

            {/* Step 2: August 2026 */}
            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 relative">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
                <CheckCircle2 size={14} />
                <span>24 August 2026</span>
              </div>
              <p className="text-xs font-bold text-slate-800">Version 2.0 Finalised</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Consolidated risk register & annexes updated</p>
              <span className="mt-2 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                Completed
              </span>
            </div>

            {/* Step 3: Current / Autumn 2026 */}
            <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 relative ring-2 ring-blue-400/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1">
                <Clock size={14} />
                <span>Q3–Q4 2026</span>
              </div>
              <p className="text-xs font-bold text-slate-800">Approvals & Mobilisation</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Fund transfers, ethics sign-offs, and panel prep</p>
              <span className="mt-2 inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-md uppercase">
                Active / In Progress
              </span>
            </div>

            {/* Step 4: Winter 2026 */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 relative">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1">
                <Target size={14} />
                <span>Dec 2026</span>
              </div>
              <p className="text-xs font-bold text-slate-800">Mid-Cycle Review</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Work-package catch-up & draft synthesis</p>
              <span className="mt-2 inline-block px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-md uppercase">
                Scheduled
              </span>
            </div>

            {/* Step 5: February 2027 */}
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-300 relative ring-1 ring-amber-400">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                <AlertCircle size={14} />
                <span>February 2027</span>
              </div>
              <p className="text-xs font-bold text-slate-900">Next Report Due</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Next 6-month progress submission to NIHR CCF</p>
              <span className="mt-2 inline-block px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded-md uppercase">
                Next Deadline
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY PROGRESS METRICS */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Key Progress Metrics</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Verified quantitative achievements across partner research institutions
            </p>
          </div>

          {/* Metric Status Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setMetricFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                metricFilter === 'all' ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              )}
            >
              All (10)
            </button>
            <button
              onClick={() => setMetricFilter('Completed')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                metricFilter === 'Completed' ? "bg-emerald-600 text-white shadow-2xs font-bold" : "text-emerald-700 hover:text-emerald-900"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Completed (8)
            </button>
            <button
              onClick={() => setMetricFilter('Active')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                metricFilter === 'Active' ? "bg-blue-600 text-white shadow-2xs font-bold" : "text-blue-700 hover:text-blue-900"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Active (1)
            </button>
            <button
              onClick={() => setMetricFilter('Planned')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                metricFilter === 'Planned' ? "bg-purple-600 text-white shadow-2xs font-bold" : "text-purple-700 hover:text-purple-900"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Planned (1)
            </button>
          </div>
        </div>

        {/* Note distinguishing Completed from Planned */}
        <div className="mb-6 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-slate-400 shrink-0" />
            <span>
              <strong>Transparency Note:</strong> Completed deliverables represent finalized outcomes, while planned initiatives (e.g. Sri Lankan survivor panels) reflect scheduled fieldwork following ethical and safeguarding approvals.
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-3 shrink-0 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
            </span>
            <span className="flex items-center gap-1 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Active
            </span>
            <span className="flex items-center gap-1 text-purple-700">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Planned (In Prep)
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {filteredMetrics.map((metric) => {
            const isCompleted = metric.status === 'Completed';
            const isActive = metric.status === 'Active';
            const isPlanned = metric.status === 'Planned';

            return (
              <div
                key={metric.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex flex-col justify-between group",
                  isCompleted && "bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300 hover:shadow-xs",
                  isActive && "bg-blue-50/30 border-blue-200/80 hover:border-blue-300 hover:shadow-xs",
                  isPlanned && "bg-purple-50/40 border-purple-200/90 hover:border-purple-300 hover:shadow-xs"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {metric.category}
                    </span>
                    <span 
                      className={cn(
                        "px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider",
                        isCompleted && "bg-emerald-100 text-emerald-800 border border-emerald-200",
                        isActive && "bg-blue-100 text-blue-800 border border-blue-200",
                        isPlanned && "bg-purple-100 text-purple-900 border border-purple-200"
                      )}
                      title={isPlanned ? "Planned: Ethical & trauma-informed prep in progress" : undefined}
                    >
                      {isPlanned ? 'Planned' : isCompleted ? 'Completed' : 'Active'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className={cn(
                      "text-3xl font-black tracking-tight",
                      isCompleted && "text-slate-900",
                      isActive && "text-blue-900",
                      isPlanned && "text-purple-950"
                    )}>
                      {metric.figure}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 leading-snug mb-1">
                    {metric.label}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {metric.detail}
                  </p>
                </div>

                {metric.badgeNote && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500 text-[10px]">Detail:</span>
                    <span className={cn(
                      "font-bold text-[10px]",
                      isCompleted && "text-emerald-700",
                      isActive && "text-blue-700",
                      isPlanned && "text-purple-700"
                    )}>
                      {metric.badgeNote}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PROGRESS HIGHLIGHTS (6 visual cards) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900">Progress Highlights</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Key accomplishments documented in the 6-month reporting cycle
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportData.highlights.map((highlight) => {
            const getIcon = () => {
              switch (highlight.iconName) {
                case 'ShieldCheck': return <ShieldCheck className="text-emerald-600" size={22} />;
                case 'HeartHandshake': return <HeartHandshake className="text-rose-600" size={22} />;
                case 'Database': return <Database className="text-blue-600" size={22} />;
                case 'Building2': return <Building2 className="text-indigo-600" size={22} />;
                case 'GraduationCap': return <GraduationCap className="text-purple-600" size={22} />;
                case 'FileText': return <FileText className="text-amber-600" size={22} />;
                default: return <Sparkles className="text-brand-orange" size={22} />;
              }
            };

            const getCardBg = () => {
              switch (highlight.number) {
                case 1: return "hover:border-emerald-300";
                case 2: return "hover:border-rose-300";
                case 3: return "hover:border-blue-300";
                case 4: return "hover:border-indigo-300";
                case 5: return "hover:border-purple-300";
                case 6: return "hover:border-amber-300";
                default: return "hover:border-slate-300";
              }
            };

            return (
              <div
                key={highlight.id}
                className={cn(
                  "p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all shadow-2xs flex flex-col justify-between group",
                  getCardBg()
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-slate-200/70">
                      {getIcon()}
                    </div>
                    <span className="w-7 h-7 rounded-full bg-slate-200/70 text-slate-700 font-black text-xs flex items-center justify-center">
                      {highlight.number}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-3 group-hover:text-brand-orange transition-colors">
                    {highlight.title}
                  </h4>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                    {highlight.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
                        <span className="leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. WORK-PACKAGE PROGRESS */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Work-Package Progress</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Current operational status, delivery focus, and milestone alignment
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Progressing (4)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Requires Recovery (1)
            </span>
          </div>
        </div>

        {/* Work Packages Accordion / Expandable Cards */}
        <div className="space-y-3.5">
          {reportData.workPackages.map((wp) => {
            const isExpanded = expandedWpId === wp.id;
            const isRecovery = wp.status === 'Requires recovery';

            return (
              <div
                key={wp.id}
                className={cn(
                  "rounded-2xl border transition-all overflow-hidden",
                  isRecovery ? "border-amber-300/80 bg-amber-50/20" : "border-slate-200/80 bg-white hover:border-slate-300"
                )}
              >
                {/* Header toggle */}
                <button
                  onClick={() => setExpandedWpId(isExpanded ? null : wp.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-black rounded-xl uppercase tracking-wider shrink-0",
                      isRecovery ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 text-slate-800 border border-slate-200"
                    )}>
                      {wp.code}
                    </span>

                    <div className="truncate">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {wp.title}
                      </h4>
                      <p className="text-xs text-slate-500 truncate font-medium mt-0.5">
                        Focus: {wp.focus}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span 
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider",
                        isRecovery 
                          ? "bg-amber-100 text-amber-800 border border-amber-300" 
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      )}
                      title={wp.statusExplanation}
                    >
                      {wp.status}
                    </span>
                    <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 bg-slate-50">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 px-4 sm:px-6 py-4 bg-slate-50/50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1 space-y-2">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Work Package Focus
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                            {wp.focus}
                          </p>
                          <div className={cn(
                            "p-3 rounded-xl border text-xs",
                            isRecovery ? "bg-amber-50 text-amber-900 border-amber-200" : "bg-blue-50/60 text-blue-900 border-blue-100"
                          )}>
                            <strong>Status Context:</strong> {wp.statusExplanation}
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Active Deliverables & Evidence Lines
                          </p>
                          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                            {wp.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 size={16} className={isRecovery ? "text-amber-600 mt-0.5 shrink-0" : "text-emerald-600 mt-0.5 shrink-0"} />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. PRIORITIES FOR THE NEXT REPORTING PERIOD */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-orange-100 text-brand-orange border border-orange-200">
              Roadmap Ahead
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Next Reporting Period (Q3 2026 – Feb 2027)
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mt-1">
            Priorities for the Next Reporting Period
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Key operational milestones to be achieved prior to the February 2027 progress review
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {reportData.priorities.map((priority, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-orange-300 hover:bg-orange-50/20 transition-colors flex items-start gap-3.5 group"
            >
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-brand-orange group-hover:bg-orange-50 shrink-0 text-brand-orange mt-0.5">
                <CheckSquare size={16} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Priority {index + 1}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                  {priority}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. RISKS AND MITIGATION (“Delivery considerations” - Amber Visual Style) */}
      <section className="bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 rounded-3xl border-2 border-amber-300/80 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                Risk Management & Oversight
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Delivery Considerations
              </h3>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 self-start sm:self-auto">
            Live Escalation Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Key Risks Column */}
          <div className="lg:col-span-6 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle size={15} className="text-amber-600" />
              Key Programme Risks
            </h4>
            <div className="space-y-2.5">
              {reportData.risks.map((risk, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                    {risk}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mitigation Strategy Column */}
          <div className="lg:col-span-6 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-amber-600" />
              Consortium Mitigation Strategy
            </h4>
            <div className="p-5 bg-white rounded-2xl border border-amber-200/90 shadow-2xs space-y-4">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {reportData.mitigations}
              </p>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="block font-bold text-slate-800">Weekly Escalation</span>
                  <span className="text-[11px] text-slate-500">Core team & work package leads</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="block font-bold text-slate-800">Activity Re-sequencing</span>
                  <span className="text-[11px] text-slate-500">Continuous training & secondary analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINANCE AND SAFEGUARDING ASSURANCES */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finance Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <TrendingUp size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Fiduciary Assurance
                </span>
                <h4 className="text-lg font-bold text-slate-900">
                  Finance
                </h4>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              “{reportData.financeAssurance}”
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Budget Status:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Within Approved Budget
            </span>
          </div>
        </div>

        {/* Safeguarding Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Compliance Assurance
                </span>
                <h4 className="text-lg font-bold text-slate-900">
                  Safeguarding & Integrity
                </h4>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              “{reportData.safeguardingAssurance}”
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Incidents / Irregularities:</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              0 Incidents Reported
            </span>
          </div>
        </div>
      </section>

      {/* Mandatory Survivor Engagement Safeguarding Note */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-300/80 flex items-start gap-4">
        <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
          <ShieldAlert size={20} />
        </div>
        <div className="space-y-1">
          <h5 className="text-xs font-black uppercase tracking-wider text-amber-900">
            Mandatory Survivor Safeguarding Standard
          </h5>
          <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
            {reportData.safeguardingNote}
          </p>
        </div>
      </div>

      {/* 9. IMPACT AND SUSTAINABILITY */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Long-Term Horizon
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Global Health Transformation
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Impact and Sustainability
          </h3>
        </div>

        <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-5xl">
          {reportData.impactNarrative}
        </p>

        {/* SDG Badges Grid */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={14} className="text-brand-orange" />
              Aligned Sustainable Development Goals (SDGs)
            </span>
            <span className="text-xs text-slate-400">UN Agenda 2030</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {reportData.sdgs.map((sdg) => (
              <div
                key={sdg.code}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span 
                      className="px-2.5 py-1 text-xs font-black text-white rounded-lg uppercase tracking-wider shadow-2xs"
                      style={{ backgroundColor: sdg.color }}
                    >
                      {sdg.code}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                    {sdg.title}
                  </h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {sdg.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. EDIT REPORT MODAL (For Admins & Authorized Users) */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Progress Report Details</h3>
                  <p className="text-xs text-slate-500">Update 6-monthly reporting parameters, document URLs, and official dates</p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latest Progress Report Document URL</label>
                  <input
                    type="url"
                    value={editForm.documentUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, documentUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Shared Google Drive or institutional repository URL for the full report document.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Latest Report Submitted</label>
                    <input
                      type="text"
                      value={editForm.latestReportSubmitted || ''}
                      onChange={(e) => setEditForm({ ...editForm, latestReportSubmitted: e.target.value })}
                      placeholder="e.g. 8 July 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Latest Document Version Date</label>
                    <input
                      type="text"
                      value={editForm.latestDocumentVersion || ''}
                      onChange={(e) => setEditForm({ ...editForm, latestDocumentVersion: e.target.value })}
                      placeholder="e.g. 24 August 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Next Report Due (Label)</label>
                    <input
                      type="text"
                      value={editForm.nextReportDue || ''}
                      onChange={(e) => setEditForm({ ...editForm, nextReportDue: e.target.value })}
                      placeholder="e.g. February 2027"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Overall Status Label</label>
                    <input
                      type="text"
                      value={editForm.statusLabel || ''}
                      onChange={(e) => setEditForm({ ...editForm, statusLabel: e.target.value })}
                      placeholder="Implementation progressing..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Narrative Summary</label>
                  <textarea
                    rows={4}
                    value={editForm.statusSummary || ''}
                    onChange={(e) => setEditForm({ ...editForm, statusSummary: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Finance Assurance Statement</label>
                  <textarea
                    rows={2}
                    value={editForm.financeAssurance || ''}
                    onChange={(e) => setEditForm({ ...editForm, financeAssurance: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Safeguarding Statement</label>
                  <textarea
                    rows={2}
                    value={editForm.safeguardingAssurance || ''}
                    onChange={(e) => setEditForm({ ...editForm, safeguardingAssurance: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saveStatus === 'saving'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
