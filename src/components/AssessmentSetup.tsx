import { useState } from 'react';
import { BookOpen, Clock, Target, Brain, Award, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export type AssessmentType = 'worksheet' | 'quiz' | 'exam';

export interface AssessmentConfig {
  type: AssessmentType;
  subject: string;
  topics: string[];
  duration: number;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  includeExplanations?: boolean;
}

interface AssessmentSetupProps {
  type: AssessmentType;
  onStartAssessment: (config: AssessmentConfig) => void;
}

const assessmentInfo = {
  worksheet: {
    title: 'Worksheet Practice',
    subtitle: 'Practice & Learning',
    icon: FileText,
    color: 'blue',
    stakes: 'Low Stakes',
    goal: 'Build skills through practice',
    defaultDuration: 15,
    defaultQuestions: 10,
    frequency: 'Daily/Weekly',
    features: ['Step-by-step solutions', 'Unlimited attempts', 'Instant feedback', 'Progress tracking']
  },
  quiz: {
    title: 'Quick Quiz',
    subtitle: 'Understanding Check',
    icon: Brain,
    color: 'purple',
    stakes: 'Medium Stakes',
    goal: 'Test your understanding',
    defaultDuration: 10,
    defaultQuestions: 5,
    frequency: 'Weekly/Unit-based',
    features: ['Auto-graded', 'Time-bound', 'Score report', 'Topic mastery']
  },
  exam: {
    title: 'Formal Exam',
    subtitle: 'Comprehensive Evaluation',
    icon: Award,
    color: 'red',
    stakes: 'High Stakes',
    goal: 'Formal assessment',
    defaultDuration: 60,
    defaultQuestions: 30,
    frequency: 'Term/Annual',
    features: ['Timed environment', 'No retakes', 'Detailed analytics', 'Performance report']
  }
};

const subjects = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science'
];

const topicsBySubject: Record<string, string[]> = {
  'Mathematics': ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Probability'],
  'Physics': ['Mechanics', 'Thermodynamics', 'Optics', 'Electromagnetism', 'Modern Physics'],
  'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
  'Biology': ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Physiology'],
  'English': ['Grammar', 'Literature', 'Writing', 'Comprehension', 'Poetry'],
  'History': ['Ancient History', 'Medieval History', 'Modern History', 'World Wars', 'Indian Independence'],
  'Geography': ['Physical Geography', 'Human Geography', 'Climate', 'Resources', 'Mapping'],
  'Computer Science': ['Programming', 'Data Structures', 'Algorithms', 'Databases', 'Networks']
};

export function AssessmentSetup({ type, onStartAssessment }: AssessmentSetupProps) {
  const info = assessmentInfo[type];
  const Icon = info.icon;
  
  const [subject, setSubject] = useState('Mathematics');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [duration, setDuration] = useState(info.defaultDuration);
  const [questionCount, setQuestionCount] = useState(info.defaultQuestions);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [includeExplanations, setIncludeExplanations] = useState(type === 'worksheet');

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleStart = () => {
    if (selectedTopics.length === 0) {
      alert('Please select at least one topic');
      return;
    }

    onStartAssessment({
      type,
      subject,
      topics: selectedTopics,
      duration,
      questionCount,
      difficulty,
      includeExplanations
    });
  };

  const getColorClasses = () => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-600 dark:text-blue-400',
        button: 'bg-blue-500 hover:bg-blue-600',
        icon: 'text-blue-500'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-600 dark:text-purple-400',
        button: 'bg-purple-500 hover:bg-purple-600',
        icon: 'text-purple-500'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-600 dark:text-red-400',
        button: 'bg-red-500 hover:bg-red-600',
        icon: 'text-red-500'
      }
    };
    return colors[info.color as keyof typeof colors];
  };

  const colors = getColorClasses();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className={`${colors.bg} rounded-2xl p-6 mb-6 border ${colors.border}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center border-2 ${colors.border}`}>
              <Icon className={`w-8 h-8 ${colors.icon}`} />
            </div>
            <div>
              <h1 className="text-3xl mb-1 dark:text-white">{info.title}</h1>
              <p className={`text-sm ${colors.text}`}>{info.subtitle}</p>
            </div>
          </div>
          <div className={`px-4 py-2 ${colors.bg} rounded-full border ${colors.border}`}>
            <span className={`text-sm ${colors.text}`}>{info.stakes}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Target className={`w-5 h-5 ${colors.icon}`} />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Goal</div>
              <div className="text-sm dark:text-white">{info.goal}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${colors.icon}`} />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
              <div className="text-sm dark:text-white">{info.defaultDuration} minutes</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className={`w-5 h-5 ${colors.icon}`} />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Questions</div>
              <div className="text-sm dark:text-white">{info.defaultQuestions} problems</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${colors.icon}`} />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Frequency</div>
              <div className="text-sm dark:text-white">{info.frequency}</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {info.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm dark:text-gray-300">
              <CheckCircle className={`w-4 h-4 ${colors.icon}`} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Subject Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
            <label className="block mb-3 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              Select Subject
            </label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setSelectedTopics([]);
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {subjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          {/* Duration & Questions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="mb-4 dark:text-white">Test Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 dark:text-gray-300">
                  Duration: {duration} minutes
                </label>
                <input
                  type="range"
                  min={type === 'worksheet' ? 5 : type === 'quiz' ? 5 : 30}
                  max={type === 'worksheet' ? 30 : type === 'quiz' ? 20 : 180}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{type === 'worksheet' ? '5' : type === 'quiz' ? '5' : '30'} min</span>
                  <span>{type === 'worksheet' ? '30' : type === 'quiz' ? '20' : '180'} min</span>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 dark:text-gray-300">
                  Number of Questions: {questionCount}
                </label>
                <input
                  type="range"
                  min={type === 'worksheet' ? 5 : type === 'quiz' ? 3 : 20}
                  max={type === 'worksheet' ? 20 : type === 'quiz' ? 10 : 50}
                  step={type === 'worksheet' ? 1 : type === 'quiz' ? 1 : 5}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{type === 'worksheet' ? '5' : type === 'quiz' ? '3' : '20'} questions</span>
                  <span>{type === 'worksheet' ? '20' : type === 'quiz' ? '10' : '50'} questions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="mb-4 dark:text-white">Difficulty Level</h3>
            <div className="grid grid-cols-3 gap-3">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level as any)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    difficulty === level
                      ? `${colors.border} ${colors.bg} ${colors.text}`
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          {type === 'worksheet' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExplanations}
                  onChange={(e) => setIncludeExplanations(e.target.checked)}
                  className="w-5 h-5 text-blue-500 rounded"
                />
                <div>
                  <div className="dark:text-white">Include step-by-step explanations</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Show detailed solutions for each problem</div>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Right Column - Topic Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
          <h3 className="mb-4 dark:text-white">
            Select Topics
            {selectedTopics.length > 0 && (
              <span className={`ml-2 text-sm ${colors.text}`}>
                ({selectedTopics.length} selected)
              </span>
            )}
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {topicsBySubject[subject]?.map((topic) => (
              <label
                key={topic}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTopics.includes(topic)
                    ? `${colors.border} ${colors.bg}`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTopics.includes(topic)}
                  onChange={() => toggleTopic(topic)}
                  className="w-5 h-5 text-blue-500 rounded"
                />
                <span className="dark:text-white">{topic}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={selectedTopics.length === 0}
          className={`px-8 py-4 ${colors.button} text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg`}
        >
          <Icon className="w-6 h-6" />
          Start {info.title}
        </button>
      </div>
    </div>
  );
}
