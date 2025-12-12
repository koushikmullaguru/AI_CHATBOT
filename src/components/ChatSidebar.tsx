import { MessageSquarePlus, Menu, X } from 'lucide-react';
import { ChatMode } from '../types';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  currentMode: ChatMode;
}

export function ChatSidebar({ isOpen, onToggle, onNewChat }: ChatSidebarProps) {
  const recentChats = [
    { id: '1', title: 'Algebra Practice Problems', mode: 'worksheet', date: 'Today' },
    { id: '2', title: 'World War II History', mode: 'qa', date: 'Yesterday' },
    { id: '3', title: 'Chemistry Quiz Prep', mode: 'quiz', date: '2 days ago' },
    { id: '4', title: 'English Literature Essay', mode: 'homework', date: '3 days ago' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-30 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isOpen ? 'w-72' : 'w-0 lg:w-16'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isOpen ? <X className="w-5 h-5 dark:text-white" /> : <Menu className="w-5 h-5 dark:text-white" />}
            </button>
          </div>

          {isOpen && (
            <>
              {/* New Chat Button */}
              <div className="p-4">
                <button
                  onClick={onNewChat}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                  <span>New Chat</span>
                </button>
              </div>

              {/* Recent Chats */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 px-2">
                  Recent Chats
                </h3>
                <div className="space-y-2">
                  {recentChats.map((chat) => (
                    <button
                      key={chat.id}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="text-sm mb-1 line-clamp-1 dark:text-white">
                        {chat.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{chat.mode}</span>
                        <span>•</span>
                        <span>{chat.date}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}