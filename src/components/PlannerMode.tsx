import React, { useState } from 'react';
import { Calendar, Plus, BookOpen, Clock, Bell, ChevronRight, List, Grid } from 'lucide-react';

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

interface PlannerModeProps {
  onOpenFullPlanner: () => void;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  isDark: boolean;
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

export function PlannerMode({ onOpenFullPlanner, tasks, onAddTask, isDark }: PlannerModeProps) {
  const [showAddForm, setShowAddForm] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.dueDate) {
      alert('Please fill in task title and due date');
      return;
    }

    onAddTask(newTask);
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
    setShowAddForm(false);
  };

  const upcomingTasks = tasks
    .filter(task => {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7 && task.status !== 'completed';
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50'} p-8`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-4xl mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Preparation Planner
          </h1>
          <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Plan your study schedule with tasks, reminders, and deadlines
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <List className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{tasks.length}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Tasks</div>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {tasks.filter(t => t.status === 'in-progress').length}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>In Progress</div>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Completed</div>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{upcomingTasks.length}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>This Week</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setShowAddForm(true)}
            className="p-8 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <Plus className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl mb-2">Add New Task</h3>
            <p className="text-purple-100">Create a new task with reminders and deadlines</p>
          </button>

          <button
            onClick={onOpenFullPlanner}
            className={`p-8 rounded-2xl ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-xl hover:shadow-2xl transition-all transform hover:scale-105`}
          >
            <Grid className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <h3 className={`text-2xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>View All Tasks</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Open full planner with calendar and list view
            </p>
          </button>
        </div>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <h3 className={`text-2xl mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Clock className="w-6 h-6 text-purple-600" />
              Upcoming This Week
            </h3>
            <div className="space-y-4">
              {upcomingTasks.map(task => {
                const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className={`text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className={`px-2 py-1 rounded-lg ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                            {task.subject}
                          </span>
                          <span className={`px-2 py-1 rounded-lg ${getPriorityColor(task.priority)}`}>
                            {task.priority.toUpperCase()}
                          </span>
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          <span className="text-orange-600 dark:text-orange-400">
                            ({daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Task Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8`}>
              <h3 className={`text-3xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Create New Task
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Subject *
                  </label>
                  <select
                    value={newTask.subject}
                    onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border-2 focus:border-purple-500 outline-none`}
                    required
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border-2 focus:border-purple-500 outline-none`}
                    placeholder="e.g., Complete Chapter 5 Assignment"
                    required
                  />
                </div>

                <div>
                  <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border-2 focus:border-purple-500 outline-none`}
                    rows={3}
                    placeholder="Add task details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border-2 focus:border-purple-500 outline-none`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                      className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border-2 focus:border-purple-500 outline-none`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Reminder Date
                    </label>
                    <input
                      type="date"
                      value={newTask.reminderDate}
                      onChange={(e) => setNewTask({ ...newTask, reminderDate: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border-2 focus:border-purple-500 outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={newTask.reminderTime}
                      onChange={(e) => setNewTask({ ...newTask, reminderTime: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border-2 focus:border-purple-500 outline-none`}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    Create Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className={`flex-1 py-4 rounded-xl ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
