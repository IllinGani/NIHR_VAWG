import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Shield, 
  Check, 
  Download, 
  Edit3, 
  Trash2, 
  Users, 
  Target, 
  LayoutDashboard, 
  ClipboardList, 
  Clock, 
  Library, 
  GraduationCap, 
  Settings, 
  UserCircle2,
  Sliders,
  Sparkles,
  Info,
  Globe,
  MapPin
} from 'lucide-react';
import { UserProfile, UserPermissions, ModulePermissions, ActionPermissions } from '../types';
import { ROLE_PRESETS, MODULE_DEFINITIONS, ACTION_DEFINITIONS, ACTIVITY_COUNTRIES } from '../lib/permissions';
import { cn } from '../lib/utils';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (userId: string, role: string, customRoleName: string | undefined, permissions: UserPermissions) => Promise<void>;
}

export const RolePermissionsModal: React.FC<RolePermissionsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');
  const [role, setRole] = useState<'admin' | 'user' | string>('user');
  const [customRoleName, setCustomRoleName] = useState<string>('');
  const [modules, setModules] = useState<Required<ModulePermissions>>({
    overview: true,
    annual_report: true,
    suite: false,
    activity: true,
    gantt: true,
    directory: true,
    dissemination: true,
    capacity: true,
    settings: true,
    users: false
  });
  const [actions, setActions] = useState<Required<ActionPermissions>>({
    export: true,
    createEdit: true,
    delete: false,
    manageUsers: false
  });
  const [allowedCountries, setAllowedCountries] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'modules' | 'actions' | 'countries'>('modules');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setRole(user.role || 'user');
      setCustomRoleName(user.customRoleName || '');

      // Load permissions
      const initialModules: Required<ModulePermissions> = {
        overview: user.permissions?.modules?.overview ?? true,
        annual_report: user.permissions?.modules?.annual_report ?? true,
        suite: user.permissions?.modules?.suite ?? (user.role === 'admin'),
        activity: user.permissions?.modules?.activity ?? true,
        gantt: user.permissions?.modules?.gantt ?? true,
        directory: user.permissions?.modules?.directory ?? true,
        dissemination: user.permissions?.modules?.dissemination ?? true,
        capacity: user.permissions?.modules?.capacity ?? true,
        settings: user.permissions?.modules?.settings ?? true,
        users: user.permissions?.modules?.users ?? (user.role === 'admin')
      };

      const initialActions: Required<ActionPermissions> = {
        export: user.permissions?.actions?.export ?? true,
        createEdit: user.permissions?.actions?.createEdit ?? true,
        delete: user.permissions?.actions?.delete ?? (user.role === 'admin'),
        manageUsers: user.permissions?.actions?.manageUsers ?? (user.role === 'admin')
      };

      setModules(initialModules);
      setActions(initialActions);
      setAllowedCountries(user.permissions?.allowedCountries || []);

      // Detect matched preset if any
      const matched = ROLE_PRESETS.find(p => p.role === user.role);
      if (matched) {
        setSelectedPresetId(matched.id);
      } else {
        setSelectedPresetId('custom');
      }
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') return;

    const preset = ROLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setRole(preset.role);
      if (preset.role === 'admin') {
        setCustomRoleName('Administrator');
      } else if (presetId === 'co_director') {
        setCustomRoleName('Co-Director');
      } else if (presetId === 'researcher') {
        setCustomRoleName('Researcher');
      } else if (presetId === 'viewer') {
        setCustomRoleName('Viewer');
      }

      setModules({
        overview: preset.permissions.modules?.overview ?? true,
        suite: preset.permissions.modules?.suite ?? false,
        activity: preset.permissions.modules?.activity ?? true,
        gantt: preset.permissions.modules?.gantt ?? true,
        directory: preset.permissions.modules?.directory ?? true,
        dissemination: preset.permissions.modules?.dissemination ?? true,
        capacity: preset.permissions.modules?.capacity ?? true,
        settings: preset.permissions.modules?.settings ?? true,
        users: preset.permissions.modules?.users ?? false
      });

      setActions({
        export: preset.permissions.actions?.export ?? true,
        createEdit: preset.permissions.actions?.createEdit ?? true,
        delete: preset.permissions.actions?.delete ?? false,
        manageUsers: preset.permissions.actions?.manageUsers ?? false
      });
      setAllowedCountries([]);
    }
  };

  const toggleModule = (key: keyof ModulePermissions) => {
    setSelectedPresetId('custom');
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAction = (key: keyof ActionPermissions) => {
    setSelectedPresetId('custom');
    setActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCountry = (country: string) => {
    setSelectedPresetId('custom');
    setAllowedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country) 
        : [...prev, country]
    );
  };

  const handleToggleAllModules = (enable: boolean) => {
    setSelectedPresetId('custom');
    setModules({
      overview: enable,
      suite: enable,
      activity: enable,
      gantt: enable,
      directory: enable,
      dissemination: enable,
      capacity: enable,
      settings: enable,
      users: enable
    });
  };

  const handleToggleAllActions = (enable: boolean) => {
    setSelectedPresetId('custom');
    setActions({
      export: enable,
      createEdit: enable,
      delete: enable,
      manageUsers: enable
    });
  };

  const handleSave = async () => {
    setErrorMessage('');
    setIsSaving(true);
    try {
      const finalRole = role === 'admin' ? 'admin' : 'user';
      const permissions: UserPermissions = {
        modules,
        actions,
        allowedCountries
      };

      await onSave(user.id, finalRole, customRoleName.trim() || undefined, permissions);
      onClose();
    } catch (err: any) {
      console.error('Failed to save permissions:', err);
      setErrorMessage(err.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Target': return <Target size={18} />;
      case 'LayoutDashboard': return <LayoutDashboard size={18} />;
      case 'ClipboardList': return <ClipboardList size={18} />;
      case 'Clock': return <Clock size={18} />;
      case 'Users': return <Users size={18} />;
      case 'Library': return <Library size={18} />;
      case 'GraduationCap': return <GraduationCap size={18} />;
      case 'Settings': return <Settings size={18} />;
      case 'UserCircle2': return <UserCircle2 size={18} />;
      default: return <Sliders size={18} />;
    }
  };

  const getActionIcon = (actionId: keyof ActionPermissions) => {
    switch (actionId) {
      case 'export': return <Download size={18} className="text-emerald-500" />;
      case 'createEdit': return <Edit3 size={18} className="text-blue-500" />;
      case 'delete': return <Trash2 size={18} className="text-rose-500" />;
      case 'manageUsers': return <Shield size={18} className="text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-brand-navy to-slate-900 text-white flex justify-between items-start relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders size={20} className="text-brand-orange" />
              <h2 className="text-xl font-bold">Customize Roles & Permissions</h2>
            </div>
            <p className="text-xs text-slate-300">
              Configure app module access and functional permissions for <span className="text-brand-orange font-semibold">{user.displayName || user.email}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2">
              <Info size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role Preset</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={cn(
                    "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer",
                    selectedPresetId === preset.id 
                      ? "border-brand-orange bg-orange-50/50 shadow-sm ring-2 ring-brand-orange/20" 
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{preset.name.split('/')[0]}</span>
                    {selectedPresetId === preset.id && <Check size={14} className="text-brand-orange" />}
                  </div>
                  <span className="text-[10px] text-slate-500 line-clamp-2">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Role Name Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">System Base Role</label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as any);
                  setSelectedPresetId('custom');
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-orange/20"
              >
                <option value="user">Standard Member</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Custom Display Role Title</label>
              <input
                type="text"
                value={customRoleName}
                onChange={(e) => {
                  setCustomRoleName(e.target.value);
                  setSelectedPresetId('custom');
                }}
                placeholder="e.g. Co-Director, Lead Researcher, M&E Officer"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-brand-orange/20"
              />
            </div>
          </div>

          {/* Tabs: Modules vs Function Rights vs Country Filters */}
          <div>
            <div className="flex items-center gap-6 border-b border-slate-200 mb-3 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('modules')}
                className={cn(
                  "pb-3 text-xs md:text-sm font-bold transition-all relative cursor-pointer shrink-0 whitespace-nowrap",
                  activeTab === 'modules' ? "text-brand-orange" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <span className="flex items-center gap-2">
                  <Sliders size={15} />
                  Module Access
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                    {Object.values(modules).filter(Boolean).length}/9
                  </span>
                </span>
                {activeTab === 'modules' && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('actions')}
                className={cn(
                  "pb-3 text-xs md:text-sm font-bold transition-all relative cursor-pointer shrink-0 whitespace-nowrap",
                  activeTab === 'actions' ? "text-brand-orange" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={15} />
                  Functional Rights
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                    {Object.values(actions).filter(Boolean).length}/4
                  </span>
                </span>
                {activeTab === 'actions' && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('countries')}
                className={cn(
                  "pb-3 text-xs md:text-sm font-bold transition-all relative cursor-pointer shrink-0 whitespace-nowrap",
                  activeTab === 'countries' ? "text-brand-orange" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <span className="flex items-center gap-2">
                  <Globe size={15} />
                  Country Restrictions
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-full",
                    allowedCountries.length > 0 
                      ? "bg-amber-100 text-amber-800" 
                      : "bg-emerald-100 text-emerald-800"
                  )}>
                    {allowedCountries.length > 0 ? `${allowedCountries.length} Restricted` : 'All Unrestricted'}
                  </span>
                </span>
                {activeTab === 'countries' && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
                )}
              </button>
            </div>

            {/* Tab Sub-Action Bar (Separate row preventing overlap) */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <p className="text-[11px] text-slate-500 font-medium">
                {activeTab === 'modules' && 'Enable or disable accessible project modules for this user.'}
                {activeTab === 'actions' && 'Configure functional permissions including export, edit, and deletion.'}
                {activeTab === 'countries' && 'Stratify Activity Tracker records accessible to this user.'}
              </p>

              {activeTab === 'modules' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => handleToggleAllModules(true)} 
                    className="text-[11px] font-bold text-brand-orange hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button 
                    type="button" 
                    onClick={() => handleToggleAllModules(false)} 
                    className="text-[11px] font-bold text-slate-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => handleToggleAllActions(true)} 
                    className="text-[11px] font-bold text-brand-orange hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button 
                    type="button" 
                    onClick={() => handleToggleAllActions(false)} 
                    className="text-[11px] font-bold text-slate-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {activeTab === 'countries' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedPresetId('custom');
                      setAllowedCountries([]);
                    }} 
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Allow All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedPresetId('custom');
                      setAllowedCountries([...ACTIVITY_COUNTRIES]);
                    }} 
                    className="text-[11px] font-bold text-brand-orange hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                </div>
              )}
            </div>

            {/* Modules Tab Content */}
            {activeTab === 'modules' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODULE_DEFINITIONS.map((def) => {
                  const isEnabled = !!modules[def.id];
                  return (
                    <div
                      key={def.id}
                      onClick={() => toggleModule(def.id)}
                      className={cn(
                        "p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none",
                        isEnabled 
                          ? "bg-slate-50 border-slate-300 text-slate-900" 
                          : "bg-white border-slate-200 text-slate-400 opacity-70 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          isEnabled ? "bg-brand-orange/10 text-brand-orange" : "bg-slate-100 text-slate-400"
                        )}>
                          {getModuleIcon(def.iconName)}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{def.label}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{def.description}</p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div className={cn(
                        "w-10 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 ml-2",
                        isEnabled ? "bg-brand-orange justify-end" : "bg-slate-200 justify-start"
                      )}>
                        <motion.div 
                          layout 
                          className="w-5 h-5 bg-white rounded-full shadow-sm" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions Tab Content */}
            {activeTab === 'actions' && (
              <div className="space-y-3">
                {ACTION_DEFINITIONS.map((def) => {
                  const isEnabled = !!actions[def.id];
                  return (
                    <div
                      key={def.id}
                      onClick={() => toggleAction(def.id)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none",
                        isEnabled 
                          ? "bg-slate-50 border-slate-300 text-slate-900 shadow-sm" 
                          : "bg-white border-slate-200 text-slate-400 opacity-70 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          isEnabled ? "bg-white shadow-sm border border-slate-200" : "bg-slate-100 text-slate-400"
                        )}>
                          {getActionIcon(def.id)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{def.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{def.description}</p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div className={cn(
                        "w-11 h-6.5 rounded-full transition-colors flex items-center p-0.5 shrink-0 ml-4",
                        isEnabled ? "bg-brand-orange justify-end" : "bg-slate-200 justify-start"
                      )}>
                        <motion.div 
                          layout 
                          className="w-5.5 h-5.5 bg-white rounded-full shadow-md" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Countries Tab Content */}
            {activeTab === 'countries' && (
              <div className="space-y-4">
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-sky-800 text-xs flex items-start gap-3">
                  <Globe size={18} className="shrink-0 text-sky-600 mt-0.5" />
                  <div>
                    <p className="font-bold mb-0.5">Stratified Activity Tracker Country Access</p>
                    <p className="text-sky-700 leading-relaxed">
                      Control which country deliverables this user can view, filter, and edit inside the Activity Tracker.
                      If no countries are selected (or "Allow All" is clicked), the user will have full access across all countries.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ACTIVITY_COUNTRIES.map((country) => {
                    const isSelected = allowedCountries.includes(country);
                    return (
                      <div
                        key={country}
                        onClick={() => toggleCountry(country)}
                        className={cn(
                          "p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none min-w-0",
                          isSelected 
                            ? "bg-orange-50/80 border-brand-orange text-slate-900 font-bold shadow-xs ring-1 ring-brand-orange/30" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 mr-2">
                          <MapPin size={14} className={cn("shrink-0", isSelected ? "text-brand-orange" : "text-slate-400")} />
                          <span className="text-xs truncate font-medium" title={country}>{country}</span>
                        </div>

                        <div className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0",
                          isSelected ? "bg-brand-orange border-brand-orange text-white" : "border-slate-300 bg-white"
                        )}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Current Status:</span>
                  {allowedCountries.length === 0 ? (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                      🌍 Unrestricted (Access to all countries)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg">
                      🔒 Restricted ({allowedCountries.length} of {ACTIVITY_COUNTRIES.length} countries allowed)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving Permissions...
              </>
            ) : (
              <>
                <Check size={16} />
                Save Role & Permissions
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
