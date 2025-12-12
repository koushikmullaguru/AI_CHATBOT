import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Search, Menu, X, Moon, Sun, ChevronLeft, Home, User, GraduationCap, BarChart3 } from 'lucide-react';
import { ModeSelector } from './ModeSelector';
import { ExamSetup } from './ExamSetup';
import { HomeworkSetup } from './HomeworkSetup';
import { RevisionSetup } from './RevisionSetup';
import { AssessmentSetup, AssessmentConfig } from './AssessmentSetup';
import { AssessmentMode } from './AssessmentMode';
import { TeacherModeSelector } from './TeacherModeSelector';
import { StudentSelector } from './StudentSelector';
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string, mode: ChatMode): { content: string; suggestedQuestions: string[] } => {
    const responses: Record<ChatMode, { content: string; suggestedQuestions: string[] }> = {
      qa: {
        content: `Great question! Let me help you understand this topic better. ${userMessage.includes('?') ? 'Based on your question' : 'Here\'s what you need to know'}: \n\nThe concept involves understanding the fundamental principles and applying them to real-world scenarios. Would you like me to break this down further with examples?`,
        suggestedQuestions: [
          'Can you explain this with a simple example?',
          'What are the key points I should remember?',
          'How does this relate to what we learned before?',
          'Can you give me a practice problem?'
        ]
      },
      exam: {
        content: `Excellent! Let's prepare you for the exam. Here's a comprehensive answer:\n\n1. **Key Concept**: Understanding the main topic\n2. **Important Details**: Related facts and figures\n3. **Application**: How to apply in exam questions\n\nRemember to structure your answers clearly and support them with examples.`,
        suggestedQuestions: [
          'What type of questions might appear in the exam?',
          'How should I structure my answer?',
          'Can you give me more practice questions?',
          'What are the common mistakes to avoid?'
        ]
      },
      quiz: {
        content: `Let's test your knowledge! Here's a quick quiz question:\n\n**Question**: What is the primary function of photosynthesis in plants?\n\nA) To produce oxygen\nB) To convert light energy into chemical energy\nC) To absorb water\nD) To create chlorophyll\n\nTake your time and let me know your answer!`,
        suggestedQuestions: [
          'Can you explain why that\'s the correct answer?',
          'Give me another quiz question',
          'What difficulty level is this question?',
          'Can you make it harder/easier?'
        ]
      },
      worksheet: {
        content: `Here's your worksheet on this topic:\n\n**Exercise 1**: Define the key terms\n**Exercise 2**: Solve the following problems\n**Exercise 3**: Short answer questions\n\nWork through these at your own pace. I'm here if you need help with any question!`,
        suggestedQuestions: [
          'Can you help me with Exercise 1?',
          'I\'m stuck on problem 2, can you give me a hint?',
          'Can you check my answer?',
          'Generate more practice problems'
        ]
      },
      homework: {
        content: `Let's work on your homework together! I can help you:\n\n✓ Understand the concepts\n✓ Break down complex problems\n✓ Check your work\n✓ Provide additional practice\n\nWhat specific homework question do you need help with?`,
        suggestedQuestions: [
          'Can you explain the concept behind this question?',
          'Show me how to solve a similar problem',
          'Is my approach correct?',
          'What resources can I use to learn more?'
        ]
      },
      revision: {
        content: `Great choice to revise! Let's review the key topics:\n\n📚 **Main Concepts**: Core ideas you need to master\n🎯 **Important Points**: Critical facts and formulas\n💡 **Tips**: Study strategies and memory techniques\n\nWhich topic would you like to focus on?`,
        suggestedQuestions: [
          'What are the most important topics?',
          'Can you create a study plan for me?',
          'Give me revision notes on this chapter',
          'Test me on what I\'ve learned'
        ]
      }
    };

    return responses[mode];
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response with delay
    setTimeout(() => {
      const { content: aiContent, suggestedQuestions } = generateAIResponse(content, currentMode);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        sender: 'ai',
        timestamp: new Date(),
        suggestedQuestions,
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setShowModeSetup(false);
  };

  const handleModeChange = (mode: ChatMode) => {
    setCurrentMode(mode);
    setShowModeSetup(false);
    setAssessmentConfig(null);
    
    // Don't add system message for discussion, quiz, revision, exam, worksheet, homework, or planner modes with setup
    if (mode === 'discussion' || mode === 'quiz' || mode === 'revision' || mode === 'exam' || mode === 'homework' || mode === 'worksheet' || mode === 'planner') {
      setMessages([]);
      return;
    }
    
    // Add system message about mode change
    const systemMessage: Message = {
      id: Date.now().toString(),
      content: `Switched to ${mode.toUpperCase()} mode. How can I help you today?`,
      sender: 'ai',
      timestamp: new Date(),
      suggestedQuestions: generateAIResponse('', mode).suggestedQuestions,
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

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
    class: user.grade || '10th Grade',
    grade: user.grade || '10th Grade',
    isPinProtected: false
  } : null);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        currentMode={currentMode}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader
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