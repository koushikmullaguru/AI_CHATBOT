import { useState, useRef, useEffect } from 'react';
import { ExamConfig } from '../types';
import { Clock, CheckCircle, XCircle, AlertCircle, Flag, Send } from 'lucide-react';

interface ExamModeProps {
  config: ExamConfig;
  onComplete: () => void;
}

interface ExamQuestion {
  id: number;
  type: 'mcq' | 'short-answer' | 'descriptive';
  question: string;
  options?: string[];
  answer?: string;
  marks: number;
}

export function ExamMode({ config, onComplete }: ExamModeProps) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(config.duration * 60); // Convert to seconds
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate questions based on exam config
    const generatedQuestions = generateExamQuestions(config);
    setQuestions(generatedQuestions);
  }, [config]);

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0 && !examSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, examSubmitted]);

  const generateExamQuestions = (config: ExamConfig): ExamQuestion[] => {
    const questions: ExamQuestion[] = [];
    const { examType, questionCount, topic, difficulty } = config;

    // Generate different question types based on exam pattern
    if (examType === 'mcq') {
      for (let i = 0; i < questionCount; i++) {
        questions.push({
          id: i + 1,
          type: 'mcq',
          question: `Question ${i + 1}: Based on ${topic}, which of the following statements is correct regarding the fundamental concepts?`,
          options: [
            'Option A: First theoretical explanation',
            'Option B: Second theoretical explanation',
            'Option C: Third theoretical explanation',
            'Option D: Fourth theoretical explanation',
          ],
          marks: 1,
        });
      }
    } else if (examType === 'descriptive') {
      for (let i = 0; i < questionCount; i++) {
        questions.push({
          id: i + 1,
          type: 'descriptive',
          question: `Question ${i + 1}: Explain in detail the concept of ${topic}. Discuss its significance, applications, and key principles. Support your answer with relevant examples.`,
          marks: 10,
        });
      }
    } else if (examType === 'mixed') {
      const mcqCount = Math.floor(questionCount * 0.6);
      const shortCount = Math.floor(questionCount * 0.3);
      const descriptiveCount = questionCount - mcqCount - shortCount;

      for (let i = 0; i < mcqCount; i++) {
        questions.push({
          id: i + 1,
          type: 'mcq',
          question: `Question ${i + 1}: Multiple choice question about ${topic}.`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          marks: 1,
        });
      }

      for (let i = mcqCount; i < mcqCount + shortCount; i++) {
        questions.push({
          id: i + 1,
          type: 'short-answer',
          question: `Question ${i + 1}: Write a short answer (50-100 words) about ${topic}.`,
          marks: 3,
        });
      }

      for (let i = mcqCount + shortCount; i < questionCount; i++) {
        questions.push({
          id: i + 1,
          type: 'descriptive',
          question: `Question ${i + 1}: Write a detailed answer about ${topic}.`,
          marks: 5,
        });
      }
    } else if (examType === 'board-exam') {
      // Section A - MCQ
      for (let i = 0; i < 10; i++) {
        questions.push({
          id: i + 1,
          type: 'mcq',
          question: `Section A - Question ${i + 1}: Choose the correct answer about ${topic}.`,
          options: ['(a) Option A', '(b) Option B', '(c) Option C', '(d) Option D'],
          marks: 1,
        });
      }
      // Section B - Short Answer
      for (let i = 10; i < 20; i++) {
        questions.push({
          id: i + 1,
          type: 'short-answer',
          question: `Section B - Question ${i + 1}: Answer in brief (2-3 sentences) about ${topic}.`,
          marks: 2,
        });
      }
      // Section C - Descriptive
      for (let i = 20; i < questionCount; i++) {
        questions.push({
          id: i + 1,
          type: 'descriptive',
          question: `Section C - Question ${i + 1}: Explain in detail about ${topic}.`,
          marks: 5,
        });
      }
    } else if (examType === 'competitive') {
      for (let i = 0; i < questionCount; i++) {
        questions.push({
          id: i + 1,
          type: 'mcq',
          question: `Question ${i + 1}: [${difficulty.toUpperCase()}] Competitive exam question on ${topic}.`,
          options: ['(A) Option A', '(B) Option B', '(C) Option C', '(D) Option D'],
          marks: 1,
        });
      }
    } else {
      // Quick test
      for (let i = 0; i < questionCount; i++) {
        questions.push({
          id: i + 1,
          type: 'mcq',
          question: `Question ${i + 1}: Quick question about ${topic}.`,
          options: ['A) Option A', 'B) Option B', 'C) Option C', 'D) Option D'],
          marks: 1,
        });
      }
    }

    return questions;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const toggleMarkForReview = (questionId: number) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmitExam = () => {
    setExamSubmitted(true);
    setShowSubmitConfirm(false);
  };

  const getQuestionStatus = (questionId: number) => {
    if (answers[questionId]) return 'answered';
    if (markedForReview.has(questionId)) return 'review';
    return 'not-answered';
  };

  const calculateStats = () => {
    const answered = Object.keys(answers).length;
    const notAnswered = questions.length - answered;
    const marked = markedForReview.size;
    return { answered, notAnswered, marked };
  };

  const stats = calculateStats();
  const currentQuestion = questions[currentIndex];
  const timeWarning = timeLeft < 300; // Less than 5 minutes

  if (examSubmitted) {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-4xl mb-4 dark:text-white">Exam Submitted Successfully!</h2>
            <p className="text-gray-600 mb-8">
              Your exam has been submitted. In a real scenario, your answers would be evaluated.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-8">
              <h3 className="text-xl mb-4 dark:text-white">Exam Summary</h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Total Questions:</span>
                  <span className="dark:text-white">{questions.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Answered:</span>
                  <span className="text-green-600 dark:text-green-400">{stats.answered}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Not Answered:</span>
                  <span className="text-red-600 dark:text-red-400">{stats.notAnswered}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">Time Used:</span>
                  <span className="dark:text-white">{formatTime(config.duration * 60 - timeLeft)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="px-8 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Back to Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading exam questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Exam Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl dark:text-white">{config.examType.toUpperCase()} - {config.subject}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{config.topic} • {config.difficulty}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeWarning ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            <Clock className="w-5 h-5" />
            <span className="text-lg">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Question Navigation Panel */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
          <div className="mb-6">
            <h4 className="mb-3 dark:text-white">Question Palette</h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q) => {
                const status = getQuestionStatus(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(q.id - 1)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm transition-all ${
                      currentIndex === q.id - 1
                        ? 'ring-2 ring-purple-500'
                        : ''
                    } ${
                      status === 'answered'
                        ? 'bg-green-500 text-white'
                        : status === 'review'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {q.id}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded" />
              <span className="dark:text-gray-300">Answered ({stats.answered})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded" />
              <span className="dark:text-gray-300">Not Answered ({stats.notAnswered})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded" />
              <span className="dark:text-gray-300">Marked for Review ({stats.marked})</span>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                        Question {currentQuestion.id} of {questions.length}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                        {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm capitalize">
                        {currentQuestion.type === 'mcq' ? 'Multiple Choice' : currentQuestion.type === 'short-answer' ? 'Short Answer' : 'Descriptive'}
                      </span>
                    </div>
                    <p className="text-lg dark:text-white">{currentQuestion.question}</p>
                  </div>
                  <button
                    onClick={() => toggleMarkForReview(currentQuestion.id)}
                    className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                      markedForReview.has(currentQuestion.id)
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400'
                    }`}
                    title="Mark for review"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                </div>

                {/* Answer Input */}
                <div className="mt-6">
                  {currentQuestion.type === 'mcq' && currentQuestion.options ? (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAnswerChange(currentQuestion.id, option)}
                          className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                            answers[currentQuestion.id] === option
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:text-white'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:text-white'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : currentQuestion.type === 'short-answer' ? (
                    <textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Write your answer here (50-100 words)..."
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  ) : (
                    <textarea
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Write your detailed answer here..."
                      rows={10}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-8 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl mb-4 text-center">Submit Exam?</h3>
            <p className="text-gray-600 mb-6 text-center">
              Are you sure you want to submit the exam? You have answered {stats.answered} out of {questions.length} questions.
            </p>
            {stats.notAnswered > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-700">
                  ⚠️ You have {stats.notAnswered} unanswered question{stats.notAnswered !== 1 ? 's' : ''}.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitExam}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}