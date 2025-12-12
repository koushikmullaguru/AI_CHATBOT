import { BookOpen, FileText, Calendar, ClipboardList, MessageSquare, BarChart3 } from 'lucide-react';
import { TeacherMode } from '../types';

export type TeacherMode = 'content-creation' | 'curriculum-planner' | 'worksheet-creator' | 'exam-creator' | 'student-chat';

interface TeacherModeSelectorProps {
  onSelectMode: (mode: TeacherMode) => void;
}

export function TeacherModeSelector({ onSelectMode }: TeacherModeSelectorProps) {
  const teacherModes = [
    {
      id: 'insights' as TeacherMode,
      icon: BarChart3,
      title: 'Performance Insights',
      description: 'View class, section & student analytics',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'content-creation' as TeacherMode,
      icon: BookOpen,
      title: 'Content Creation',
      description: 'Create lesson content',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'curriculum-planner' as TeacherMode,
      icon: Calendar,
      title: 'Curriculum Planner',
      description: 'Plan your curriculum',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'worksheet-creator' as TeacherMode,
      icon: ClipboardList,
      title: 'Worksheet Creator',
      description: 'Generate worksheets',
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'exam-creator' as TeacherMode,
      icon: FileText,
      title: 'Exam Creator',
      description: 'Design exams',
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'student-chat' as TeacherMode,
      icon: MessageSquare,
      title: 'Student Support',
      description: 'Help students',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl mb-3 dark:text-white">Teacher Tools</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Choose your tool
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teacherModes.map(({ id, icon: Icon, title, description, color }) => (
          <button
            key={id}
            onClick={() => onSelectMode(id)}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left group border border-gray-100 dark:border-gray-700"
          >
            <div className={`bg-gradient-to-br ${color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg mb-1 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}