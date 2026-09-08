import React, { useState } from 'react';
import { GraduationCap, BookOpen, FileText } from 'lucide-react';
import { NihrAcademy } from './NihrAcademy';
import { LiteratureLibrary } from './LiteratureLibrary';
import { ManuscriptHub } from './ManuscriptHub';
import { TeamMember, UserProfile } from '../types';
import { cn } from '../lib/utils';

interface CapacityBuildingProps {
  isAdmin?: boolean;
  teamMembers?: TeamMember[];
  userProfile?: UserProfile | null;
}

type FeatureTab = 'nihr_academy' | 'literature_library' | 'manuscript_hub';

export const CapacityBuilding: React.FC<CapacityBuildingProps> = ({ 
  isAdmin = false,
  teamMembers = [],
  userProfile = null
}) => {
  const [activeTab, setActiveTab] = useState<FeatureTab>('nihr_academy');

  return (
    <div className="space-y-6">
      {/* Top Feature Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 overflow-x-auto">
        <div className="flex gap-3 bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('nihr_academy')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              activeTab === 'nihr_academy'
                ? "bg-white text-slate-900 shadow-md shadow-slate-200"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <GraduationCap size={18} className={activeTab === 'nihr_academy' ? "text-brand-orange" : ""} />
            1) NIHR Academy
          </button>

          <button
            onClick={() => setActiveTab('literature_library')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              activeTab === 'literature_library'
                ? "bg-white text-slate-900 shadow-md shadow-slate-200"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <BookOpen size={18} className={activeTab === 'literature_library' ? "text-brand-orange" : ""} />
            2) Literature Library
          </button>

          <button
            onClick={() => setActiveTab('manuscript_hub')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
              activeTab === 'manuscript_hub'
                ? "bg-white text-slate-900 shadow-md shadow-slate-200"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <FileText size={18} className={activeTab === 'manuscript_hub' ? "text-brand-orange" : ""} />
            3) Manuscript Hub
          </button>
        </div>
      </div>

      {/* Render Active Feature Component */}
      {activeTab === 'nihr_academy' && (
        <NihrAcademy 
          isAdmin={isAdmin} 
          userProfile={userProfile} 
        />
      )}
      {activeTab === 'literature_library' && (
        <LiteratureLibrary 
          isAdmin={isAdmin} 
          userProfile={userProfile} 
        />
      )}
      {activeTab === 'manuscript_hub' && (
        <ManuscriptHub 
          isAdmin={isAdmin} 
          teamMembers={teamMembers} 
          userProfile={userProfile} 
        />
      )}
    </div>
  );
};
