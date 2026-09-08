import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, Plus, Edit2, Check, X, ChevronLeft, ChevronRight, User, Tag, Trash2, Filter, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GanttTask } from '../types';
import { MOCK_GANTT_TASKS } from '../constants';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';

interface GanttChartProps {
  tasks: GanttTask[];
  onAdd: (task: GanttTask) => void;
  onUpdate: (task: GanttTask) => void;
  onDelete: (taskId: string) => Promise<boolean>;
  isSaving?: boolean;
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, onAdd, onUpdate, onDelete, isSaving }) => {
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Timeline view settings
  const [viewStart, setViewStart] = useState(new Date('2026-01-01'));
  const dayWidth = 30; // pixels per day
  const rowHeight = 48;
  const headerHeight = 80;
  const taskListWidth = 280;

  const months = useMemo(() => {
    const result = [];
    let current = new Date(viewStart);
    for (let i = 0; i < 6; i++) {
      result.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [viewStart]);

  const totalDays = useMemo(() => {
    const end = new Date(months[months.length - 1]);
    end.setMonth(end.getMonth() + 1);
    return Math.ceil((end.getTime() - months[0].getTime()) / (1000 * 60 * 60 * 24));
  }, [months]);

  const timelineWidth = totalDays * dayWidth;

  const getPos = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = date.getTime() - months[0].getTime();
    return (diff / (1000 * 60 * 60 * 24)) * dayWidth;
  };

  const getWidth = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = end.getTime() - start.getTime();
    return (diff / (1000 * 60 * 60 * 24)) * dayWidth;
  };

  const todayPos = useMemo(() => {
    const today = new Date();
    if (today < months[0] || today > new Date(months[months.length - 1].getTime() + 31 * 24 * 60 * 60 * 1000)) return -1;
    return getPos(today.toISOString().split('T')[0]);
  }, [months]);

  const handleSaveTask = (task: GanttTask) => {
    if (isAdding) {
      onAdd(task);
    } else {
      onUpdate(task);
    }
    setEditingTask(null);
    setIsAdding(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    console.log('GanttChart: handleDeleteTask called with ID:', taskId);
    const success = await onDelete(taskId);
    if (success) {
      setEditingTask(null);
      setTaskToDelete(null);
    } else {
      console.error('GanttChart: Deletion failed for task:', taskId);
      // We keep the modal open so the user knows it didn't work
      // They can try again or cancel.
    }
  };

  const categories = [
    { id: 'All', label: 'All Parts', color: 'bg-slate-500' },
    { id: 'Core', label: 'Core (High Priority)', color: 'bg-rose-500' },
    { id: 'WP1', label: 'WP1', color: 'bg-sky-500' },
    { id: 'WP2', label: 'WP2', color: 'bg-blue-600' },
    { id: 'WP3', label: 'WP3', color: 'bg-purple-500' },
    { id: 'WP4', label: 'WP4', color: 'bg-blue-400' },
    { id: 'WP5', label: 'WP5', color: 'bg-indigo-500' },
    { id: 'Project_admin', label: 'Project Admin', color: 'bg-red-500' },
    { id: 'OHID_evaluation', label: 'Any Other Business (AOB)', color: 'bg-stone-500' },
  ];

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeCategory === 'All') return true;
      if (activeCategory === 'Core') return t.isCore;
      return t.category === activeCategory;
    });
  }, [tasks, activeCategory]);

  const getDeadlineColor = (deadlineStr: string) => {
    if (!deadlineStr) return 'text-slate-400';
    try {
      const deadlineDate = new Date(deadlineStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 14) return 'text-rose-500';
      if (diffDays <= 28) return 'text-amber-500';
      return 'text-emerald-500';
    } catch (e) {
      return 'text-slate-400';
    }
  };

  const getDeadlineBg = (deadlineStr: string) => {
    if (!deadlineStr) return 'bg-slate-400';
    try {
      const deadlineDate = new Date(deadlineStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 14) return 'bg-rose-500';
      if (diffDays <= 28) return 'bg-amber-500';
      return 'bg-emerald-500';
    } catch (e) {
      return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="overflow-x-auto pb-2 flex-grow">
          <div className="flex items-center gap-2 min-w-max">
            <Filter size={14} className="text-slate-400 mr-2" />
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-bold transition-all border",
                  activeCategory === cat.id 
                    ? "bg-brand-orange text-white border-brand-orange" 
                    : "bg-white text-slate-500 border-slate-200 hover:border-brand-orange/50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button 
              onClick={() => {
                const d = new Date(viewStart);
                d.setMonth(d.getMonth() - 1);
                setViewStart(d);
              }}
              className="p-2 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 py-2 text-sm font-bold border-x border-slate-100 min-w-[140px] text-center">
              {viewStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </div>
            <button 
              onClick={() => {
                const d = new Date(viewStart);
                d.setMonth(d.getMonth() + 1);
                setViewStart(d);
              }}
              className="p-2 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingTask({
                id: Math.random().toString(36).substr(2, 9),
                name: 'New Task',
                category: activeCategory === 'All' || activeCategory === 'Core' ? 'WP1' : activeCategory,
                start: new Date().toISOString().split('T')[0],
                end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                progress: 0,
                owner: '',
                isCore: activeCategory === 'Core',
                createdAt: new Date().toLocaleDateString('en-GB')
              });
            }}
            className="bg-brand-orange text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {/* Gantt Container */}
        <div className="flex overflow-hidden">
          {/* Task List Column */}
          <div className="w-[280px] shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/30">
            <div style={{ height: headerHeight }} className="border-b border-slate-200 flex items-end p-4 pb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Details</span>
            </div>
            <div className="flex-grow">
              {filteredTasks.map((task, i) => (
                <div 
                  key={task.id} 
                  style={{ height: rowHeight }} 
                  className={cn(
                    "px-4 flex flex-col justify-center border-b border-slate-100 group cursor-pointer hover:bg-white transition-colors",
                    i % 2 === 0 ? "bg-slate-50/20" : "bg-transparent"
                  )}
                  onClick={() => setEditingTask(task)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate pr-2">{task.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 size={10} className="text-slate-300 hover:text-brand-orange" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskToDelete(task.id);
                        }}
                        className="text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-medium text-slate-400" title="Date Created">{task.createdAt || 'N/A'}</span>
                    <span className={cn("text-[9px] font-bold", getDeadlineColor(task.end))}>
                      Ends: {new Date(task.end).toLocaleDateString('en-GB')}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400">{task.owner || 'Unassigned'}</span>
                    <span className="text-[9px] font-bold text-brand-orange">{task.progress}%</span>
                    {task.isCore && (
                      <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-1 rounded">CORE</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline View */}
          <div className="flex-grow overflow-x-auto scrollbar-hide relative">
            {/* Timeline Header */}
            <div style={{ width: timelineWidth, height: headerHeight }} className="flex flex-col border-b border-slate-200 sticky top-0 bg-white z-20">
              {/* Months Row */}
              <div className="flex h-1/2 border-b border-slate-100">
                {months.map((month, i) => {
                  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
                  return (
                    <div 
                      key={i} 
                      style={{ width: daysInMonth * dayWidth }} 
                      className="border-r border-slate-100 flex items-center px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {month.toLocaleDateString('en-GB', { month: 'long' })}
                    </div>
                  );
                })}
              </div>
              {/* Days Row */}
              <div className="flex h-1/2">
                {Array.from({ length: totalDays }).map((_, i) => {
                  const date = new Date(months[0]);
                  date.setDate(date.getDate() + i);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div 
                      key={i} 
                      style={{ width: dayWidth }} 
                      className={cn(
                        "border-r border-slate-50 flex items-center justify-center text-[8px] font-medium",
                        isWeekend ? "bg-slate-50 text-slate-300" : "text-slate-400"
                      )}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Content */}
            <div style={{ width: timelineWidth }} className="relative">
              {/* Grid Background */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: totalDays }).map((_, i) => {
                  const date = new Date(months[0]);
                  date.setDate(date.getDate() + i);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div 
                      key={i} 
                      style={{ width: dayWidth }} 
                      className={cn(
                        "h-full border-r border-slate-50",
                        isWeekend && "bg-slate-50/50"
                      )}
                    />
                  );
                })}
              </div>

              {/* Today Line */}
              {todayPos >= 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                  style={{ left: todayPos }}
                >
                  <div className="absolute top-0 -translate-x-1/2 w-2 h-2 rounded-full bg-red-400" />
                </div>
              )}

              {/* Task Bars */}
              <div className="relative z-0">
                {filteredTasks.map((task, i) => {
                  const left = getPos(task.start);
                  const width = getWidth(task.start, task.end);
                  const cat = categories.find(c => c.id === task.category) || categories[0];
                  
                  return (
                    <div 
                      key={task.id} 
                      style={{ height: rowHeight, top: i * rowHeight }} 
                      className="absolute w-full flex items-center px-2 group"
                    >
                      <motion.div
                        layoutId={`task-${task.id}`}
                        className={cn(
                          "h-7 rounded-lg relative overflow-hidden shadow-sm cursor-pointer hover:scale-[1.02] transition-transform border border-white/20",
                          cat.color.replace('bg-', 'bg-opacity-30 bg-')
                        )}
                        style={{ left, width }}
                        onClick={() => setEditingTask(task)}
                      >
                        {/* Progress Bar */}
                        <div 
                          className={cn("absolute inset-y-0 left-0 transition-all duration-500", getDeadlineBg(task.end))}
                          style={{ width: `${task.progress}%` }}
                        />
                        {/* Task Label (if wide enough) */}
                        {width > 60 && (
                          <div className="absolute inset-0 flex items-center px-3 gap-2 truncate">
                            {task.isCore && <Target size={10} className="text-white shrink-0" />}
                            <span className="text-[10px] font-bold text-white drop-shadow-sm truncate">
                              {task.name}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  );
                })}
                {/* Spacer to ensure height */}
                <div style={{ height: filteredTasks.length * rowHeight }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">{isAdding ? 'Add Task' : 'Edit Task'}</h3>
                <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Task Name</label>
                  <input 
                    type="text" 
                    value={editingTask.name || ''}
                    onChange={(e) => setEditingTask({...editingTask, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={editingTask.start || ''}
                      onChange={(e) => setEditingTask({...editingTask, start: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                    <input 
                      type="date" 
                      value={editingTask.end || ''}
                      onChange={(e) => setEditingTask({...editingTask, end: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <select 
                    value={editingTask.category || ''}
                    onChange={(e) => setEditingTask({...editingTask, category: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none mb-4"
                  >
                    {categories.filter(c => c.id !== 'All' && c.id !== 'Core').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={editingTask.isCore || false}
                        onChange={(e) => setEditingTask({...editingTask, isCore: e.target.checked})}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-10 h-6 rounded-full transition-colors",
                        editingTask.isCore ? "bg-brand-orange" : "bg-slate-200"
                      )} />
                      <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                        editingTask.isCore ? "translate-x-4" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-brand-orange transition-colors">Mark as Core (High Priority)</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date Created</label>
                    <input 
                      type="text" 
                      value={editingTask.createdAt || ''}
                      onChange={(e) => setEditingTask({...editingTask, createdAt: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Owner</label>
                    <input 
                      type="text" 
                      value={editingTask.owner}
                      onChange={(e) => setEditingTask({...editingTask, owner: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Status</label>
                    <select 
                      value={editingTask.progress === 0 ? 'To Do' : editingTask.progress === 100 ? 'Completed' : 'In Progress'}
                      onChange={(e) => {
                        const val = e.target.value;
                        let progress = 0;
                        if (val === 'In Progress') progress = 50;
                        if (val === 'Completed') progress = 100;
                        setEditingTask({...editingTask, progress});
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Progress (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={editingTask.progress}
                      onChange={(e) => setEditingTask({...editingTask, progress: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3">
                <button 
                  onClick={() => setTaskToDelete(editingTask.id)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setEditingTask(null)}
                    disabled={isSaving}
                    className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleSaveTask(editingTask)}
                    disabled={isSaving}
                    className="px-6 py-2 rounded-xl text-sm font-bold bg-brand-orange text-white shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check size={18} />
                    )}
                    {isAdding ? 'Add Task' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => !isSaving && setTaskToDelete(null)}
        onConfirm={() => {
          console.log('GanttChart: ConfirmationModal onConfirm triggered for task:', taskToDelete);
          if (taskToDelete) handleDeleteTask(taskToDelete);
        }}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText={isSaving ? "Deleting..." : "Yes, Delete Task"}
        variant="danger"
      />
    </div>
  );
};
