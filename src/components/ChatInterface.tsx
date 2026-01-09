// import { useState, useRef, useEffect } from 'react';
// import { Send, Paperclip, Mic, Search, Menu, X, Moon, Sun, ChevronLeft, Home, User as UserIcon, GraduationCap, BarChart3 } from 'lucide-react';
// import { ModeSelector } from './ModeSelector';
// import { ExamSetup } from './ExamSetup';
// import { HomeworkSetup } from './HomeworkSetup';
// import { RevisionSetup } from './RevisionSetup';
// import { AssessmentSetup, AssessmentConfig } from './AssessmentSetup';
// import { AssessmentMode } from './AssessmentMode';
// import { TeacherModeSelector } from './TeacherModeSelector';
// import { ParentDashboard } from './ParentDashboard';
// import { TeacherClassSelector, ClassConfig } from './TeacherClassSelector';
// import { ContentCreation } from './ContentCreation';
// import { CurriculumPlanner } from './CurriculumPlanner';
// import { WorksheetCreator } from './WorksheetCreator';
// import { TeacherExamCreator } from './TeacherExamCreator';
// import { TeacherInsights } from './TeacherInsights';
// import { ChatSidebar } from './ChatSidebar';
// import { ChatHeader } from './ChatHeader';
// import { ChatMessages } from './ChatMessages';
// import { ChatInput } from './ChatInput';
// import { DiscussionMode } from './DiscussionMode';
// import { QuizMode } from './QuizMode';
// import { ExamMode } from './ExamMode';
// import { StudentProfileScreen } from './StudentProfileScreen';
// import { PreparationPlanner } from './PreparationPlanner';
// import { PlannerMode } from './PlannerMode';
// import { User, StudentProfile, Message, ChatMode, Theme, TeacherMode, ExamConfig, HomeworkTopic, RevisionTopic } from '../types';

// interface ChatInterfaceProps {
//   user: User;
//   selectedProfile: StudentProfile | null;
//   onSwitchProfile?: () => void;
//   onLogout: () => void;
//   theme: Theme;
//   onToggleTheme: () => void;
// }

// export function ChatInterface({ user, selectedProfile, onSwitchProfile, onLogout, theme, onToggleTheme }: ChatInterfaceProps) {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [currentMode, setCurrentMode] = useState<ChatMode>('qa');
//   const [showModeSetup, setShowModeSetup] = useState(false);
//   const [classConfig, setClassConfig] = useState<ClassConfig | null>(null);
//   const [showClassSelector, setShowClassSelector] = useState(false);
//   const [showInsights, setShowInsights] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
//   const [revisionTopic, setRevisionTopic] = useState<RevisionTopic | null>(null);
//   const [homeworkTopic, setHomeworkTopic] = useState<HomeworkTopic | null>(null);
//   const [assessmentConfig, setAssessmentConfig] = useState<AssessmentConfig | null>(null);
//   const [showProfileScreen, setShowProfileScreen] = useState(false);
//   const [showPreparationPlanner, setShowPreparationPlanner] = useState(false);
//   
//   // Planner tasks state - shared between PlannerMode and PreparationPlanner
//   const [plannerTasks, setPlannerTasks] = useState<Array<{
//     id: string;
//     subject: string;
//     title: string;
//     description: string;
//     dueDate: string;
//     reminderDate: string;
//     reminderTime: string;
//     priority: 'low' | 'medium' | 'high';
//     status: 'pending' | 'in-progress' | 'completed';
//     createdAt: string;
//   }>>([
//     {
//       id: '1',
//       subject: 'Mathematics',
//       title: 'Complete Algebra Assignment',
//       description: 'Solve problems 1-20 from Chapter 5',
//       dueDate: '2025-12-15',
//       reminderDate: '2025-12-14',
//       reminderTime: '09:00',
//       priority: 'high',
//       status: 'in-progress',
//       createdAt: '2025-12-10'
//     },
//     {
//       id: '2',
//       subject: 'Science',
//       title: 'Prepare for Biology Test',
//       description: 'Review chapters 1-3, focus on cell structure',
//       dueDate: '2025-12-18',
//       reminderDate: '2025-12-16',
//       reminderTime: '18:00',
//       priority: 'high',
//       status: 'pending',
//       createdAt: '2025-12-11'
//     },
//     {
//       id: '3',
//       subject: 'English',
//       title: 'Read Novel Chapters',
//       description: 'Read chapters 5-8 of assigned novel',
//       dueDate: '2025-12-20',
//       reminderDate: '2025-12-19',
//       reminderTime: '15:00',
//       priority: 'medium',
//       status: 'pending',
//       createdAt: '2025-12-11'
//     }
//   ]);
//   
//   // Teacher-specific state
//   const [teacherMode, setTeacherMode] = useState<TeacherMode | null>(null);
//   const [showTeacherModes, setShowTeacherModes] = useState(user.userType === 'teacher');
//   
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   // This useEffect correctly handles auto-scroll now that the ChatMessages component is flat.
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // --- BEGIN RAG INTEGRATION ---
//   // Replaced mock generator with API call logic

//   const handleSendMessage = async (content: string) => {
//     if (!content.trim()) return;

//     // Use a unique session ID, user.id is suitable for persistence
//     const sessionId = user.id; 
//     
//     // 1. Add user message
//     const userMessage: Message = {
//       id: Date.now().toString(),
//       content,
//       sender: 'user',
//       timestamp: new Date(),
//     };
//     
//     // Create a placeholder AI message while waiting for the API
//     const placeholderId = (Date.now() + 1).toString();
//     const placeholderMessage: Message = {
//       id: placeholderId,
//       content: 'Thinking...',
//       sender: 'ai',
//       timestamp: new Date(),
//       sources: [],
//       cacheStatus: 'MISS',
//     };

//     setMessages(prev => [...prev, userMessage, placeholderMessage]);
//     setShowModeSetup(false);

//     try {
//       // API call to the FastAPI RAG service
//       const response = await fetch('http://localhost:8501/chat', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           session_id: sessionId,
//           query: content,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`API returned status ${response.status}`);
//       }

//       const data = await response.json();
//       
//       // Construct the final AI message from the API response
//       const aiMessage: Message = {
//         id: placeholderId,
//         content: data.answer || "Sorry, I couldn't generate a response.",
//         sender: 'ai',
//         timestamp: new Date(),
//         sources: data.sources || [],
//         cacheStatus: data.cache_status || 'ERROR',
//         suggestedQuestions: [
//             'Can you explain this concept in simpler terms?',
//             'Where exactly did this information come from?',
//             'Give me a practice problem on this topic.'
//         ],
//       };

//       // Replace the placeholder message with the real one
//       setMessages(prevMessages => 
//         prevMessages.map(msg => 
//           msg.id === placeholderId ? aiMessage : msg
//         )
//       );
//       
//     } catch (error) {
//       console.error("RAG API Call Error:", error);

//       // Replace the placeholder message with an error message
//       const errorMessage: Message = {
//         id: placeholderId,
//         content: "I'm having trouble connecting to the RAG system. Please check the backend service.",
//         sender: 'ai',
//         timestamp: new Date(),
//         sources: [],
//         cacheStatus: 'ERROR',
//       };

//       setMessages(prevMessages => 
//         prevMessages.map(msg => 
//           msg.id === placeholderId ? errorMessage : msg
//         )
//       );
//     }
//   };

//   // Simplified mode change handler for Q&A integration
//   const handleModeChange = (mode: ChatMode) => {
//     setCurrentMode(mode);
//     setShowModeSetup(false);
//     setAssessmentConfig(null);
//     setMessages([]); // Clear chat history on mode change
//     
//     if (mode === 'qa') {
//       // Add a simple welcome message for Q&A mode, since RAG is active
//       const systemMessage: Message = {
//         id: Date.now().toString(),
//         content: `Switched to Q&A Mode. I am connected to the knowledge base for ${user.grade || 'NCERT documents'}. Ask me a question!`,
//         sender: 'ai',
//         timestamp: new Date(),
//         sources: ['NCERT Knowledge Base'], // Placeholder source until an actual RAG query is made
//         cacheStatus: 'MISS',
//         suggestedQuestions: [
//           'What is the law of conservation of energy?',
//           'How does the periodic table organize elements?',
//           'Give me a summary of Chapter 5.'
//         ],
//       };
//       setMessages([systemMessage]);
//     }
//   };

//   // --- END RAG INTEGRATION ---
//   
//   const handleNewChat = () => {
//     setMessages([]);
//     setShowModeSetup(true);
//     setTeacherMode(null);
//     setShowTeacherModes(user.userType === 'teacher');
//     setClassConfig(null);
//     setShowClassSelector(false);
//     setShowInsights(false);
//   };

//   const handleTeacherModeSelect = (mode: TeacherMode) => {
//     setTeacherMode(mode);
//     setShowTeacherModes(false);
//     
//     if (mode === 'student-chat') {
//       setShowModeSetup(true);
//       setShowClassSelector(false);
//       setShowInsights(false);
//     } else if (mode === 'insights') {
//       setShowInsights(true);
//       setShowClassSelector(false);
//     } else {
//       setShowClassSelector(true);
//       setShowInsights(false);
//     }
//   };

//   const handleClassConfigSelect = (config: ClassConfig) => {
//     setClassConfig(config);
//     setShowClassSelector(false);
//   };

//   const handleBackToTeacherDashboard = () => {
//     setTeacherMode(null);
//     setShowClassSelector(false);
//     setClassConfig(null);
//     setShowInsights(false);
//     setShowTeacherModes(true);
//   };

//   const handleExamStart = (config: ExamConfig) => {
//     setExamConfig(config);
//   };

//   const handleRevisionStart = (topic: RevisionTopic) => {
//     setRevisionTopic(topic);
//   };

//   const handleHomeworkStart = (topic: HomeworkTopic) => {
//     setHomeworkTopic(topic);
//   };

//   const handleAssessmentStart = (config: AssessmentConfig) => {
//     setAssessmentConfig(config);
//   };

//   const displayName = selectedProfile ? selectedProfile.name : user.name;
//   const displayGrade = selectedProfile ? selectedProfile.grade : user.grade;

//   // Create a profile object for the profile screen
//   const profileToShow = selectedProfile || (user.userType === 'student' ? {
//     id: user.id,
//     name: user.name,
//     avatar: '👨‍🎓',
//     grade: user.grade || '10th Grade',
//     pin: '0000' // Default pin for the profile
//   } : null);

//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
//       <ChatSidebar
//         isOpen={sidebarOpen}
//         onToggle={() => setSidebarOpen(!sidebarOpen)}
//         onNewChat={handleNewChat}
//         currentMode={currentMode}
//       />

//       <div className="flex-1 flex flex-col">
//         <ChatHeader
//           userName={displayName}
//           userType={user.userType}
//           grade={displayGrade}
//           mode={currentMode}
//           onSwitchProfile={onSwitchProfile}
//           onLogout={onLogout}
//           theme={theme}
//           onToggleTheme={onToggleTheme}
//           onViewProfile={(user.userType === 'student' || user.userType === 'parent') && profileToShow ? () => setShowProfileScreen(true) : undefined}
//           onOpenPlanner={() => setShowPreparationPlanner(true)}
//         />

//         {/* This div correctly sets the main content area (messages + input) to flex-col and take remaining height */}
//         <div className="flex-1 flex flex-col min-h-0">
          
//           {/* CRITICAL LAYOUT FIX: This div is flex-1 and overflow-y-auto, making only the messages area scrollable */}
//           <div className="flex-1 overflow-y-auto">
//             {user.userType === 'teacher' && showTeacherModes ? (
//               <TeacherModeSelector onSelectMode={handleTeacherModeSelect} />
//             ) : user.userType === 'teacher' && showInsights ? (
//               <TeacherInsights
//                 teacherRole={user.teacherRole || 'subject-teacher'}
//                 teacherSubject={user.teacherSubject}
//                 teacherClass={user.teacherClass}
//                 onBack={handleBackToTeacherDashboard}
//               />
//             ) : user.userType === 'teacher' && showClassSelector && teacherMode && teacherMode !== 'student-chat' && teacherMode !== 'insights' ? (
//               <TeacherClassSelector
//                 onSelect={handleClassConfigSelect}
//                 title={
//                   teacherMode === 'content-creation' ? 'Content Creation Setup' :
//                   teacherMode === 'curriculum-planner' ? 'Curriculum Planner Setup' :
//                   teacherMode === 'worksheet-creator' ? 'Worksheet Creator Setup' :
//                   'Exam Creator Setup'
//                 }
//                 description="Select the class and subject to begin"
//                 showSection={teacherMode === 'curriculum-planner' || teacherMode === 'exam-creator'}
//                 showTopics={teacherMode === 'content-creation' || teacherMode === 'exam-creator'}
//               />
//             ) : user.userType === 'teacher' && teacherMode === 'content-creation' && classConfig ? (
//               <ContentCreation classConfig={classConfig} onBack={handleBackToTeacherDashboard} />
//             ) : user.userType === 'teacher' && teacherMode === 'curriculum-planner' && classConfig ? (
//               <CurriculumPlanner classConfig={classConfig} onBack={handleBackToTeacherDashboard} />
//             ) : user.userType === 'teacher' && teacherMode === 'worksheet-creator' && classConfig ? (
//               <WorksheetCreator classConfig={classConfig} onBack={handleBackToTeacherDashboard} />
//             ) : user.userType === 'teacher' && teacherMode === 'exam-creator' && classConfig ? (
//               <TeacherExamCreator classConfig={classConfig} onBack={handleBackToTeacherDashboard} />
//             ) : showModeSetup ? (
//               <ModeSelector
//                 currentMode={currentMode}
//                 onSelectMode={handleModeChange}
//               />
//             ) : currentMode === 'discussion' ? (
//               <DiscussionMode onSendMessage={handleSendMessage} />
//             ) : currentMode === 'quiz' && !assessmentConfig ? (
//               <AssessmentSetup type="quiz" onStartAssessment={handleAssessmentStart} />
//             ) : currentMode === 'quiz' && assessmentConfig ? (
//               <AssessmentMode config={assessmentConfig} onComplete={handleNewChat} />
//             ) : currentMode === 'worksheet' && !assessmentConfig ? (
//               <AssessmentSetup type="worksheet" onStartAssessment={handleAssessmentStart} />
//             ) : currentMode === 'worksheet' && assessmentConfig ? (
//               <AssessmentMode config={assessmentConfig} onComplete={handleNewChat} />
//             ) : currentMode === 'exam' && !examConfig ? (
//               <ExamSetup
//                 onStartExam={handleExamStart}
//                 onAddTask={(task) => {
//                   const newTask = {
//                     ...task,
//                     id: Date.now().toString(),
//                     createdAt: new Date().toISOString().split('T')[0]
//                   };
//                   setPlannerTasks([...plannerTasks, newTask]);
//                 }}
//                 isDark={theme === 'dark'}
//               />
//             ) : currentMode === 'exam' && examConfig ? (
//               <ExamMode config={examConfig} onComplete={handleNewChat} />
//             ) : currentMode === 'revision' && !revisionTopic ? (
//               <RevisionSetup onStartRevision={handleRevisionStart} />
//             ) : currentMode === 'homework' && !homeworkTopic ? (
//               <HomeworkSetup
//                 onStartHomework={handleHomeworkStart}
//                 onAddTask={(task) => {
//                   const newTask = {
//                     ...task,
//                     id: Date.now().toString(),
//                     createdAt: new Date().toISOString().split('T')[0]
//                   };
//                   setPlannerTasks([...plannerTasks, newTask]);
//                 }}
//                 isDark={theme === 'dark'}
//               />
//             ) : currentMode === 'planner' ? (
//               <PlannerMode
//                 onOpenFullPlanner={() => setShowPreparationPlanner(true)}
//                 tasks={plannerTasks}
//                 onAddTask={(task) => {
//                   const newTask = {
//                     ...task,
//                     id: Date.now().toString(),
//                     createdAt: new Date().toISOString().split('T')[0]
//                   };
//                   setPlannerTasks([...plannerTasks, newTask]);
//                 }}
//                 isDark={theme === 'dark'}
//               />
//             ) : (
//               <ChatMessages
//                 messages={messages}
//                 onSuggestedQuestionClick={handleSendMessage}
//               />
//             )}
//             <div ref={messagesEndRef} />
//           </div>
//         </div>

//         {/* ChatInput is correctly outside the scrollable area (fixed position) */}
//         {!showModeSetup && !showTeacherModes && !showClassSelector && !showInsights && currentMode !== 'discussion' && currentMode !== 'quiz' && currentMode !== 'worksheet' && currentMode !== 'exam' && (currentMode !== 'revision' || revisionTopic) && (currentMode !== 'homework' || homeworkTopic) && !teacherMode && (
//           <ChatInput
//             onSendMessage={handleSendMessage}
//             disabled={false}
//             currentMode={currentMode}
//             onChangeModeClick={() => setShowModeSetup(true)}
//           />
//         )}
//       </div>

//       {/* Student Profile Modal */}
//       {showProfileScreen && profileToShow && (
//         <StudentProfileScreen
//           profile={profileToShow}
//           onClose={() => setShowProfileScreen(false)}
//         />
//       )}

//       {/* Preparation Planner Modal */}
//       {showPreparationPlanner && (
//         <PreparationPlanner
//           userType={user.userType}
//           onClose={() => setShowPreparationPlanner(false)}
//           isDark={theme === 'dark'}
//           plannerTasks={plannerTasks}
//           setPlannerTasks={setPlannerTasks}
//         />
//       )}
//     </div>
//   );
// }

// File: koushikmullaguru/ai_chatbot/AI_CHATBOT-Q-A/src/components/ChatInterface.tsx

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Search, Menu, X, Moon, Sun, ChevronLeft, Home, User as UserIcon, GraduationCap, BarChart3 } from 'lucide-react';
import { ModeSelector } from './ModeSelector';
import { ExamSetup } from './ExamSetup';
import { HomeworkSetup } from './HomeworkSetup';
import { RevisionSetup } from './RevisionSetup';
import { AssessmentSetup, AssessmentConfig } from './AssessmentSetup';
import { AssessmentMode } from './AssessmentMode';
import { TeacherModeSelector } from './TeacherModeSelector';
import { ParentDashboard } from './ParentDashboard';
import { TeacherClassSelector, ClassConfig } from './TeacherClassSelector';
import { ContentCreation } from './ContentCreation';
import { CurriculumPlanner } from './CurriculumPlanner';
import { WorksheetCreator } from './WorksheetCreator';
import { TeacherExamCreator } from './TeacherExamCreator';
import { TeacherInsights } from './TeacherInsights';
import { ChatSidebar } from './ChatSidebar';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { DiscussionMode } from './DiscussionMode';
import { QuizMode } from './QuizMode';
import { ExamMode } from './ExamMode';
import { StudentProfileScreen } from './StudentProfileScreen';
import { PreparationPlanner } from './PreparationPlanner';
import { PlannerMode } from './PlannerMode';
import { User, StudentProfile, Message, ChatMode, Theme, TeacherMode, ExamConfig, HomeworkTopic, RevisionTopic } from '../types';

interface ChatInterfaceProps {
  user: User;
  selectedProfile: StudentProfile | null;
  onSwitchProfile?: () => void;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function ChatInterface({ user, selectedProfile, onSwitchProfile, onLogout, theme, onToggleTheme }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<ChatMode>('qa');
  const [showModeSetup, setShowModeSetup] = useState(false);
  const [classConfig, setClassConfig] = useState<ClassConfig | null>(null);
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
  const [revisionTopic, setRevisionTopic] = useState<RevisionTopic | null>(null);
  const [homeworkTopic, setHomeworkTopic] = useState<HomeworkTopic | null>(null);
  const [assessmentConfig, setAssessmentConfig] = useState<AssessmentConfig | null>(null);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [showPreparationPlanner, setShowPreparationPlanner] = useState(false);
  
  // Planner tasks state - shared between PlannerMode and PreparationPlanner
  const [plannerTasks, setPlannerTasks] = useState<Array<{
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
  }>>([
    {
      id: '1',
      subject: 'Mathematics',
      title: 'Complete Algebra Assignment',
      description: 'Solve problems 1-20 from Chapter 5',
      dueDate: '2025-12-15',
      reminderDate: '2025-12-14',
      reminderTime: '09:00',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2025-12-10'
    },
    {
      id: '2',
      subject: 'Science',
      title: 'Prepare for Biology Test',
      description: 'Review chapters 1-3, focus on cell structure',
      dueDate: '2025-12-18',
      reminderDate: '2025-12-16',
      reminderTime: '18:00',
      priority: 'high',
      status: 'pending',
      createdAt: '2025-12-11'
    },
    {
      id: '3',
      subject: 'English',
      title: 'Read Novel Chapters',
      description: 'Read chapters 5-8 of assigned novel',
      dueDate: '2025-12-20',
      reminderDate: '2025-12-19',
      reminderTime: '15:00',
      priority: 'medium',
      status: 'pending',
      createdAt: '2025-12-11'
    }
  ]);
  
  // Teacher-specific state
  const [teacherMode, setTeacherMode] = useState<TeacherMode | null>(null);
  const [showTeacherModes, setShowTeacherModes] = useState(user.userType === 'teacher');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // CRITICAL FIX: Changed scroll behavior to 'auto' to stop the visual jump/flicker
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }); 
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- BEGIN RAG INTEGRATION ---
  // Replaced mock generator with API call logic

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Use a unique session ID, user.id is suitable for persistence
    const sessionId = user.id; 
    
    // 1. Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    // Create a placeholder AI message while waiting for the API
    const placeholderId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: placeholderId,
      content: 'Thinking...',
      sender: 'ai',
      timestamp: new Date(),
      sources: [],
      cacheStatus: 'MISS',
    };

    setMessages(prev => [...prev, userMessage, placeholderMessage]);
    setShowModeSetup(false);

    try {
      // API call to the FastAPI RAG service
      const response = await fetch('http://localhost:8501/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          query: content,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      
// Construct the final AI message from the API response
const aiMessage: Message = {
  id: placeholderId,
  content: data.answer || "Sorry, I couldn't generate a response.",
  sender: 'ai',
  timestamp: new Date(),
  sources: data.sources || [],
  cacheStatus: data.cache_status || 'ERROR',
  suggestedQuestions: data.suggested_questions || [],
};

      // Replace the placeholder message with the real one
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === placeholderId ? aiMessage : msg
        )
      );
      
    } catch (error) {
      console.error("RAG API Call Error:", error);

      // Replace the placeholder message with an error message
      const errorMessage: Message = {
        id: placeholderId,
        content: "I'm having trouble connecting to the RAG system. Please check the backend service.",
        sender: 'ai',
        timestamp: new Date(),
        sources: [],
        cacheStatus: 'ERROR',
      };

      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === placeholderId ? errorMessage : msg
        )
      );
    }
  };

  // Simplified mode change handler for Q&A integration
  const handleModeChange = (mode: ChatMode) => {
    setCurrentMode(mode);
    setShowModeSetup(false);
    setAssessmentConfig(null);
    setMessages([]); // Clear chat history on mode change
    
    if (mode === 'qa') {
      // Add a simple welcome message for Q&A mode, since RAG is active
      const systemMessage: Message = {
        id: Date.now().toString(),
        content: `Switched to Q&A Mode. I am connected to the knowledge base for ${user.grade || 'NCERT documents'}. Ask me a question!`,
        sender: 'ai',
        timestamp: new Date(),
        sources: ['NCERT Knowledge Base'], // Placeholder source until an actual RAG query is made
        cacheStatus: 'MISS',
        suggestedQuestions: [
          'What is the law of conservation of energy?',
          'How does the periodic table organize elements?',
          'Give me a summary of Chapter 5.'
        ],
      };
      setMessages([systemMessage]);
    }
  };

  // --- END RAG INTEGRATION ---
  
  const handleNewChat = () => {
    setMessages([]);
    setShowModeSetup(true);
    setTeacherMode(null);
    setShowTeacherModes(user.userType === 'teacher');
    setClassConfig(null);
    setShowClassSelector(false);
    setShowInsights(false);
  };

  const handleTeacherModeSelect = (mode: TeacherMode) => {
    setTeacherMode(mode);
    setShowTeacherModes(false);
    
    if (mode === 'student-chat') {
      setShowModeSetup(true);
      setShowClassSelector(false);
      setShowInsights(false);
    } else if (mode === 'insights') {
      setShowInsights(true);
      setShowClassSelector(false);
    } else {
      setShowClassSelector(true);
      setShowInsights(false);
    }
  };

  const handleClassConfigSelect = (config: ClassConfig) => {
    setClassConfig(config);
    setShowClassSelector(false);
  };

  const handleBackToTeacherDashboard = () => {
    setTeacherMode(null);
    setShowClassSelector(false);
    setClassConfig(null);
    setShowInsights(false);
    setShowTeacherModes(true);
  };

  const handleExamStart = (config: ExamConfig) => {
    setExamConfig(config);
  };

  const handleRevisionStart = (topic: RevisionTopic) => {
    setRevisionTopic(topic);
  };

  const handleHomeworkStart = (topic: HomeworkTopic) => {
    setHomeworkTopic(topic);
  };

  const handleAssessmentStart = (config: AssessmentConfig) => {
    setAssessmentConfig(config);
  };

  const displayName = selectedProfile ? selectedProfile.name : user.name;
  const displayGrade = selectedProfile ? selectedProfile.grade : user.grade;

  // Create a profile object for the profile screen
  const profileToShow = selectedProfile || (user.userType === 'student' ? {
    id: user.id,
    name: user.name,
    avatar: '👨‍🎓',
    grade: user.grade || '10th Grade',
    pin: '0000' // Default pin for the profile
  } : null);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        currentMode={currentMode}
      />

      {/* Main Content Area: flex-1 takes up remaining width, flex-col stacks children vertically */}
      <div className="flex-1 flex flex-col">
        <ChatHeader
          // This component is flex-shrink-0 (fixed height)
          userName={displayName}
          userType={user.userType}
          grade={displayGrade}
          mode={currentMode}
          onSwitchProfile={onSwitchProfile}
          onLogout={onLogout}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onViewProfile={(user.userType === 'student' || user.userType === 'parent') && profileToShow ? () => setShowProfileScreen(true) : undefined}
          onOpenPlanner={() => setShowPreparationPlanner(true)}
        />

        {/* Messages Wrapper: flex-1 ensures it takes all available height between header and input */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Messages Container: flex-1 and overflow-y-auto enables scrolling ONLY in this area */}
          <div className="flex-1 overflow-y-auto">
            {user.userType === 'teacher' && showTeacherModes ? (
              <TeacherModeSelector onSelectMode={handleTeacherModeSelect} />
            ) : user.userType === 'teacher' && showInsights ? (
              <TeacherInsights
                teacherRole={user.teacherRole || 'subject-teacher'}
                teacherSubject={user.teacherSubject}
                teacherClass={user.teacherClass}
                onBack={handleBackToTeacherDashboard}
              />
            ) : user.userType === 'teacher' && showClassSelector && teacherMode && teacherMode !== 'student-chat' && teacherMode !== 'insights' ? (
              <TeacherClassSelector
                onSelect={handleClassConfigSelect}
                title={
                  teacherMode === 'content-creation' ? 'Content Creation Setup' :
                  teacherMode === 'curriculum-planner' ? 'Curriculum Planner Setup' :
                  teacherMode === 'worksheet-creator' ? 'Worksheet Creator Setup' :
                  'Exam Creator Setup'
                }
                description="Select the class and subject to begin"
                showSection={teacherMode === 'curriculum-planner' || teacherMode === 'exam-creator'}
                showTopics={teacherMode === 'content-creation' || teacherMode === 'exam-creator'}
              />
            ) : user.userType === 'teacher' && teacherMode === 'content-creation' && classConfig ? (
              <ContentCreation classConfig={classConfig} onBack={handleBackToTeacherDashboard} />
            ) : user.userType === 'teacher' && teacherMode === 'curriculum-planner' && classConfig ? (
              <CurriculumPlanner classConfig={classConfig} onBack={handleBackToTeacherDashboard} />
            ) : user.userType === 'teacher' && teacherMode === 'worksheet-creator' && classConfig ? (
              <WorksheetCreator classConfig={classConfig} onBack={handleBackToTeacherDashboard} />
            ) : user.userType === 'teacher' && teacherMode === 'exam-creator' && classConfig ? (
              <TeacherExamCreator classConfig={classConfig} onBack={handleBackToTeacherDashboard} />
            ) : showModeSetup ? (
              <ModeSelector
                currentMode={currentMode}
                onSelectMode={handleModeChange}
              />
            ) : currentMode === 'discussion' ? (
              <DiscussionMode onSendMessage={handleSendMessage} />
            ) : currentMode === 'quiz' && !assessmentConfig ? (
              <AssessmentSetup type="quiz" onStartAssessment={handleAssessmentStart} />
            ) : currentMode === 'quiz' && assessmentConfig ? (
              <AssessmentMode config={assessmentConfig} onComplete={handleNewChat} />
            ) : currentMode === 'worksheet' && !assessmentConfig ? (
              <AssessmentSetup type="worksheet" onStartAssessment={handleAssessmentStart} />
            ) : currentMode === 'worksheet' && assessmentConfig ? (
              <AssessmentMode config={assessmentConfig} onComplete={handleNewChat} />
            ) : currentMode === 'exam' && !examConfig ? (
              <ExamSetup
                onStartExam={handleExamStart}
                onAddTask={(task) => {
                  const newTask = {
                    ...task,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString().split('T')[0]
                  };
                  setPlannerTasks([...plannerTasks, newTask]);
                }}
                isDark={theme === 'dark'}
              />
            ) : currentMode === 'exam' && examConfig ? (
              <ExamMode config={examConfig} onComplete={handleNewChat} />
            ) : currentMode === 'revision' && !revisionTopic ? (
              <RevisionSetup onStartRevision={handleRevisionStart} />
            ) : currentMode === 'homework' && !homeworkTopic ? (
              <HomeworkSetup
                onStartHomework={handleHomeworkStart}
                onAddTask={(task) => {
                  const newTask = {
                    ...task,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString().split('T')[0]
                  };
                  setPlannerTasks([...plannerTasks, newTask]);
                }}
                isDark={theme === 'dark'}
              />
            ) : currentMode === 'planner' ? (
              <PlannerMode
                onOpenFullPlanner={() => setShowPreparationPlanner(true)}
                tasks={plannerTasks}
                onAddTask={(task) => {
                  const newTask = {
                    ...task,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString().split('T')[0]
                  };
                  setPlannerTasks([...plannerTasks, newTask]);
                }}
                isDark={theme === 'dark'}
              />
            ) : (
              <ChatMessages
                messages={messages}
                onSuggestedQuestionClick={handleSendMessage}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ChatInput is correctly outside the scrollable area */}
        {!showModeSetup && !showTeacherModes && !showClassSelector && !showInsights && currentMode !== 'discussion' && currentMode !== 'quiz' && currentMode !== 'worksheet' && currentMode !== 'exam' && (currentMode !== 'revision' || revisionTopic) && (currentMode !== 'homework' || homeworkTopic) && !teacherMode && (
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={false}
            currentMode={currentMode}
            onChangeModeClick={() => setShowModeSetup(true)}
          />
        )}
      </div>

      {/* Student Profile Modal */}
      {showProfileScreen && profileToShow && (
        <StudentProfileScreen
          profile={profileToShow}
          onClose={() => setShowProfileScreen(false)}
        />
      )}

      {/* Preparation Planner Modal */}
      {showPreparationPlanner && (
        <PreparationPlanner
          userType={user.userType}
          onClose={() => setShowPreparationPlanner(false)}
          isDark={theme === 'dark'}
          plannerTasks={plannerTasks}
          setPlannerTasks={setPlannerTasks}
        />
      )}
    </div>
  );
}