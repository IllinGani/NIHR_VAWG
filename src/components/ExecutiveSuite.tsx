import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Clock, 
  CheckCircle2, 
  Calendar,
  Layout,
  ArrowUpRight,
  ClipboardList,
  Plus,
  Trash2,
  Check,
  Square,
  Edit2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Ticket, GanttTask, AnalyticsData, PersonalPriority, UserProfile } from '../types';
import { auth, db } from '../firebase';
import { cn } from '../lib/utils';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/firestore';

interface ExecutiveSuiteProps {
  tickets: Ticket[];
  ganttTasks: GanttTask[];
  userProfile: UserProfile | null;
  onViewAllTasks: () => void;
}

export const ExecutiveSuite: React.FC<ExecutiveSuiteProps> = ({ tickets, ganttTasks, userProfile, onViewAllTasks }) => {
  const user = auth.currentUser;
  const userIdentifier = userProfile?.name || user?.displayName || user?.email || '';
  
  const [personalPriorities, setPersonalPriorities] = useState<PersonalPriority[]>([]);
  const [newPriority, setNewPriority] = useState('');
  const [isLoadingPriorities, setIsLoadingPriorities] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Load personal priorities
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'personalPriorities'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PersonalPriority[];
      
      // Sort client-side by order, then by createdAt to avoid complex index requirement
      const sortedItems = items.sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });

      setPersonalPriorities(sortedItems);
      setIsLoadingPriorities(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'personalPriorities');
      setIsLoadingPriorities(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddPriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriority.trim() || !user) return;

    setAddError(null);
    const textToAdd = newPriority.trim();
    setNewPriority('');

    // Determine next order
    const maxOrder = personalPriorities.length > 0 
      ? Math.max(...personalPriorities.map(p => p.order || 0)) 
      : 0;

    try {
      if (!user.uid) throw new Error("No user UID found");

      await addDoc(collection(db, 'personalPriorities'), {
        text: textToAdd,
        completed: false,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: maxOrder + 1
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'personalPriorities');
      setAddError('Failed to add priority. Please try again.');
      setNewPriority(textToAdd);
      
      // Clear error after 5 seconds
      setTimeout(() => setAddError(null), 5000);
    }
  };

  const movePriority = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= personalPriorities.length) return;

    const itemA = personalPriorities[index];
    const itemB = personalPriorities[newIndex];

    try {
      // Swap orders
      const orderA = itemA.order ?? index;
      const orderB = itemB.order ?? newIndex;
      
      await updateDoc(doc(db, 'personalPriorities', itemA.id), { 
        order: orderB,
        updatedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'personalPriorities', itemB.id), { 
        order: orderA,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `personalPriorities/${itemA.id}`);
    }
  };

  const startEditing = (priority: PersonalPriority) => {
    setEditingPriorityId(priority.id);
    setEditText(priority.text);
  };

  const handleUpdateText = async (id: string) => {
    if (!editText.trim()) return;
    try {
      await updateDoc(doc(db, 'personalPriorities', id), {
        text: editText.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingPriorityId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `personalPriorities/${id}`);
    }
  };

  const togglePriority = async (priority: PersonalPriority) => {
    try {
      await updateDoc(doc(db, 'personalPriorities', priority.id), {
        completed: !priority.completed,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `personalPriorities/${priority.id}`);
    }
  };

  const deletePriority = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'personalPriorities', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `personalPriorities/${id}`);
    }
  };

  // Improved Ticket Filtering
  const filterMyTickets = (ticketList: Ticket[]) => {
    if (!user) return [];
    
    const userEmail = user.email?.toLowerCase().trim();
    const userName = (userProfile?.name || user.displayName || "").toLowerCase().trim();
    
    // Derived name from email (e.g. "t.piper@bham.ac.uk" -> ["t", "piper"])
    const emailPrefix = userEmail ? userEmail.split('@')[0].split(/[._-]/) : [];
    const derivedNameParts = emailPrefix.filter(p => p.length >= 1);

    // Split names to handle partial matches (e.g. "Ted Piper" -> ["ted", "piper"])
    const profileNameParts = userName 
      ? userName.split(' ').map(p => p.toLowerCase().trim()).filter(p => p.length >= 1)
      : [];
    
    // Combine all potential name parts for matching
    const nameParts = Array.from(new Set([...profileNameParts, ...derivedNameParts]));

    const isMatch = (ownerStr: string) => {
      if (!ownerStr) return false;
      const normalized = ownerStr.toLowerCase().trim();
      
      // 1. Exact matches
      if (userEmail && normalized === userEmail) return true;
      if (userName && normalized === userName) return true;
      
      // 2. Simple containment (e.g. "Ted Piper" matches "Ted Piper (Team)")
      if (userName && normalized.includes(userName)) return true;
      if (userName && userName.includes(normalized) && normalized.length >= 3) return true;

      // 3. Name parts intersection logic
      // Split owner string by common delimiters
      const ownerParts = normalized.split(/[ ,./(\)]+/).map(p => p.toLowerCase().trim()).filter(p => p.length >= 1);
      
      if (nameParts.length > 0 && ownerParts.length > 0) {
        // Count how many parts of the user's name are in the owner string or vice versa
        const matchedUserParts = nameParts.filter(up => {
          if (up.length < 3) return ownerParts.some(op => op === up); // Short names must be exact
          return ownerParts.some(op => op.includes(up) || up.includes(op));
        });

        // Pattern: If we match at least one part exactly and it's a significant name part
        // We prioritize profile names if available, then derived email parts
        const hasSignificantPartMatch = nameParts.some(np => 
          np.length >= 3 && ownerParts.some(op => op === np)
        );

        if (hasSignificantPartMatch) return true;

        // Pattern: "Ted" in ["ted", "pipers"]
        // If we have at least 2 distinct part matches
        if (matchedUserParts.length >= Math.min(2, nameParts.length) && matchedUserParts.length > 0) return true;
        
        // Exact part match for short but distinct parts (e.g. "Ted")
        if (nameParts.some(up => up.length >= 3 && ownerParts.some(op => op === up))) return true;
        
        // Check for reverse matches like "Pipers, Ted"
        const hasAllSignificantParts = nameParts.filter(p => p.length >= 3).every(np => 
          ownerParts.some(op => op.includes(np) || np.includes(op))
        );
        if (hasAllSignificantParts && nameParts.filter(p => p.length >= 3).length > 0) return true;
      }

      return false;
    };

    return ticketList.filter(t => {
      if (t.isArchived) return false;
      
      const ticketOwner = t.owner || '';
      const ticketOwners = t.owners || [];

      const mainOwnerMatch = isMatch(ticketOwner);
      const multiOwnerMatch = Array.isArray(ticketOwners) && ticketOwners.some(o => isMatch(o));

      return mainOwnerMatch || multiOwnerMatch;
    });
  };

  const myTrackerTasks = filterMyTickets(tickets).filter(t => t.status !== 'Completed');
  const completedTicketsCount = filterMyTickets(tickets).filter(t => t.status === 'Completed').length;
  
  // Project-wide active tasks (includes everyone's active tasks)
  const totalActiveProjectTasks = tickets.filter(t => t.status !== 'Completed' && !t.isArchived).length;
  const totalCompletedProjectTasks = tickets.filter(t => t.status === 'Completed').length;

  // 2. Gantt Snapshot (Upcoming Tasks)
  const upcomingTasks = [...ganttTasks]
    .filter(t => new Date(t.end) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research Executive Suite</h1>
          <p className="text-slate-500 text-sm mt-1">Personalized project intelligence for {userIdentifier}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-bold text-slate-600">
          <Calendar size={14} className="text-brand-orange" />
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard 
          label="My Active Tasks" 
          value={myTrackerTasks.length} 
          icon={ClipboardList} 
          color="orange" 
          trend={`${completedTicketsCount} completed by me`}
          onClick={onViewAllTasks}
        />
        <KpiCard 
          label="Total Project Tasks" 
          value={totalActiveProjectTasks} 
          icon={Activity} 
          color="navy" 
          trend={`${totalCompletedProjectTasks} total project completions`}
          onClick={onViewAllTasks}
        />
        <KpiCard 
          label="Personal Priorities" 
          value={personalPriorities.filter(p => !p.completed).length} 
          icon={Target} 
          color="blue" 
          trend="Custom weekly focus"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: My Activity Tracker Tasks */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 text-brand-orange rounded-xl">
                  <Layout size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Assigned Tracker Tasks</h3>
              </div>
              <button 
                onClick={onViewAllTasks}
                className="text-[10px] font-bold px-3 py-1 bg-white border border-slate-200 text-slate-500 hover:bg-brand-orange hover:text-white transition-all rounded-full uppercase tracking-wider shadow-sm"
              >
                Open Full Tracker
              </button>
            </div>
            <div className="p-6 flex-grow">
              {myTrackerTasks.length > 0 ? (
                <div className="space-y-3">
                  {myTrackerTasks.slice(0, 8).map((ticket, idx) => (
                    <motion.div 
                      key={ticket.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={onViewAllTasks}
                      className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-brand-orange/30 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          ticket.status === 'Priority' ? "bg-red-500 animate-pulse" : "bg-brand-orange"
                        )} />
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-brand-orange transition-colors">{ticket.ticketInfo}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                              <Target size={10} /> {ticket.no}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {ticket.deadline}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-50 rounded-lg">
                          {ticket.status}
                        </span>
                        <ArrowUpRight size={14} className="text-slate-200 group-hover:text-brand-orange transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                  {myTrackerTasks.length > 8 && (
                    <p className="text-center text-xs text-slate-400 pt-2 font-medium">
                      + {myTrackerTasks.length - 8} more tasks in tracker
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="p-4 bg-slate-50 rounded-full mb-4">
                    <CheckCircle2 size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-900 font-bold">No assigned tasks</p>
                  <p className="text-slate-500 text-sm mt-1 max-w-[200px]">Tasks where you are listed as an owner will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Personal Priorities */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full border-t-4 border-t-brand-blue">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-brand-blue rounded-xl">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Weekly Personal Priorities</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Independent Focus List</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6 flex-grow">
              {/* Add New Priority Form */}
              <div className="space-y-2">
                <form onSubmit={handleAddPriority} className="relative">
                  <input 
                    type="text"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    placeholder="Add a personal priority task..."
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-blue/20 focus:bg-white outline-none transition-all text-sm font-medium"
                  />
                  <button 
                    type="submit"
                    disabled={!newPriority.trim()}
                    className="absolute right-2 top-1.5 p-2 bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 disabled:opacity-50 disabled:hover:bg-brand-blue transition-all shadow-sm"
                  >
                    <Plus size={18} />
                  </button>
                </form>
                {addError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-bold text-red-500 flex items-center gap-1 ml-2"
                  >
                    <AlertCircle size={10} /> {addError}
                  </motion.p>
                )}
              </div>

              {/* Priorities List */}
              <div className="space-y-2 min-h-[300px]">
                {isLoadingPriorities ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : personalPriorities.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {personalPriorities.map((priority, index) => (
                      <motion.div 
                        key={priority.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border transition-all group",
                          priority.completed 
                            ? "bg-slate-50 border-slate-100 opacity-60" 
                            : "bg-white border-slate-100 hover:border-brand-blue/20 hover:shadow-sm"
                        )}
                      >
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            disabled={index === 0}
                            onClick={() => movePriority(index, 'up')}
                            className="p-0.5 text-slate-300 hover:text-brand-blue disabled:opacity-0"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button 
                            disabled={index === personalPriorities.length - 1}
                            onClick={() => movePriority(index, 'down')}
                            className="p-0.5 text-slate-300 hover:text-brand-blue disabled:opacity-0"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        <button 
                          onClick={() => togglePriority(priority)}
                          className={cn(
                            "p-1 rounded-lg transition-colors shrink-0",
                            priority.completed ? "text-brand-blue" : "text-slate-300 hover:text-brand-blue"
                          )}
                        >
                          {priority.completed ? <CheckCircle2 size={20} /> : <Square size={20} />}
                        </button>

                        {editingPriorityId === priority.id ? (
                          <div className="flex-grow flex items-center gap-2">
                            <input 
                              autoFocus
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onBlur={() => handleUpdateText(priority.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateText(priority.id);
                                if (e.key === 'Escape') setEditingPriorityId(null);
                              }}
                              className="w-full bg-white border border-brand-blue/20 rounded-lg px-2 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue/20"
                            />
                          </div>
                        ) : (
                          <span 
                            onClick={() => startEditing(priority)}
                            className={cn(
                              "flex-grow text-sm font-medium transition-all truncate cursor-text",
                              priority.completed ? "line-through text-slate-400" : "text-slate-700"
                            )}
                          >
                            {priority.text}
                          </span>
                        )}

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {!priority.completed && editingPriorityId !== priority.id && (
                            <button 
                              onClick={() => startEditing(priority)}
                              className="p-1.5 text-slate-300 hover:text-brand-blue hover:bg-blue-50 rounded-lg"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => deletePriority(priority.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                    <ClipboardList size={40} className="text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-400">Your focus list is empty</p>
                    <p className="text-[10px] font-medium max-w-[160px] mt-1">Set your weekly priorities above to stay on track.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-brand-blue/5 border-t border-brand-blue/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest px-2">Focus Session</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">{personalPriorities.filter(p => !p.completed).length} Remaining</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: any;
  color: 'orange' | 'blue' | 'amber' | 'navy';
  trend: string;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon: Icon, color, trend, onClick }) => {
  const colorMap = {
    orange: "bg-orange-50 text-brand-orange",
    blue: "bg-blue-50 text-brand-blue",
    amber: "bg-amber-50 text-amber-600",
    navy: "bg-slate-100 text-brand-navy"
  };

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden",
        onClick && "cursor-pointer active:scale-95 transition-transform"
      )}
    >
      <div className={cn("p-3 rounded-2xl w-fit mb-4", colorMap[color].split(' ').slice(2).join(' '))}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
      <p className="text-[10px] font-bold text-slate-500 mt-3 flex items-center gap-1.5">
        <ArrowUpRight size={12} className="text-slate-300" />
        {trend}
      </p>
    </motion.div>
  );
};
