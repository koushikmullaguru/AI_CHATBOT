import { ChatMode } from '../types';
import { MessageCircle, FileText, Target, ClipboardList, BookOpen, RotateCcw, Mic, Calendar } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: ChatMode;
  onSelectMode: (mode: ChatMode) => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  const modes = [
    {
      mode: 'qa' as ChatMode,
      icon: MessageCircle,
      title: 'Q&A Mode',
      description: 'Ask questions and get detailed explanations',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      mode: 'discussion' as ChatMode,
      icon: Mic,
      title: 'Discussion Mode',
      description: 'Have a natural conversation with voice chat',
      color: 'bg-teal-500',
      hoverColor: 'hover:bg-teal-600',
    },
    {
      mode: 'exam' as ChatMode,
      icon: FileText,
      title: 'Exam Prep',
      description: 'Practice with exam-style questions and answers',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
    {
      mode: 'quiz' as ChatMode,
      icon: Target,
      title: 'Quiz Mode',
      description: 'Test your knowledge with interactive quizzes',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    {
      mode: 'worksheet' as ChatMode,
      icon: ClipboardList,
      title: 'Worksheet',
      description: 'Work through structured practice problems',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
    },
    {
      mode: 'homework' as ChatMode,
      icon: BookOpen,
      title: 'Homework Help',
      description: 'Get assistance with your homework assignments',
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600',
    },
    {
      mode: 'revision' as ChatMode,
      icon: RotateCcw,
      title: 'Revision',
      description: 'Review and reinforce key concepts',
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
    },
    {
      mode: 'planner' as ChatMode,
      icon: Calendar,
      title: 'Planner',
      description: 'Create tasks with reminders and deadlines',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-600 hover:to-pink-600',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl mb-4 dark:text-white">Choose Your Learning Mode</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Select how you'd like to learn today
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modes.map(({ mode, icon: Icon, title, description, color, hoverColor }) => (
          <button
            key={mode}
            onClick={() => onSelectMode(mode)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left group"
          >
            <div className={`${color} ${hoverColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl mb-2 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}