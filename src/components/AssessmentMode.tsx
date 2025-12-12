import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Award, TrendingUp, Brain, FileText, ArrowRight, RefreshCw } from 'lucide-react';
import { AssessmentConfig } from './AssessmentSetup';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  topic: string;
}

interface AssessmentModeProps {
  config: AssessmentConfig;
  onComplete: () => void;
}

export function AssessmentMode({ config, onComplete }: AssessmentModeProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.duration * 60);
  const [isComplete, setIsComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    // Generate questions based on config
    const generatedQuestions = generateQuestions(config);
    setQuestions(generatedQuestions);
    setAnswers(new Array(generatedQuestions.length).fill(null));
  }, [config]);

  useEffect(() => {
    if (isComplete || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isComplete]);

  const generateQuestions = (config: AssessmentConfig): Question[] => {
    const sampleQuestions: Record<string, Question[]> = {
      'Algebra': [
        {
          id: 1,
          question: 'Solve for x: 2x + 5 = 15',
          options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 2.5'],
          correctAnswer: 0,
          explanation: 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5',
          topic: 'Algebra'
        },
        {
          id: 2,
          question: 'What is the value of (a + b)² when a = 3 and b = 4?',
          options: ['49', '25', '36', '64'],
          correctAnswer: 0,
          explanation: '(3 + 4)² = 7² = 49',
          topic: 'Algebra'
        }
      ],
      'Geometry': [
        {
          id: 3,
          question: 'What is the area of a circle with radius 5 cm? (π = 3.14)',
          options: ['78.5 cm²', '31.4 cm²', '15.7 cm²', '62.8 cm²'],
          correctAnswer: 0,
          explanation: 'Area = πr² = 3.14 × 5² = 3.14 × 25 = 78.5 cm²',
          topic: 'Geometry'
        }
      ],
      'Trigonometry': [
        {
          id: 4,
          question: 'What is the value of sin(90°)?',
          options: ['1', '0', '0.5', '√2/2'],
          correctAnswer: 0,
          explanation: 'sin(90°) = 1 (maximum value of sine function)',
          topic: 'Trigonometry'
        }
      ]
    };

    let allQuestions: Question[] = [];
    config.topics.forEach(topic => {
      if (sampleQuestions[topic]) {
        allQuestions = [...allQuestions, ...sampleQuestions[topic]];
      }
    });

    // Shuffle and take required number
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, config.questionCount).map((q, idx) => ({ ...q, id: idx + 1 }));
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);

    // For worksheet, show explanation immediately
    if (config.type === 'worksheet' && config.includeExplanations) {
      setShowExplanation(true);
    }
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    setShowExplanation(false);
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setIsComplete(true);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, idx) => {
      if (answer === questions[idx]?.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100)
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = () => {
    if (config.type === 'worksheet') return FileText;
    if (config.type === 'quiz') return Brain;
    return Award;
  };

  const getTypeColor = () => {
    if (config.type === 'worksheet') return 'blue';
    if (config.type === 'quiz') return 'purple';
    return 'red';
  };

  const TypeIcon = getTypeIcon();
  const color = getTypeColor();

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-500 hover:bg-blue-600'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
      button: 'bg-purple-500 hover:bg-purple-600'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-500',
      text: 'text-red-600 dark:text-red-400',
      button: 'bg-red-500 hover:bg-red-600'
    }
  };

  const colors = colorClasses[color];

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Generating questions...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const score = calculateScore();
    const isPassing = score.percentage >= 60;

    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className={`${colors.bg} rounded-2xl p-8 mb-6 border-2 ${colors.border} text-center`}>
          <div className="w-20 h-20 mx-auto mb-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
            <TypeIcon className={`w-10 h-10 ${colors.text}`} />
          </div>
          <h1 className="text-3xl mb-2 dark:text-white">
            {config.type === 'worksheet' ? 'Worksheet Complete!' :
             config.type === 'quiz' ? 'Quiz Finished!' :
             'Exam Complete!'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{config.subject}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md border border-gray-100 dark:border-gray-700 mb-6">
          <div className="text-center mb-6">
            <div className={`text-6xl mb-4 ${isPassing ? 'text-green-500' : 'text-orange-500'}`}>
              {score.percentage}%
            </div>
            <div className="text-xl text-gray-600 dark:text-gray-400">
              {score.correct} out of {score.total} correct
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border border-green-200 dark:border-green-800">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl text-green-600 dark:text-green-400 mb-1">{score.correct}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center border border-red-200 dark:border-red-800">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl text-red-600 dark:text-red-400 mb-1">{score.total - score.correct}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Incorrect</div>
            </div>
            
            <div className={`${colors.bg} rounded-lg p-4 text-center border ${colors.border.replace('border-', 'border-').replace('-500', '-200')} dark:${colors.border.replace('border-', 'border-').replace('-500', '-800')}`}>
              <TrendingUp className={`w-8 h-8 ${colors.text} mx-auto mb-2`} />
              <div className={`text-2xl ${colors.text} mb-1`}>{score.percentage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
            </div>
          </div>

          {/* Topic-wise performance */}
          <div className="mb-6">
            <h3 className="text-lg mb-3 dark:text-white">Performance by Topic</h3>
            <div className="space-y-2">
              {config.topics.map((topic, idx) => {
                const topicQuestions = questions.filter(q => q.topic === topic);
                const topicCorrect = topicQuestions.filter((q, qIdx) => {
                  const actualIdx = questions.indexOf(q);
                  return answers[actualIdx] === q.correctAnswer;
                }).length;
                const topicPercentage = topicQuestions.length > 0 
                  ? Math.round((topicCorrect / topicQuestions.length) * 100)
                  : 0;

                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="dark:text-white">{topic}</span>
                      <span className={`${topicPercentage >= 60 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {topicCorrect}/{topicQuestions.length} ({topicPercentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${topicPercentage >= 60 ? 'bg-green-500' : 'bg-orange-500'} rounded-full`}
                        style={{ width: `${topicPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review answers */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg mb-4 dark:text-white">Answer Review</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((question, idx) => {
                const isCorrect = answers[idx] === question.correctAnswer;
                const userAnswer = answers[idx];

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="mb-2 dark:text-white">
                          <strong>Q{idx + 1}:</strong> {question.question}
                        </div>
                        <div className="text-sm space-y-1">
                          {userAnswer !== null && (
                            <div className={isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                              Your answer: {question.options[userAnswer]}
                            </div>
                          )}
                          {!isCorrect && (
                            <div className="text-green-700 dark:text-green-400">
                              Correct answer: {question.options[question.correctAnswer]}
                            </div>
                          )}
                          {question.explanation && config.includeExplanations && (
                            <div className="text-gray-600 dark:text-gray-400 mt-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          {config.type === 'worksheet' && (
            <button
              onClick={() => {
                setCurrentQuestion(0);
                setAnswers(new Array(questions.length).fill(null));
                setTimeLeft(config.duration * 60);
                setIsComplete(false);
                setShowExplanation(false);
              }}
              className={`px-6 py-3 ${colors.button} text-white rounded-lg transition-all flex items-center gap-2`}
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          )}
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const userAnswer = answers[currentQuestion];
  const isAnswered = userAnswer !== null;
  const isCorrect = isAnswered && userAnswer === question.correctAnswer;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TypeIcon className={`w-6 h-6 ${colors.text}`} />
          <div>
            <div className="dark:text-white">
              {config.type === 'worksheet' ? 'Worksheet' :
               config.type === 'quiz' ? 'Quiz' : 'Exam'} - {config.subject}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 ${timeLeft < 60 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : colors.bg + ' ' + colors.text} rounded-lg`}>
          <Clock className="w-5 h-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.button} transition-all duration-300`}
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{answers.filter(a => a !== null).length} answered</span>
          <span>{questions.length - answers.filter(a => a !== null).length} remaining</span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-6">
        <div className={`inline-block px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-sm mb-4`}>
          {question.topic}
        </div>
        <h2 className="text-xl mb-6 dark:text-white">{question.question}</h2>
        
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={showExplanation}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                userAnswer === idx
                  ? showExplanation
                    ? idx === question.correctAnswer
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : `${colors.border} ${colors.bg}`
                  : showExplanation && idx === question.correctAnswer
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  userAnswer === idx
                    ? showExplanation
                      ? idx === question.correctAnswer
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-red-500 bg-red-500 text-white'
                      : `${colors.border} ${colors.text}`
                    : showExplanation && idx === question.correctAnswer
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {showExplanation && idx === question.correctAnswer && <CheckCircle className="w-5 h-5" />}
                  {showExplanation && userAnswer === idx && idx !== question.correctAnswer && <XCircle className="w-5 h-5" />}
                  {!showExplanation && String.fromCharCode(65 + idx)}
                </div>
                <span className="dark:text-white">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Explanation */}
        {showExplanation && question.explanation && config.includeExplanations && (
          <div className={`mt-4 p-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'} border rounded-lg`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-5 h-5 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'} flex-shrink-0 mt-0.5`} />
              <div>
                <div className={`mb-1 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  <strong>{isCorrect ? 'Correct!' : 'Explanation'}</strong>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{question.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentQuestion(idx);
                setShowExplanation(false);
              }}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                idx === currentQuestion
                  ? `${colors.border} ${colors.bg} ${colors.text}`
                  : answers[idx] !== null
                  ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQuestion < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className={`px-6 py-3 ${colors.button} text-white rounded-lg transition-all flex items-center gap-2`}
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className={`px-6 py-3 ${colors.button} text-white rounded-lg transition-all`}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
