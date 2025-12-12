import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';

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

interface AddToPlannerButtonProps {
  subject: string;
  topic?: string;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  isDark: boolean;
}

export function AddToPlannerButton({ subject, topic, onAddTask, isDark }: AddToPlannerButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'createdAt'>>({
    subject: subject,
    title: topic ? `Study ${topic}` : '',
    description: topic ? `Review and practice ${topic}` : '',
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
    setShowModal(false);
    setNewTask({
      subject: subject,
      title: topic ? `Study ${topic}` : '',
      description: topic ? `Review and practice ${topic}` : '',
      dueDate: '',
      reminderDate: '',
      reminderTime: '09:00',
      priority: 'medium',
      status: 'pending'
    });
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          isDark 
            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
            : 'bg-purple-500 hover:bg-purple-600 text-white'
        } transition-all shadow-md hover:shadow-lg`}
        title="Add this topic to your planner"
      >
        <Calendar className="w-4 h-4" />
        <span>Add to Planner</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Add to Planner
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Create a task for {subject}{topic && ` - ${topic}`}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Subject (Pre-filled)
                </label>
                <input
                  type="text"
                  value={newTask.subject}
                  disabled
                  className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300'} border-2 cursor-not-allowed`}
                />
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
                  Add to Planner
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 py-4 rounded-xl ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-purple-900/20 border border-purple-700' : 'bg-purple-50 border border-purple-200'}`}>
              <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                💡 <strong>Tip:</strong> This task will be added to your Preparation Planner and you can view it anytime from the Planner button in the header.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
