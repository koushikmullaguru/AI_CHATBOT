// // // import { Message } from '../types';
// // // import { Bot, User, Sparkles } from 'lucide-react';
// // // import ReactMarkdown from 'react-markdown';
// // // import remarkGfm from 'remark-gfm';

// // // // ADDITIONS FOR LATEX/FORMULA SUPPORT
// // // import remarkMath from 'remark-math';
// // // import rehypeKatex from 'rehype-katex';

// // // interface ChatMessagesProps {
// // //   messages: Message[];
// // //   onSuggestedQuestionClick: (question: string) => void;
// // // }

// // // export function ChatMessages({ messages, onSuggestedQuestionClick }: ChatMessagesProps) {
// // //   if (messages.length === 0) {
// // //     return (
// // //       <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
// // //         <div className="text-center">
// // //           <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
// // //           <p>Start a conversation by sending a message</p>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-8 space-y-6 overflow-y-auto">
// // //       {messages.map((message) => (
// // //         <div key={message.id}>
// // //           <div
// // //             className={`flex gap-4 ${
// // //               message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
// // //             }`}
// // //           >
// // //             {/* Avatar */}
// // //             <div
// // //               className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
// // //                 message.sender === 'user'
// // //                   ? 'bg-indigo-500'
// // //                   : 'bg-gradient-to-br from-purple-500 to-pink-500'
// // //               }`}
// // //             >
// // //               {message.sender === 'user' ? (
// // //                 <User className="w-5 h-5 text-white" />
// // //               ) : (
// // //                 <Bot className="w-5 h-5 text-white" />
// // //               )}
// // //             </div>

// // //             {/* Message Content */}
// // //             <div
// // //               className={`flex-1 ${
// // //                 message.sender === 'user' ? 'text-right' : 'text-left'
// // //               }`}
// // //             >
// // //               <div
// // //                 className={`inline-block max-w-full px-5 py-3 rounded-2xl ${
// // //                   message.sender === 'user'
// // //                     ? 'bg-indigo-500 text-white'
// // //                     : 'bg-white dark:bg-gray-800 shadow-md dark:text-white'
// // //                 }`}
// // //               >
// // //                 <div 
// // //                     className={`
// // //                         prose dark:prose-invert 
// // //                         max-w-none break-words
// // //                         ${message.sender === 'ai' ? 'text-left' : 'text-white'}
// // //                     `}
// // //                 >
// // //                     <ReactMarkdown 
// // //                         // ADDED remarkMath for parsing $...$ and $$...$$
// // //                         remarkPlugins={[remarkGfm, remarkMath]} 
// // //                         // ADDED rehypeKatex for rendering the math as HTML
// // //                         rehypePlugins={[rehypeKatex]}
// // //                     >
// // //                         {message.content}
// // //                     </ReactMarkdown>
// // //                 </div>
// // //               </div>

// // //               {/* Suggested Questions & Citations */}
// // //               {/* UPDATED: Only check for suggested questions or cache status. Sources check is removed. */}
// // //               {message.sender === 'ai' && (message.suggestedQuestions?.length || message.cacheStatus) && (
// // //                 <div className="mt-2 text-left">
// // //                   {/* Cache Status Badge */}
// // //                   {message.cacheStatus && (
// // //                     <span className={`text-xs px-2 py-1 rounded-full inline-block mb-2 mr-2 ${
// // //                         message.cacheStatus === 'HIT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
// // //                         message.cacheStatus === 'MISS' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
// // //                         'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
// // //                     }`}>
// // //                         Cache: {message.cacheStatus}
// // //                     </span>
// // //                   )}

// // //                   {/* Sources (Citations) - REMOVED TO HIDE FROM FRONTEND */}
// // //                   {/* The block below was removed:
// // //                   {message.sources && message.sources.length > 0 && (
// // //                     <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
// // //                         <strong>Source(s):</strong>
// // //                         <div className="mt-1 space-y-1">
// // //                             {message.sources.map((source, idx) => (
// // //                                 <span key={idx} className="block truncate">
// // //                                     <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
// // //                                         {source.split('/').pop()}
// // //                                     </span>
// // //                                 </span>
// // //                             ))}
// // //                         </div>
// // //                     </div>
// // //                   )}
// // //                   */}

// // //                   {/* Suggested Questions - KEPT */}
// // //                   {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
// // //                     <>
// // //                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Suggested questions:</p>
// // //                         <div className="flex flex-wrap gap-2">
// // //                             {message.suggestedQuestions.map((question, index) => (
// // //                             <button
// // //                                 key={index}
// // //                                 onClick={() => onSuggestedQuestionClick(question)}
// // //                                 className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-left dark:text-white"
// // //                             >
// // //                                 {question}
// // //                             </button>
// // //                             ))}
// // //                         </div>
// // //                     </>
// // //                   )}
// // //                 </div>
// // //               )}
              
// // //               {/* Timestamp */}
// // //               <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
// // //                 {new Date(message.timestamp).toLocaleTimeString([], {
// // //                   hour: '2-digit',
// // //                   minute: '2-digit',
// // //                 })}
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       ))}
// // //     </div>
// // //   );
// // // }

// // import { Message } from '../types';
// // import { Bot, User, Sparkles } from 'lucide-react';
// // import ReactMarkdown from 'react-markdown';
// // import remarkGfm from 'remark-gfm';

// // import remarkMath from 'remark-math';
// // import rehypeKatex from 'rehype-katex';

// // interface ChatMessagesProps {
// //   messages: Message[];
// //   onSuggestedQuestionClick: (question: string) => void;
// // }

// // export function ChatMessages({ messages, onSuggestedQuestionClick }: ChatMessagesProps) {
// //   if (messages.length === 0) {
// //     return (
// //       <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
// //         <div className="text-center">
// //           <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
// //           <p>Start a conversation by sending a message</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-8 space-y-6 overflow-y-auto">
// //       {messages.map((message) => (
// //         <div key={message.id}>
// //           <div
// //             className={`flex gap-4 ${
// //               message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
// //             }`}
// //           >
// //             <div
// //               className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
// //                 message.sender === 'user'
// //                   ? 'bg-indigo-500'
// //                   : 'bg-gradient-to-br from-purple-500 to-pink-500'
// //               }`}
// //             >
// //               {message.sender === 'user' ? (
// //                 <User className="w-5 h-5 text-white" />
// //               ) : (
// //                 <Bot className="w-5 h-5 text-white" />
// //               )}
// //             </div>
// //             <div
// //               className={`flex-1 ${
// //                 message.sender === 'user' ? 'text-right' : 'text-left'
// //               }`}
// //             >
// //               <div
// //                 className={`inline-block max-w-full px-5 py-3 rounded-2xl ${
// //                   message.sender === 'user'
// //                     ? 'bg-indigo-500 text-white'
// //                     : 'bg-white dark:bg-gray-800 shadow-md dark:text-white'
// //                 }`}
// //               >
// //                 <div 
// //                     className={`
// //                         prose dark:prose-invert 
// //                         max-w-none break-words
// //                         ${message.sender === 'ai' ? 'text-left' : 'text-white'}
// //                     `}
// //                 >
// //                     <ReactMarkdown 
// //                         // ADDED remarkMath for parsing $...$ and $$...$$
// //                         remarkPlugins={[remarkGfm, remarkMath]} 
// //                         // ADDED rehypeKatex for rendering the math as HTML
// //                         rehypePlugins={[rehypeKatex]}
// //                     >
// //                         {message.content}
// //                     </ReactMarkdown>
// //                 </div>
// //               </div>


// //               {message.sender === 'ai' && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
// //                 <div className="mt-2 text-left">
// //                   <>
// //                       <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Suggested questions:</p>
// //                       <div className="flex flex-wrap gap-2">
// //                           {/* CHANGE 2: Use traditional check instead of message.suggestedQuestions?.map */}
// //                           {message.suggestedQuestions.map((question, index) => (
// //                           <button
// //                               key={index}
// //                               onClick={() => onSuggestedQuestionClick(question)}
// //                               className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-left dark:text-white"
// //                           >
// //                               {question}
// //                           </button>
// //                           ))}
// //                       </div>
// //                   </>
// //                 </div>
// //               )}
              
// //               {/* Timestamp */}
// //               <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
// //                 {new Date(message.timestamp).toLocaleTimeString([], {
// //                   hour: '2-digit',
// //                   minute: '2-digit',
// //                 })}
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       ))}
// //     </div>
// //   );
// // }

// import { Message } from '../types';
// import { Bot, User, Sparkles } from 'lucide-react';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';

// // ADDITIONS FOR LATEX/FORMULA SUPPORT
// import remarkMath from 'remark-math';
// import rehypeKatex from 'rehype-katex';

// interface ChatMessagesProps {
//   messages: Message[];
//   onSuggestedQuestionClick: (question: string) => void;
// }

// export function ChatMessages({ messages, onSuggestedQuestionClick }: ChatMessagesProps) {
//   if (messages.length === 0) {
//     return (
//       <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
//         <div className="text-center">
//           <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
//           <p>Start a conversation by sending a message</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-8 space-y-6 overflow-y-auto">
//       {messages.map((message) => (
//         <div key={message.id}>
//           <div
//             className={`flex gap-4 ${
//               message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
//             }`}
//           >
//             {/* Avatar */}
//             <div
//               className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
//                 message.sender === 'user'
//                   ? 'bg-indigo-500'
//                   : 'bg-gradient-to-br from-purple-500 to-pink-500'
//               }`}
//             >
//               {message.sender === 'user' ? (
//                 <User className="w-5 h-5 text-white" />
//               ) : (
//                 <Bot className="w-5 h-5 text-white" />
//               )}
//             </div>

//             {/* Message Content */}
//             <div
//               className={`flex-1 ${
//                 message.sender === 'user' ? 'text-right' : 'text-left'
//               }`}
//             >
//               <div
//                 className={`inline-block max-w-full px-5 py-3 rounded-2xl ${
//                   message.sender === 'user'
//                     ? 'bg-indigo-500 text-white'
//                     : 'bg-white dark:bg-gray-800 shadow-md dark:text-white'
//                 }`}
//               >
//                 <div 
//                     className={`
//                         prose dark:prose-invert 
//                         max-w-none break-words
//                         ${message.sender === 'ai' ? 'text-left' : 'text-white'}
//                     `}
//                 >
//                     <ReactMarkdown 
//                         // ADDED remarkMath for parsing $...$ and $$...$$
//                         remarkPlugins={[remarkGfm, remarkMath]} 
//                         // ADDED rehypeKatex for rendering the math as HTML
//                         rehypePlugins={[rehypeKatex]}
//                     >
//                         {message.content}
//                     </ReactMarkdown>
//                 </div>
//               </div>

//               {/* Suggested Questions only */}
//               {/* CHANGE 1: Use traditional check instead of message.suggestedQuestions?.length */}
//               {message.sender === 'ai' && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
//                 <div className="mt-2 text-left">
                  
//                   {/* Suggested Questions - KEPT */}
//                   <>
//                       <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Suggested questions:</p>
//                       <div className="flex flex-wrap gap-2">
//                           {/* CHANGE 2: Use traditional check instead of message.suggestedQuestions?.map */}
//                           {message.suggestedQuestions.map((question, index) => (
//                           <button
//                               key={index}
//                               onClick={() => onSuggestedQuestionClick(question)}
//                               className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-left dark:text-white"
//                           >
//                               {question}
//                           </button>
//                           ))}
//                       </div>
//                   </>
//                 </div>
//               )}
              
//               {/* Timestamp */}
//               <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
//                 {new Date(message.timestamp).toLocaleTimeString([], {
//                   hour: '2-digit',
//                   minute: '2-digit',
//                 })}
//               </div>
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

import { Message } from '../types';
import { Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// FIX 1: Import React hooks for scroll management
import { useRef, useEffect } from 'react'; 

// ADDITIONS FOR LATEX/FORMULA SUPPORT
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ChatMessagesProps {
  messages: Message[];
  onSuggestedQuestionClick: (question: string) => void;
}

export function ChatMessages({ messages, onSuggestedQuestionClick }: ChatMessagesProps) {
  
  // FIX 2: Create a reference for the chat container
  const messagesEndRef = useRef<HTMLDivElement>(null); 

  // FIX 3: Effect to scroll to the bottom whenever the messages array updates
  useEffect(() => {
    if (messagesEndRef.current) {
      // Set the scroll position to the bottom of the container
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]); // Dependency array ensures scroll runs on every new message

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
    // FIX 4: Attach the ref to the main scrollable container
    <div 
        className="flex flex-col h-full max-w-4xl mx-auto px-6 py-8 space-y-6 overflow-y-auto"
        ref={messagesEndRef} // ATTACHED REF HERE
    >
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
                className={`inline-block max-w-full px-5 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white dark:bg-gray-800 shadow-md dark:text-white'
                }`}
              >
                <div 
                    className={`
                        prose prose-lg dark:prose-invert 
                        max-w-none break-words
                        ${message.sender === 'ai' ? 'text-left' : 'text-white'}
                    `}
                >
                    <ReactMarkdown 
                        // ADDED remarkMath for parsing $...$ and $$...$$
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        // ADDED rehypeKatex for rendering the math as HTML
                        rehypePlugins={[rehypeKatex]}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>
              </div>

              {/* Suggested Questions only */}
              {message.sender === 'ai' && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                <div className="mt-2 text-left">
                  
                  {/* Suggested Questions */}
                  <>
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
                  </>
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