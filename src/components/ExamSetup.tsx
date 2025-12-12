import { useState } from 'react';
import { BookOpen, FileText, Target, Clock, ArrowRight, Zap, Calendar } from 'lucide-react';
import { AddToPlannerButton } from './AddToPlannerButton';

interface ExamConfig {
  examType: string;
  subject: string;
  topic: string;
  difficulty: string;
  duration: number;
  questionCount: number;
}

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

interface ExamSetupProps {
  onStartExam: (config: ExamConfig) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  isDark?: boolean;
}

export function ExamSetup({ onStartExam, onAddTask, isDark = false }: ExamSetupProps) {
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const examTypes = [
    {
      id: 'mcq',
      name: 'Multiple Choice Questions',
      description: 'Objective questions with 4 options',
      icon: '✓',
      duration: 30,
      questions: 20,
    },
    {
      id: 'descriptive',
      name: 'Descriptive Exam',
      description: 'Long-form written answers',
      icon: '✍️',
      duration: 60,
      questions: 5,
    },
    {
      id: 'mixed',
      name: 'Mixed Pattern',
      description: 'MCQ + Short Answer + Descriptive',
      icon: '📝',
      duration: 45,
      questions: 15,
    },
    {
      id: 'board-exam',
      name: 'Board Exam Pattern',
      description: 'Follows standard board exam format',
      icon: '🎓',
      duration: 90,
      questions: 25,
    },
    {
      id: 'competitive',
      name: 'Competitive Exam',
      description: 'Fast-paced competitive format',
      icon: '⚡',
      duration: 40,
      questions: 50,
    },
    {
      id: 'quick-test',
      name: 'Quick Test',
      description: 'Short quiz to test basics',
      icon: '⏱️',
      duration: 15,
      questions: 10,
    },
  ];

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Geography',
    'Computer Science',
    'Economics',
    'Political Science',
  ];

  const topicsBySubject: Record<string, string[]> = {
    'Mathematics': [
      'Algebra - Linear Equations',
      'Algebra - Quadratic Equations',
      'Geometry - Triangles',
      'Geometry - Circles',
      'Trigonometry',
      'Calculus - Derivatives',
      'Calculus - Integrals',
      'Statistics & Probability',
      'Coordinate Geometry',
      'Number Systems',
    ],
    'Physics': [
      'Mechanics - Motion & Forces',
      'Mechanics - Work & Energy',
      'Electricity & Magnetism',
      'Optics',
      'Thermodynamics',
      'Modern Physics',
      'Waves & Sound',
      'Gravitation',
      'Atomic Structure',
      'Electronics',
    ],
    'Chemistry': [
      'Atomic Structure',
      'Chemical Bonding',
      'Periodic Table',
      'Acids, Bases & Salts',
      'Organic Chemistry',
      'Inorganic Chemistry',
      'Physical Chemistry',
      'Electrochemistry',
      'Chemical Kinetics',
      'Thermochemistry',
    ],
    'Biology': [
      'Cell Biology',
      'Genetics & Evolution',
      'Plant Physiology',
      'Human Anatomy',
      'Ecology & Environment',
      'Biotechnology',
      'Reproduction',
      'Microorganisms',
      'Photosynthesis',
      'Nervous System',
    ],
    'English': [
      'Grammar - Tenses',
      'Grammar - Voice',
      'Vocabulary',
      'Comprehension',
      'Essay Writing',
      'Poetry Analysis',
      'Literature',
      'Letter Writing',
      'Speech & Drama',
      'Creative Writing',
    ],
    'History': [
      'Ancient History',
      'Medieval History',
      'Modern History',
      'World War I',
      'World War II',
      'Indian Independence',
      'Cold War Era',
      'French Revolution',
      'Industrial Revolution',
      'Renaissance Period',
    ],
    'Geography': [
      'Physical Geography',
      'Climate & Weather',
      'Natural Resources',
      'Agriculture',
      'Population Studies',
      'Map Reading',
      'Environmental Issues',
      'Continents & Oceans',
      'Mountain Ranges',
      'River Systems',
    ],
    'Computer Science': [
      'Programming Basics',
      'Data Structures',
      'Algorithms',
      'Database Management',
      'Computer Networks',
      'Operating Systems',
      'Web Development',
      'Object-Oriented Programming',
      'Artificial Intelligence',
      'Cybersecurity',
    ],
    'Economics': [
      'Microeconomics',
      'Macroeconomics',
      'Demand & Supply',
      'Market Structures',
      'National Income',
      'Money & Banking',
      'International Trade',
      'Public Finance',
      'Economic Development',
      'Consumer Behavior',
    ],
    'Political Science': [
      'Constitution',
      'Fundamental Rights',
      'Political Theories',
      'Democracy',
      'Elections & Voting',
      'Government Structure',
      'International Relations',
      'Political Parties',
      'Federalism',
      'Judiciary',
    ],
  };

  const difficulties = [
    { id: 'easy', name: 'Easy', description: 'Basic concepts', color: 'bg-green-500' },
    { id: 'medium', name: 'Medium', description: 'Moderate difficulty', color: 'bg-yellow-500' },
    { id: 'hard', name: 'Hard', description: 'Advanced level', color: 'bg-red-500' },
  ];

  const topics = selectedSubject ? (topicsBySubject[selectedSubject] || []) : [];
  const selectedExamTypeData = examTypes.find(e => e.id === selectedExamType);

  const handleStartExam = () => {
    if (selectedExamType && selectedSubject && selectedTopic && selectedDifficulty) {
      const examTypeData = examTypes.find(e => e.id === selectedExamType)!;
      onStartExam({
        examType: selectedExamType,
        subject: selectedSubject,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        duration: examTypeData.duration,
        questionCount: examTypeData.questions,
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl mb-4 dark:text-white">Exam Preparation</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Configure your exam pattern and get started
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 space-y-8">
          {/* Step 1: Select Exam Type */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl dark:text-white">Step 1: Select Exam Type</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose the exam pattern you want to practice</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {examTypes.map((examType) => (
                <button
                  key={examType.id}
                  onClick={() => {
                    setSelectedExamType(examType.id);
                    setSelectedSubject('');
                    setSelectedTopic('');
                    setSelectedDifficulty('');
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left group hover:shadow-lg ${
                    selectedExamType === examType.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{examType.icon}</div>
                    <div className="flex-1">
                      <h4 className="mb-1 dark:text-white">{examType.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{examType.description}</p>
                      <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {examType.duration} min
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {examType.questions} Q
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Subject */}
          {selectedExamType && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="text-xl dark:text-white">Step 2: Select Subject</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose the subject for your exam</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSelectedTopic('');
                      setSelectedDifficulty('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedSubject === subject
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm dark:text-white">{subject}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Topic */}
          {selectedSubject && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl dark:text-white">Step 3: Select Topic</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pick the specific topic to focus on</p>
                  </div>
                </div>
                {selectedTopic && onAddTask && (
                  <AddToPlannerButton
                    subject={selectedSubject}
                    topic={selectedTopic}
                    onAddTask={(task) => {
                      onAddTask(task);
                      alert('Task added to your planner! View it by clicking the Planner button in the header.');
                    }}
                    isDark={isDark}
                  />
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setSelectedDifficulty('');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedTopic === topic
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm dark:text-white">{topic}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Select Difficulty */}
          {selectedTopic && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl dark:text-white">Step 4: Select Difficulty Level</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose how challenging you want the exam</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty.id}
                    onClick={() => setSelectedDifficulty(difficulty.id)}
                    className={`p-5 rounded-xl border-2 transition-all text-left ${
                      selectedDifficulty === difficulty.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${difficulty.color}`} />
                      <h4 className="dark:text-white">{difficulty.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{difficulty.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Exam Button */}
          {selectedDifficulty && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
                <h4 className="mb-3 dark:text-white">Exam Configuration Summary</h4>
                <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Exam Type:</span>
                    <span className="ml-2 dark:text-white">{selectedExamTypeData?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                    <span className="ml-2 dark:text-white">{selectedSubject}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Topic:</span>
                    <span className="ml-2 dark:text-white">{selectedTopic}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                    <span className="ml-2 capitalize dark:text-white">{selectedDifficulty}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="ml-2 dark:text-white">{selectedExamTypeData?.duration} minutes</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Questions:</span>
                    <span className="ml-2 dark:text-white">{selectedExamTypeData?.questions}</span>
                  </div>
                </div>
                <button
                  onClick={handleStartExam}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
                >
                  <span className="text-lg">Start Exam</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}