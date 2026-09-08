import React from 'react';
import { 
  GraduationCap, 
  Calendar, 
  Users, 
  UserCheck, 
  Award, 
  ArrowUpRight, 
  TrendingUp, 
  CheckCircle2, 
  Target
} from 'lucide-react';
import { TrainingEvent, MentoringRecord, AttendanceRecord } from '../types';

interface DashboardProps {
  events: TrainingEvent[];
  mentoring: MentoringRecord[];
  attendance: AttendanceRecord[];
}

export const CapacityBuildingDashboard: React.FC<DashboardProps> = ({ events, mentoring, attendance }) => {
  // Compute analytics
  const deliveredEvents = events.filter(e => e.status === 'Delivered');
  const upcomingEvents = events.filter(e => e.status === 'Planned' || e.status === 'Confirmed');
  
  const totalDeliveredCount = deliveredEvents.length;
  const upcomingCount = upcomingEvents.length;
  
  // Total participants trained
  const totalAttendees = deliveredEvents.reduce((acc, current) => acc + (current.attendeesCount || 0), 0);
  
  // Unique mentees or mentoring sessions completed
  const mentoringSessionsCompleted = mentoring.filter(m => m.status === 'Completed').length;
  const activeMenteesCount = mentoring.filter(m => m.status === 'Active').length;
  
  // Handled targeted audience ECR/Doctoral/Postgrad
  // Count how many ECRs or researchers are mentioned in mentoring or training
  const ecrMentees = mentoring.filter(m => ['ECR', 'Doctoral student', 'Postgraduate researcher'].includes(m.careerStage)).length;
  
  // Count by country
  const countryCounts: { [key: string]: number } = {};
  deliveredEvents.forEach(e => {
    countryCounts[e.country] = (countryCounts[e.country] || 0) + 1;
  });

  // Annual targets
  const TARGETS = {
    sessions: 15,
    attendees: 300,
    ecrs: 10,
    mentoring: 12
  };

  const percentSessions = Math.min(Math.round((totalDeliveredCount / TARGETS.sessions) * 100), 100);
  const percentAttendees = Math.min(Math.round((totalAttendees / TARGETS.attendees) * 100), 100);
  const percentEcrs = Math.min(Math.round((ecrMentees / TARGETS.ecrs) * 100), 100);
  const percentMentoring = Math.min(Math.round(((mentoringSessionsCompleted + activeMenteesCount) / TARGETS.mentoring) * 100), 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-orange/30 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="w-10 h-10 bg-orange-50 text-brand-orange rounded-xl flex items-center justify-center mb-4">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivered Sessions</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalDeliveredCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Sessions successfully delivered</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-orange/30 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Sessions</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{upcomingCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Planned or confirmed</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-orange/30 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendees Trained</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalAttendees}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Cumulated participant count</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-orange/30 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ECRs Supported</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{ecrMentees}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Early career researchers</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-orange/30 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center mb-4">
              <Award size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mentoring Meetings</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{mentoring.length}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Total meetings tracked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Target Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress against annual targets */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Annual Capacity Training Progress</h3>
              <p className="text-xs text-slate-500">Track current achievements against annual targets set in work plans</p>
            </div>
            <Target className="text-slate-400" size={24} />
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Delivered Sessions ({totalDeliveredCount} / {TARGETS.sessions})</span>
                <span className="text-brand-orange">{percentSessions}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-orange h-full rounded-full" style={{ width: `${percentSessions}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Attendees Trained ({totalAttendees} / {TARGETS.attendees})</span>
                <span className="text-blue-600">{percentAttendees}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${percentAttendees}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">ECRs Supported ({ecrMentees} / {TARGETS.ecrs})</span>
                <span className="text-purple-600">{percentEcrs}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${percentEcrs}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Mentoring Milestones ({mentoringSessionsCompleted + activeMenteesCount} / {TARGETS.mentoring})</span>
                <span className="text-pink-600">{percentMentoring}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-pink-500 h-full rounded-full" style={{ width: `${percentMentoring}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Country Breakdown Chart Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Country Participation</h3>
            <p className="text-xs text-slate-500 mb-6">Distribution of delivered training sessions by partner countries</p>
            
            <div className="space-y-4">
              {['UK', 'South Africa', 'Sri Lanka', 'Brazil', 'Mexico', 'Peru', 'Other'].map(country => {
                const count = events.filter(e => e.country === country && e.status === 'Delivered').length;
                const pct = totalDeliveredCount > 0 ? Math.round((count / totalDeliveredCount) * 100) : 0;
                
                return (
                  <div key={country} className="flex items-center gap-3">
                    <span className="w-24 text-xs font-semibold text-slate-600 truncate">{country}</span>
                    <div className="flex-grow bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-slate-700 h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: country === 'UK' ? '#1e293b' : country === 'South Africa' ? '#f97316' : country === 'Sri Lanka' ? '#0d9488' : country === 'Brazil' ? '#16a34a' : country === 'Mexico' ? '#dc2626' : '#2563eb' }} />
                    </div>
                    <span className="w-8 text-right text-xs font-bold text-slate-800">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>Total countries tracking:</span>
            <span className="text-slate-900 font-bold">6 partner nations</span>
          </div>
        </div>
      </div>

      {/* Progress Indicators & Highlights */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-brand-orange rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Training Activity & Mentoring Tracker</h4>
            <p className="text-xs text-slate-500 mt-0.5">This module supports NIHR knowledge exchange objectives, ECR publications, policy seminars, and trauma-informed research mentoring.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Logged Records</span>
            <span className="text-lg font-extrabold text-slate-800">{events.length + mentoring.length + attendance.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
