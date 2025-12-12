import { LogOut, RefreshCw, Moon, Sun, User, Calendar } from 'lucide-react';
import { UserType, ChatMode } from '../types';
import { Theme } from '../hooks/useTheme';

interface ChatHeaderProps {
  userName: string;
  userType: UserType;
  grade?: string;
  mode: ChatMode;
  onSwitchProfile?: () => void;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onViewProfile?: () => void;
  onOpenPlanner?: () => void;
}

const modeIcons: Record<ChatMode, string> = {
  qa: '💬',
  exam: '📝',
  quiz: '🎯',
  worksheet: '📄',
  homework: '📚',
  revision: '🔄',
  discussion: '🎙️',
  planner: '📅',
};

const modeColors: Record<ChatMode, string> = {
  qa: 'bg-blue-100 text-blue-700',
  exam: 'bg-purple-100 text-purple-700',
  quiz: 'bg-green-100 text-green-700',
  worksheet: 'bg-orange-100 text-orange-700',
  homework: 'bg-pink-100 text-pink-700',
  revision: 'bg-indigo-100 text-indigo-700',
  discussion: 'bg-teal-100 text-teal-700',
  planner: 'bg-purple-100 text-purple-700',
};

export function ChatHeader({ userName, userType, grade, mode, onSwitchProfile, onLogout, theme, onToggleTheme, onViewProfile, onOpenPlanner }: ChatHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl dark:text-white">
              Welcome, {userName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{userType}</span>
              {grade && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{grade}</span>
                </>
              )}
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className={`text-xs px-2 py-1 rounded-full ${modeColors[mode]}`}>
                {modeIcons[mode]} {mode.toUpperCase()} Mode
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          {onViewProfile && (
            <button
              onClick={onViewProfile}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="View Profile"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          )}
          {onSwitchProfile && (
            <button
              onClick={onSwitchProfile}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Switch Profile</span>
            </button>
          )}
          {onOpenPlanner && (
            <button
              onClick={onOpenPlanner}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Open Planner"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Planner</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}