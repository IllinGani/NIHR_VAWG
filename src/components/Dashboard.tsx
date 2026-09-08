import React, { useState, useEffect, useRef } from 'react';
import { 
  Target,
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  Library, 
  LogOut, 
  Bell, 
  Search,
  Users,
  UserCircle2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Edit2,
  X,
  Plus,
  Trash2,
  Check,
  Quote,
  PoundSterling,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
  Shield,
  Menu,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActivityTracker } from './ActivityTracker';
import { TeamDirectory } from './TeamDirectory';
import { DisseminationRepo } from './DisseminationRepo';
import { GanttChart } from './GanttChart';
import { UserManagement } from './UserManagement';
import { ExecutiveSuite } from './ExecutiveSuite';
import { ProjectOverview } from './ProjectOverview';
import { ConfirmationModal } from './ConfirmationModal';
import { CapacityBuilding } from './CapacityBuilding';
import { AnnualReport } from './AnnualReport';
import { Settings as SettingsComponent } from './Settings';
import { cn } from '../lib/utils';
import { MOCK_TICKETS, MOCK_ANALYTICS, MOCK_DISSEMINATION, MOCK_GANTT_TASKS, TEAM_MEMBERS } from '../constants';
import { Ticket, AnalyticsData, DisseminationItem, GanttTask, UserProfile, TeamMember } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDocs,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { hasModuleAccess } from '../lib/permissions';

interface DashboardProps {
  onLogout: () => void;
}

const QUOTES = [
  "“Ending violence against women and children requires not just policy change, but a shift in the very fabric of our communities.”",
  "“Survivor-led research ensures that solutions are rooted in the reality of those who have experienced harm.”",
  "“Data is a powerful tool for advocacy, but only when it amplifies the voices of the silenced.”",
  "“Prevention is better than cure — especially when the 'cure' involves repairing shattered lives.”",
  "“Global collaboration is key to tackling the systemic roots of gender-based violence.”"
];

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'annual_report' | 'suite' | 'activity' | 'directory' | 'dissemination' | 'capacity' | 'gantt' | 'users' | 'settings'>('overview');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lifted States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [disseminationItems, setDisseminationItems] = useState<DisseminationItem[]>([]);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const isSeeding = useRef(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const user = auth.currentUser;

  // Cleanup duplicates on load
  useEffect(() => {
    const cleanup = async () => {
      if (!user || loading) return;
      
      const isUserApproved = userProfile?.isApproved || 
                             userProfile?.role === 'admin' || 
                             user?.email?.toLowerCase() === 'ganiillin@gmail.com';
                             
      if (!isUserApproved) {
        console.log('Dashboard: Skipping duplicate cleanup (user not approved/loaded yet)');
        return;
      }
      
      console.log('Dashboard: Running duplicate cleanup...');
      try {
        const collections = ['tickets', 'tasks'];
        for (const colName of collections) {
          const q = query(collection(db, colName));
          const snap = await getDocs(q);
          const seen = new Set();
          const batch = writeBatch(db);
          let count = 0;
          
          // Sort docs to prefer keeping those where doc.id matches data.id (correctly seeded)
          const sortedDocs = [...snap.docs].sort((a, b) => {
            const aData = a.data();
            const bData = b.data();
            const aMatches = a.id === aData.id ? 1 : 0;
            const bMatches = b.id === bData.id ? 1 : 0;
            return bMatches - aMatches; // Prefer matches
          });

          sortedDocs.forEach(doc => {
            const data = doc.data();
            const key = colName === 'tickets' 
              ? `${data.no}-${data.ticketInfo}`
              : `${data.name}-${data.start}-${data.end}`;
            
            if (seen.has(key)) {
              batch.delete(doc.ref);
              count++;
            } else {
              seen.add(key);
            }
          });
          
          if (count > 0) {
            await batch.commit();
            console.log(`Dashboard: Cleaned up ${count} duplicates from ${colName}`);
          }
        }
      } catch (error) {
        console.error('Dashboard: Error during cleanup:', error);
      }
    };
    
    if (!loading) {
      cleanup();
    }
  }, [user, loading, userProfile]);

  useEffect(() => {
    if (!user) return;

    // Check admin status and fetch full profile
    const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data() as UserProfile;
        setUserProfile(userData);
        setIsAdmin(userData.role === 'admin' || user.email === 'ganiillin@gmail.com');
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });

    const qTickets = query(collection(db, 'tickets'));
    const unsubscribeTickets = onSnapshot(qTickets, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ticket));
      setTickets(data);
      // Auto-seeding removed as requested
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tickets');
      setLoading(false);
    });

    const qAnalytics = query(collection(db, 'analytics'));
    const unsubscribeAnalytics = onSnapshot(qAnalytics, (snapshot) => {
      setAnalyticsData(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'analytics');
    });

    const qDissemination = query(collection(db, 'dissemination'));
    const unsubscribeDissemination = onSnapshot(qDissemination, (snapshot) => {
      setDisseminationItems(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DisseminationItem)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'dissemination');
    });

    const qTasks = query(collection(db, 'tasks'));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      setGanttTasks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GanttTask)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tasks');
    });

    const qTeam = query(collection(db, 'teamMembers'));
    const unsubscribeTeam = onSnapshot(qTeam, (snapshot) => {
      setTeamMembers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TeamMember)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'teamMembers');
    });

    // Only subscribe to users collection if admin or the user exists (avoiding list permission errors for standard users)
    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserProfile)));
    }, (err: any) => {
      // It's expected that non-admins might not be able to list all users
      // We check for the explicit 'permission-denied' code or standard permission message
      const isPermissionDenied = err.code === 'permission-denied' || 
                                 (err.message && err.message.includes('permissions'));
      
      if (isPermissionDenied) {
        console.warn('Dashboard: User list access restricted (expected for non-admins)');
      } else {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribeTickets();
      unsubscribeAnalytics();
      unsubscribeDissemination();
      unsubscribeTasks();
      unsubscribeTeam();
      unsubscribeUsers();
    };
  }, [user]);

  const seedMockData = async () => {
    if (!user || isSeeding.current) return;
    isSeeding.current = true;
    const batch = writeBatch(db);
    
    MOCK_TICKETS.forEach((t, i) => {
      const docId = t.id ? t.id : `mock_ticket_${t.no.replace(/\./g, '_')}_${i}`;
      const ref = doc(db, 'tickets', docId);
      batch.set(ref, { ...t, id: docId, userId: user.uid });
    });
    
    MOCK_ANALYTICS.forEach((a, i) => {
      const docId = `mock_analytics_${i}`;
      const ref = doc(db, 'analytics', docId);
      batch.set(ref, { ...a, id: docId, userId: user.uid });
    });
    
    MOCK_DISSEMINATION.forEach((d) => {
      const docId = `mock_dissemination_${d.id}`;
      const ref = doc(db, 'dissemination', docId);
      batch.set(ref, { ...d, id: docId, userId: user.uid });
    });
    
    MOCK_GANTT_TASKS.forEach((gt) => {
      const docId = `mock_task_${gt.id}`;
      const ref = doc(db, 'tasks', docId);
      batch.set(ref, { ...gt, id: docId, userId: user.uid });
    });

    TEAM_MEMBERS.forEach((tm) => {
      const docId = `team_${tm.id}`;
      const ref = doc(db, 'teamMembers', docId);
      batch.set(ref, { 
        ...tm, 
        id: docId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    await batch.commit();
    isSeeding.current = false;
  };

  const cleanupDuplicates = async () => {
    if (!user || !isAdmin) return;
    
    setIsSaving(true);
    try {
      // Clean Tickets
      const seenTickets = new Set<string>();
      const ticketsToDelete: string[] = [];
      const sortedTickets = [...tickets].sort((a, b) => {
        const idA = a.id || '';
        const idB = b.id || '';
        return idA.length - idB.length || idA.localeCompare(idB);
      });
      
      sortedTickets.forEach(ticket => {
        const key = `${ticket.no}_${ticket.ticketInfo}`.toLowerCase().trim();
        if (seenTickets.has(key)) {
          if (ticket.id) ticketsToDelete.push(ticket.id);
        } else {
          seenTickets.add(key);
        }
      });
      
      // Clean Gantt Tasks
      const seenTasks = new Set<string>();
      const tasksToDelete: string[] = [];
      const sortedTasks = [...ganttTasks].sort((a, b) => {
        const idA = a.id || '';
        const idB = b.id || '';
        return idA.length - idB.length || idA.localeCompare(idB);
      });

      sortedTasks.forEach(task => {
        const key = `${task.name}_${task.start}_${task.end}`.toLowerCase().trim();
        if (seenTasks.has(key)) {
          if (task.id) tasksToDelete.push(task.id);
        } else {
          seenTasks.add(key);
        }
      });

      const batch = writeBatch(db);
      ticketsToDelete.forEach(id => batch.delete(doc(db, 'tickets', id)));
      tasksToDelete.forEach(id => batch.delete(doc(db, 'tasks', id)));
      
      if (ticketsToDelete.length > 0 || tasksToDelete.length > 0) {
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'cleanupDuplicates');
    } finally {
      setIsSaving(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  // Optimized CRUD Handlers
  const ticketsHandler = {
    add: async (ticket: Ticket) => {
      if (!user) return;
      setIsSaving(true);
      try {
        const docId = ticket.id || doc(collection(db, 'tickets')).id;
        await setDoc(doc(db, 'tickets', docId), { 
          ...ticket, 
          id: docId, 
          userId: user.uid,
          createdAt: ticket.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'tickets');
      } finally {
        setIsSaving(false);
      }
    },
    update: async (ticket: Ticket) => {
      if (!user || !ticket.id) return;
      setIsSaving(true);
      try {
        await updateDoc(doc(db, 'tickets', ticket.id), { 
          ...ticket,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `tickets/${ticket.id}`);
      } finally {
        setIsSaving(false);
      }
    },
    delete: async (id: string) => {
      if (!user || !id) return;
      setIsSaving(true);
      try {
        await deleteDoc(doc(db, 'tickets', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tickets/${id}`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const analyticsHandler = {
    add: async (data: AnalyticsData) => {
      if (!user) return;
      setIsSaving(true);
      try {
        const docId = data.id || doc(collection(db, 'analytics')).id;
        await setDoc(doc(db, 'analytics', docId), { 
          ...data, 
          id: docId, 
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'analytics');
      } finally {
        setIsSaving(false);
      }
    },
    update: async (data: AnalyticsData) => {
      if (!user || !data.id) return;
      setIsSaving(true);
      try {
        await updateDoc(doc(db, 'analytics', data.id), { 
          ...data,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `analytics/${data.id}`);
      } finally {
        setIsSaving(false);
      }
    },
    delete: async (id: string) => {
      if (!user || !id) return;
      setIsSaving(true);
      try {
        await deleteDoc(doc(db, 'analytics', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `analytics/${id}`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const disseminationHandler = {
    add: async (item: DisseminationItem) => {
      if (!user) return;
      setIsSaving(true);
      try {
        const docId = item.id || doc(collection(db, 'dissemination')).id;
        await setDoc(doc(db, 'dissemination', docId), { 
          ...item, 
          id: docId, 
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'dissemination');
      } finally {
        setIsSaving(false);
      }
    },
    update: async (item: DisseminationItem) => {
      if (!user || !item.id) return;
      setIsSaving(true);
      try {
        await updateDoc(doc(db, 'dissemination', item.id), { 
          ...item,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `dissemination/${item.id}`);
      } finally {
        setIsSaving(false);
      }
    },
    delete: async (id: string) => {
      if (!user || !id) return;
      setIsSaving(true);
      try {
        await deleteDoc(doc(db, 'dissemination', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `dissemination/${id}`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const tasksHandler = {
    add: async (task: GanttTask) => {
      if (!user) return;
      setIsSaving(true);
      try {
        const docId = task.id || doc(collection(db, 'tasks')).id;
        await setDoc(doc(db, 'tasks', docId), { 
          ...task, 
          id: docId, 
          userId: user.uid,
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'tasks');
      } finally {
        setIsSaving(false);
      }
    },
    update: async (task: GanttTask) => {
      if (!user || !task.id) return;
      setIsSaving(true);
      try {
        await updateDoc(doc(db, 'tasks', task.id), { 
          ...task,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
      } finally {
        setIsSaving(false);
      }
    },
    delete: async (id: string) => {
      console.log('Dashboard: tasksHandler.delete called with ID:', id);
      if (!user || !id) {
        console.warn('Dashboard: Delete aborted - user or id missing', { user: !!user, id });
        return false;
      }
      setIsSaving(true);
      try {
        const docRef = doc(db, 'tasks', id);
        console.log('Dashboard: Deleting document at path:', docRef.path);
        
        // Check if document exists before deleting (for better logging)
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          console.warn(`Dashboard: Document ${id} does not exist in 'tasks' collection.`);
          return false;
        }

        await deleteDoc(docRef);
        console.log('Dashboard: Task deleted successfully from Firestore:', id);
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
        return false;
      } finally {
        setIsSaving(false);
      }
    }
  };

  const teamHandler = {
    add: async (member: TeamMember) => {
      if (!user) return;
      setIsSaving(true);
      try {
        const docId = member.id || doc(collection(db, 'teamMembers')).id;
        await setDoc(doc(db, 'teamMembers', docId), { 
          ...member, 
          id: docId, 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        if (member.linkedUserId) {
          try {
            await updateDoc(doc(db, 'users', member.linkedUserId), {
              teamMemberId: docId,
              updatedAt: new Date().toISOString()
            });
          } catch (e) {
            console.warn('Could not update user with linked teamMemberId:', e);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'teamMembers');
      } finally {
        setIsSaving(false);
      }
    },
    update: async (member: TeamMember) => {
      if (!user || !member.id) return;
      setIsSaving(true);
      try {
        await updateDoc(doc(db, 'teamMembers', member.id), { 
          ...member,
          updatedAt: new Date().toISOString()
        });
        if (member.linkedUserId) {
          try {
            await updateDoc(doc(db, 'users', member.linkedUserId), {
              teamMemberId: member.id,
              updatedAt: new Date().toISOString()
            });
          } catch (e) {
            console.warn('Could not update user with linked teamMemberId:', e);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `teamMembers/${member.id}`);
      } finally {
        setIsSaving(false);
      }
    },
    delete: async (id: string) => {
      if (!user || !id) return;
      setIsSaving(true);
      try {
        await deleteDoc(doc(db, 'teamMembers', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `teamMembers/${id}`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Remove resetData function as requested

  const taskCount = tickets.filter(t => t.status !== 'Completed' && !t.isArchived).length; 

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const allMenuItems = [
    { id: 'overview', label: 'Project Overview', icon: BookOpen },
    { id: 'annual_report', label: 'Progress Report', icon: FileCheck },
    { id: 'suite', label: 'Executive Suite', icon: Target },
    { id: 'activity', label: 'Activity Tracker', icon: ClipboardList },
    { id: 'gantt', label: 'Gantt Chart', icon: Clock },
    { id: 'directory', label: 'Team Directory', icon: Users },
    { id: 'dissemination', label: 'Content Management System', icon: Library },
    { id: 'capacity', label: 'Capacity Building & Training', icon: GraduationCap },
    { id: 'settings', label: 'Account Settings', icon: SettingsIcon },
    { id: 'users', label: 'User Management', icon: UserCircle2 },
  ];

  const menuItems = allMenuItems.filter(item => hasModuleAccess(userProfile, item.id, isAdmin));

  if (loading && tickets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className={cn(
        "hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shrink-0",
        isSidebarCollapsed ? "w-20 p-3 items-center" : "w-64 p-6"
      )}>
        {/* Sidebar Header & Toggle Button */}
        <div className={cn(
          "mb-6 flex items-center justify-between gap-2 border-b border-slate-100 pb-4 w-full",
          isSidebarCollapsed && "flex-col items-center justify-center gap-3 border-b-0 pb-0"
        )}>
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2 overflow-hidden">
                <img 
                  src="https://lh3.googleusercontent.com/u/0/d/1wYh6a4hfP48_1B2PFPh9MI_mmETeNvmY" 
                  alt="NIHR Logo" 
                  className="h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button 
                onClick={() => setIsSidebarCollapsed(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-brand-orange hover:text-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all shadow-sm cursor-pointer shrink-0"
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={16} />
                <span className="hidden lg:inline">Collapse</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <img 
                src="https://lh3.googleusercontent.com/u/0/d/1wYh6a4hfP48_1B2PFPh9MI_mmETeNvmY" 
                alt="NIHR Logo" 
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-full flex items-center justify-center p-2.5 bg-slate-100 hover:bg-brand-orange hover:text-white text-slate-700 rounded-xl transition-all shadow-sm cursor-pointer border border-slate-200"
                title="Expand Sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            </div>
          )}
        </div>

        <nav className="flex-grow space-y-1.5 w-full">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              title={isSidebarCollapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center rounded-xl text-sm font-semibold transition-all",
                isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                activeTab === item.id 
                  ? "bg-brand-orange text-white shadow-lg shadow-orange-100" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!isSidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-100 w-full mt-auto">
          {!isSidebarCollapsed ? (
            <>
              <div className="px-4 py-3 mb-3 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged in as</p>
                  <span className="text-[9px] font-semibold text-slate-400">
                    {Object.values(userProfile?.permissions?.modules || {}).filter(Boolean).length || (isAdmin ? 10 : 8)}/10 modules
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {userProfile?.displayName || user?.displayName || user?.email?.split('@')[0]}
                </p>
                <p className="text-[11px] text-slate-500 truncate mb-2">{user?.email}</p>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  {isAdmin && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded-md uppercase border border-purple-200/60">
                      Admin
                    </span>
                  )}
                  {userProfile?.customRoleName ? (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-md uppercase border border-indigo-200/60">
                      {userProfile.customRoleName}
                    </span>
                  ) : (!isAdmin && userProfile?.isApproved) && (
                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-[9px] font-bold rounded-md uppercase border border-cyan-200/60">
                      Project Member
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <button 
              onClick={onLogout}
              title="Logout"
              className="w-full flex items-center justify-center p-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Navigation Drawer Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-brand-orange hover:text-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all shadow-sm cursor-pointer shrink-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              <span>{isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
            </button>
            <h2 className="text-sm font-bold text-slate-900 md:block hidden ml-2">
              NIHR Global Health Group Preventing VAW/VAC
            </h2>
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-2">
              <img 
                src="https://lh3.googleusercontent.com/u/0/d/1wYh6a4hfP48_1B2PFPh9MI_mmETeNvmY" 
                alt="NIHR Logo" 
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {isSaving && (
              <div className="flex items-center gap-2 text-brand-orange animate-pulse">
                <div className="w-1.5 h-1.5 bg-brand-orange rounded-full"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Saving...</span>
              </div>
            )}
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full relative cursor-pointer">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            {/* User Profile Info Badge in Top Bar */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-brand-navy text-white font-bold text-xs flex items-center justify-center border border-slate-300 overflow-hidden shrink-0 shadow-xs">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  (userProfile?.displayName || user?.displayName || user?.email || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[120px] sm:max-w-[160px]">
                  {userProfile?.displayName || user?.displayName || user?.email?.split('@')[0]}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  {isAdmin && (
                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-bold rounded uppercase border border-purple-200/80">
                      Admin
                    </span>
                  )}
                  {userProfile?.customRoleName ? (
                    <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded uppercase border border-indigo-200/80">
                      {userProfile.customRoleName}
                    </span>
                  ) : (!isAdmin && userProfile?.isApproved) && (
                    <span className="px-1.5 py-0.2 bg-cyan-100 text-cyan-700 text-[9px] font-bold rounded uppercase border border-cyan-200/80">
                      Member
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm md:hidden flex justify-start"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-4/5 max-w-xs bg-white h-full p-6 flex flex-col shadow-2xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-2">
                    <img 
                      src="https://lh3.googleusercontent.com/u/0/d/1wYh6a4hfP48_1B2PFPh9MI_mmETeNvmY" 
                      alt="NIHR Logo" 
                      className="h-10 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="space-y-1.5 flex-grow">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                        activeTab === item.id 
                          ? "bg-brand-orange text-white shadow-lg shadow-orange-100" 
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Mobile Logged In As Box */}
                <div className="pt-4 border-t border-slate-100 mt-auto space-y-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Logged in as</p>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {userProfile?.displayName || user?.displayName || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mb-2">{user?.email}</p>
                    
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isAdmin && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded-md uppercase border border-purple-200">
                          Admin
                        </span>
                      )}
                      {userProfile?.customRoleName ? (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-md uppercase border border-indigo-200">
                          {userProfile.customRoleName}
                        </span>
                      ) : (!isAdmin && userProfile?.isApproved) && (
                        <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-[9px] font-bold rounded-md uppercase border border-cyan-200">
                          Project Member
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Body */}
        <div className="p-6 md:p-8 space-y-8 w-full mr-auto text-left">
          {/* Header Highlights - Quote Slider */}
          <div className="bg-brand-navy p-8 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden flex items-center min-h-[240px] md:min-h-[160px] w-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blue/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            
            <div className="relative z-10 flex items-start gap-6 w-full text-left">
              <Quote className="text-brand-orange shrink-0 opacity-50" size={32} />
              <div className="flex-grow flex flex-col justify-center min-h-[140px] md:min-h-[100px]">
                <div className="relative flex-grow">
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={currentQuoteIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-lg md:text-xl font-medium text-white leading-relaxed italic"
                    >
                      {QUOTES[currentQuoteIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="flex gap-2 mt-6">
                  {QUOTES.map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentQuoteIndex(i)}
                      className={cn(
                        "h-1 rounded-full transition-all",
                        currentQuoteIndex === i ? "bg-brand-orange w-8" : "bg-white/10 w-2 hover:bg-white/20"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                  activeTab === item.id 
                    ? "bg-brand-orange text-white" 
                    : "bg-white text-slate-500 border border-slate-200"
                )}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'overview' && (
              <ProjectOverview />
            )}
            {activeTab === 'annual_report' && (
              <AnnualReport 
                userProfile={userProfile} 
                isAdmin={isAdmin} 
              />
            )}
            {activeTab === 'suite' && (
              <ExecutiveSuite 
                tickets={tickets}
                ganttTasks={ganttTasks}
                userProfile={userProfile}
                onViewAllTasks={() => setActiveTab('activity')}
              />
            )}
            {activeTab === 'activity' && (
              <ActivityTracker 
                tickets={tickets} 
                registeredUsers={users}
                teamMembers={teamMembers}
                userProfile={userProfile}
                onAdd={ticketsHandler.add}
                onUpdate={ticketsHandler.update}
                onDelete={ticketsHandler.delete}
                isSaving={isSaving}
                isAdmin={isAdmin}
                onSeed={seedMockData}
              />
            )}
            {activeTab === 'gantt' && (
              <GanttChart 
                tasks={ganttTasks} 
                onAdd={tasksHandler.add}
                onUpdate={tasksHandler.update}
                onDelete={tasksHandler.delete}
                isSaving={isSaving}
              />
            )}
            {activeTab === 'directory' && (
              <TeamDirectory 
                members={teamMembers}
                registeredUsers={users}
                isAdmin={isAdmin}
                userProfile={userProfile}
                onAdd={teamHandler.add}
                onUpdate={teamHandler.update}
                onDelete={teamHandler.delete}
                onSeed={seedMockData}
                isSaving={isSaving}
              />
            )}
            {activeTab === 'dissemination' && (
              <DisseminationRepo 
                items={disseminationItems} 
                onAdd={disseminationHandler.add}
                onUpdate={disseminationHandler.update}
                onDelete={disseminationHandler.delete}
              />
            )}
            {activeTab === 'capacity' && (
              <CapacityBuilding 
                isAdmin={isAdmin} 
                teamMembers={teamMembers} 
                userProfile={userProfile} 
              />
            )}
            {activeTab === 'settings' && (
              <SettingsComponent userProfile={userProfile} onProfileUpdated={() => console.log('Profile updated!')} />
            )}
            {activeTab === 'users' && isAdmin && (
              <UserManagement teamMembers={teamMembers} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
