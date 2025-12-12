import { useState, useRef, useEffect } from 'react';
import { Send, RefreshCcw } from 'lucide-react';
import { ChatMode } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  currentMode: ChatMode;
  onChangeModeClick: () => void;
}

export function ChatInput({ onSendMessage, disabled, currentMode, onChangeModeClick }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const placeholders: Record<ChatMode, string> = {
    qa: 'Ask a question...',
    exam: 'Ask about exam topics or request practice questions...',
    quiz: 'Ready for a quiz? Ask me anything...',
    worksheet: 'Request a worksheet or ask for help...',
    homework: 'What homework do you need help with?',
    revision: 'What topic would you like to revise?',
    discussion: 'Type your message or use voice input...',
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <button
            type="button"
            onClick={onChangeModeClick}
            className="flex-shrink-0 p-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Change mode"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Select a mode to start chatting...' : placeholders[currentMode]}
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed max-h-40 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="flex-shrink-0 p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}