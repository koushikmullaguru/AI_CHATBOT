import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Edit2, Bell, Check, Clock, BookOpen, AlertCircle, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Task {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  reminderDate: string;
  reminderTime: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

interface PreparationPlannerProps {
  userType: 'student' | 'teacher' | 'parent';
  onClose: () => void;
  isDark: boolean;
  plannerTasks: Task[];
  setPlannerTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const subjects = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Art',
  'Physical Education',
  'Music'
];

export function PreparationPlanner({ userType, onClose, isDark, plannerTasks, setPlannerTasks }: PreparationPlannerProps) {
  const [tasks, setTasks] = useState<Task[]>(plannerTasks);
  
  // Sync with parent component
  useEffect(() => {
    setTasks(plannerTasks);
  }, [plannerTasks]);

  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'createdAt'>>({
    subject: subjects[0],
    title: '',
    description: '',
    dueDate: '',
    reminderDate: '',
    reminderTime: '09:00',
    priority: 'medium',
    status: 'pending'
  });

  const handleAddTask = () => {
    if (!newTask.title || !newTask.dueDate) {
      alert('Please fill in task title and due date');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTasks([...tasks, task]);
    setPlannerTasks([...tasks, task]);
    setShowAddTask(false);
    setNewTask({
      subject: subjects[0],
      title: '',
      description: '',
      dueDate: '',
      reminderDate: '',
      reminderTime: '09:00',
      priority: 'medium',
      status: 'pending'
    });
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;

    setTasks(tasks.map(t => t.id === editingTask.id ? editingTask : t));
    setPlannerTasks(tasks.map(t => t.id === editingTask.id ? editingTask : t));
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(t => t.id !== id));
      setPlannerTasks(tasks.filter(t => t.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        if (t.status === 'pending') return { ...t, status: 'in-progress' };
        if (t.status === 'in-progress') return { ...t, status: 'completed' };
        return { ...t, status: 'pending' };
      }
      return t;
    }));
    setPlannerTasks(tasks.map(t => {
      if (t.id === id) {
        if (t.status === 'pending') return { ...t, status: 'in-progress' };
        if (t.status === 'in-progress') return { ...t, status: 'completed' };
        return { ...t, status: 'pending' };
      }
      return t;
    }));
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSubject = filterSubject === 'all' || task.subject === filterSubject;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesStatus && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'in-progress': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'pending': return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredTasks.filter(task => task.dueDate === dateStr);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const upcomingTasks = filteredTasks
    .filter(task => {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7 && task.status !== 'completed';
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const overdueTasksCount = filteredTasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate < today && task.status !== 'completed';
  }).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-7xl h-[90vh] ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl flex flex-col`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Preparation Planner
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Plan your study schedule with tasks and reminders
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Close
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-blue-600'}`}>Total Tasks</div>
              <div className={`text-2xl ${isDark ? 'text-white' : 'text-blue-900'}`}>{tasks.length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-yellow-50'}`}>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-yellow-600'}`}>In Progress</div>
              <div className={`text-2xl ${isDark ? 'text-white' : 'text-yellow-900'}`}>
                {tasks.filter(t => t.status === 'in-progress').length}
              </div>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-green-50'}`}>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-green-600'}`}>Completed</div>
              <div className={`text-2xl ${isDark ? 'text-white' : 'text-green-900'}`}>
                {tasks.filter(t => t.status === 'completed').length}
              </div>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-red-50'}`}>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-red-600'}`}>Overdue</div>
              <div className={`text-2xl ${isDark ? 'text-white' : 'text-red-900'}`}>{overdueTasksCount}</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex flex-wrap items-center gap-4`}>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-purple-500 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'calendar' ? 'bg-purple-500 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              Calendar View
            </button>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-transparent outline-none ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
            />
          </div>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tasks List */}
              <div className="lg:col-span-2 space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl mb-2">No tasks found</p>
                    <p className="text-sm">Add your first task to get started!</p>
                  </div>
                ) : (
                  filteredTasks.map(task => {
                    const dueDate = new Date(task.dueDate);
                    const isOverdue = isPastDate(dueDate) && task.status !== 'completed';
                    const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border-2 ${
                          task.status === 'completed'
                            ? isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                            : isOverdue
                            ? 'border-red-300 bg-red-50 dark:bg-red-900/10'
                            : isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => handleToggleStatus(task.id)}
                            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              task.status === 'completed'
                                ? 'bg-green-500 border-green-500'
                                : isDark ? 'border-gray-500' : 'border-gray-300'
                            }`}
                          >
                            {task.status === 'completed' && <Check className="w-4 h-4 text-white" />}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className={`text-lg ${task.status === 'completed' ? 'line-through opacity-60' : ''} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {task.title}
                                </h3>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {task.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                <BookOpen className="w-3 h-3 inline mr-1" />
                                {task.subject}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs ${getStatusColor(task.status)}`}>
                                {task.status.replace('-', ' ').toUpperCase()}
                              </span>
                            </div>

                            <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                {daysUntilDue >= 0 && daysUntilDue <= 7 && task.status !== 'completed' && (
                                  <span className="text-xs text-orange-600 dark:text-orange-400">
                                    ({daysUntilDue} days)
                                  </span>
                                )}
                              </div>
                              {task.reminderDate && (
                                <div className="flex items-center gap-1">
                                  <Bell className="w-4 h-4" />
                                  <span>Reminder: {new Date(task.reminderDate).toLocaleDateString()} at {task.reminderTime}</span>
                                </div>
                              )}
                            </div>

                            {isOverdue && (
                              <div className="mt-2 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>Overdue!</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingTask(task)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} text-red-600`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Upcoming Tasks Sidebar */}
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
                  <h3 className={`text-lg mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Clock className="w-5 h-5" />
                    Upcoming This Week
                  </h3>
                  {upcomingTasks.length === 0 ? (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No upcoming tasks</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingTasks.map(task => (
                        <div key={task.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                          <div className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {task.subject} • {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                          <div className={`mt-2 text-xs px-2 py-1 rounded inline-block ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Calendar View */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} py-2`}>
                    {day}
                  </div>
                ))}
                
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-32" />;
                  }

                  const tasksForDate = getTasksForDate(date);
                  const isTodayDate = isToday(date);

                  return (
                    <div
                      key={index}
                      className={`h-32 p-2 rounded-lg border-2 ${
                        isTodayDate
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className={`text-sm mb-1 ${isTodayDate ? 'text-purple-600 dark:text-purple-400' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1 overflow-y-auto max-h-20">
                        {tasksForDate.map(task => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded truncate ${
                              task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                              task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                              'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            }`}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6`}>
            <h3 className={`text-2xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Add New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subject</label>
                <select
                  value={newTask.subject}
                  onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Due Date *</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reminder Date</label>
                  <input
                    type="date"
                    value={newTask.reminderDate}
                    onChange={(e) => setNewTask({ ...newTask, reminderDate: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reminder Time</label>
                  <input
                    type="time"
                    value={newTask.reminderTime}
                    onChange={(e) => setNewTask({ ...newTask, reminderTime: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleAddTask}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Add Task
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                className={`flex-1 py-3 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6`}>
            <h3 className={`text-2xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subject</label>
                <select
                  value={editingTask.subject}
                  onChange={(e) => setEditingTask({ ...editingTask, subject: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Task Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                />
              </div>

              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Due Date</label>
                  <input
                    type="date"
                    value={editingTask.dueDate}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reminder Date</label>
                  <input
                    type="date"
                    value={editingTask.reminderDate}
                    onChange={(e) => setEditingTask({ ...editingTask, reminderDate: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reminder Time</label>
                  <input
                    type="time"
                    value={editingTask.reminderTime}
                    onChange={(e) => setEditingTask({ ...editingTask, reminderTime: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as 'pending' | 'in-progress' | 'completed' })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleUpdateTask}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Update Task
              </button>
              <button
                onClick={() => setEditingTask(null)}
                className={`flex-1 py-3 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}