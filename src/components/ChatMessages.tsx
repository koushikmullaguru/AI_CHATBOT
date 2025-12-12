import { Message } from '../types';
import { Bot, User, Sparkles } from 'lucide-react';

interface ChatMessagesProps {
  messages: Message[];
  onSuggestedQuestionClick: (question: string) => void;
}

export function ChatMessages({ messages, onSuggestedQuestionClick }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Start a conversation by sending a message</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {messages.map((message) => (
        <div key={message.id}>
          <div
            className={`flex gap-4 ${
              message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.sender === 'user'
                  ? 'bg-indigo-500'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}
            >
              {message.sender === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Message Content */}
            <div
              className={`flex-1 ${
                message.sender === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block max-w-3xl px-5 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white dark:bg-gray-800 shadow-md dark:text-white'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>

              {/* Suggested Questions */}
              {message.sender === 'ai' && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => onSuggestedQuestionClick(question)}
                        className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-left dark:text-white"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}