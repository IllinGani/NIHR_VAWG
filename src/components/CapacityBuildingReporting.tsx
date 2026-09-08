import React, { useState } from 'react';
import { 
  BarChart3, 
  Filter, 
  Layers, 
  Globe, 
  Users, 
  BookOpen, 
  Download, 
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { TrainingEvent, MentoringRecord, TrainingResource, AttendanceRecord, TrainingFeedback } from '../types';

interface ReportingProps {
  events: TrainingEvent[];
  mentoring: MentoringRecord[];
  resources: TrainingResource[];
  attendance: AttendanceRecord[];
  feedback: TrainingFeedback[];
}

const COUNTRIES = ['UK', 'South Africa', 'Sri Lanka', 'Brazil', 'Mexico', 'Peru', 'Other'] as const;
const WORK_PACKAGES = ['WP1', 'WP2', 'WP3', 'WP4', 'WP5', 'Cross-cutting'] as const;

export const CapacityBuildingReporting: React.FC<ReportingProps> = ({ events, mentoring, resources, attendance, feedback }) => {
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterWP, setFilterWP] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [audienceSearch, setAudienceSearch] = useState('');

  // 1. Dynamic Statistics Calculations (matching current filters)
  const filteredEvents = events.filter(e => {
    const matchesCountry = filterCountry === 'All' || e.country === filterCountry;
    const matchesWP = filterWP === 'All' || e.workPackage === filterWP;
    const matchesStatus = filterStatus === 'All' || e.status === filterStatus;
    const matchesAudience = !audienceSearch || (e.targetAudience && e.targetAudience.toLowerCase().includes(audienceSearch.toLowerCase()));
    return matchesCountry && matchesWP && matchesStatus && matchesAudience;
  });

  const totalDelivered = filteredEvents.filter(e => e.status === 'Delivered').length;
  const upcomingCount = filteredEvents.filter(e => e.status === 'Planned' || e.status === 'Confirmed').length;
  const totalAttendeesFiltered = filteredEvents
    .filter(e => e.status === 'Delivered')
    .reduce((sum, e) => sum + (e.attendeesCount || 0), 0);

  // Filter feedback matching selected WP/Country events
  const filteredEventsTitles = new Set(filteredEvents.map(e => e.title));
  const filteredFeedback = feedback.filter(f => filteredEventsTitles.has(f.eventName) || filterWP === 'All' && filterCountry === 'All');
  
  const avgSatisfaction = filteredFeedback.length > 0 
    ? Math.round((filteredFeedback.reduce((sum, f) => sum + f.avgUsefulnessRating, 0) / filteredFeedback.length) * 10) / 10 
    : 0;

  // Country Breakdown Summary Table calculations
  const breakdownByCountry = COUNTRIES.map(country => {
    const countryEvents = events.filter(e => e.country === country);
    const countryDelivered = countryEvents.filter(e => e.status === 'Delivered').length;
    const countryTrainees = countryEvents.reduce((sum, e) => sum + (e.attendeesCount || 0), 0);
    const countryMentoring = mentoring.filter(m => m.country === country).length;
    
    return {
      country,
      totalCount: countryEvents.length,
      delivered: countryDelivered,
      trainees: countryTrainees,
      mentoring: countryMentoring
    };
  });

  // Work Package Breakdown Summary Table calculation
  const breakdownByWP = WORK_PACKAGES.map(wp => {
    const wpEvents = events.filter(e => e.workPackage === wp);
    const wpDelivered = wpEvents.filter(e => e.status === 'Delivered').length;
    const wpTrainees = wpEvents.reduce((sum, e) => sum + (e.attendeesCount || 0), 0);
    const wpResources = resources.filter(r => r.workPackage === wp).length;

    return {
      wp,
      eventsCount: wpEvents.length,
      delivered: wpDelivered,
      trainees: wpTrainees,
      resources: wpResources
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Advanced Filter Panels */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
          <SlidersHorizontal size={16} className="text-brand-orange" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aggregation Filter Parameters</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
          {/* Country Selection */}
          <div>
            <label className="block text-slate-500 mb-1.5 flex items-center gap-1">
              <Globe size={11} /> National Partner Country
            </label>
            <select 
              value={filterCountry}
              onChange={e => setFilterCountry(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white text-slate-700"
            >
              <option value="All">All Nations</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* WP Selection */}
          <div>
            <label className="block text-slate-500 mb-1.5 flex items-center gap-1">
              <Layers size={11} /> Work Package Area
            </label>
            <select 
              value={filterWP}
              onChange={e => setFilterWP(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white text-slate-700"
            >
              <option value="All">All Work Packages</option>
              {WORK_PACKAGES.map(wp => <option key={wp} value={wp}>{wp}</option>)}
            </select>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-slate-500 mb-1.5">Project Status</label>
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-white text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Audience Key search */}
          <div>
            <label className="block text-slate-500 mb-1.5">Audience Cohort Keyword</label>
            <input 
              type="text"
              value={audienceSearch}
              onChange={e => setAudienceSearch(e.target.value)}
              placeholder="e.g. ECRs, doctoral, survivor"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-orange bg-transparent text-slate-700 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Computed Summary Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
          <span className="block text-[10px] uppercase font-bold text-slate-400">Delivered Sessions</span>
          <span className="text-xl font-extrabold text-slate-800 block mt-1">{totalDelivered}</span>
          <span className="text-[10px] text-slate-400 mt-2 block">Matching filtered filters</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
          <span className="block text-[10px] uppercase font-bold text-slate-400">Total Trainees</span>
          <span className="text-xl font-extrabold text-[#f97316] block mt-1">{totalAttendeesFiltered}</span>
          <span className="text-[10px] text-slate-400 mt-2 block">Aggregated attendee count</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
          <span className="block text-[10px] uppercase font-bold text-slate-400">Upcoming Sessions</span>
          <span className="text-xl font-extrabold text-blue-600 block mt-1">{upcomingCount}</span>
          <span className="text-[10px] text-slate-400 mt-2 block">To be delivered this year</span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
          <span className="block text-[10px] uppercase font-bold text-slate-400">Average Event Satisfaction</span>
          <span className="text-xl font-extrabold text-emerald-600 block mt-1">{avgSatisfaction > 0 ? `${avgSatisfaction} / 5.0` : '—'}</span>
          <span className="text-[10px] text-emerald-600 mt-2 block bg-emerald-50 px-2 py-0.5 rounded-full inline-block font-semibold">Post-event feedback score</span>
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* National Breakdown table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h5 className="font-bold text-slate-800 text-sm">National Hub Aggregation</h5>
              <p className="text-[11px] text-slate-500">Breakdown of metrics by NIHR Global partner countries</p>
            </div>
            <Globe className="text-slate-400" size={18} />
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100">
                  <th className="py-2 pb-3">Country Hub</th>
                  <th className="py-2 pb-3 text-center">Total Events</th>
                  <th className="py-2 pb-3 text-center">Delivered</th>
                  <th className="py-2 pb-3 text-center">Attendees</th>
                  <th className="py-2 pb-3 text-center">Mentoring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {breakdownByCountry.map(row => (
                  <tr key={row.country} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-bold text-slate-800">{row.country}</td>
                    <td className="py-3 text-center text-slate-600">{row.totalCount}</td>
                    <td className="py-3 text-center text-slate-600">{row.delivered}</td>
                    <td className="py-3 text-center font-bold text-slate-800">{row.trainees}</td>
                    <td className="py-4 text-center text-slate-800">{row.mentoring}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Work package distribution breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h5 className="font-bold text-slate-800 text-sm">Work Package Distribution</h5>
              <p className="text-[11px] text-slate-500">Breakdown of metrics by project work packages (WPs)</p>
            </div>
            <Layers className="text-slate-400" size={18} />
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100">
                  <th className="py-2 pb-3">Work Package</th>
                  <th className="py-2 pb-3 text-center">WP Events</th>
                  <th className="py-2 pb-3 text-center">Delivered</th>
                  <th className="py-2 pb-3 text-center">Trainees</th>
                  <th className="py-2 pb-3 text-center">Resources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {breakdownByWP.map(row => (
                  <tr key={row.wp} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-bold text-slate-800">{row.wp}</td>
                    <td className="py-3 text-center text-slate-600">{row.eventsCount}</td>
                    <td className="py-3 text-center text-slate-600">{row.delivered}</td>
                    <td className="py-3 text-center font-bold text-slate-800">{row.trainees}</td>
                    <td className="py-4 text-center text-slate-800">{row.resources}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
