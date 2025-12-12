import { useState } from 'react';
import { Quiz, QuizQuestion } from '../types';
import { Check, X, ArrowRight, RotateCcw, Trophy } from 'lucide-react';

interface QuizModeProps {
  onComplete: () => void;
}

export function QuizMode({ onComplete }: QuizModeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState('');

  // Sample quiz
  const quiz: Quiz = {
    id: '1',
    title: 'Science Quiz - Photosynthesis',
    totalQuestions: 5,
    questions: [
      {
        id: 'q1',
        type: 'single-choice',
        question: 'What is the primary function of photosynthesis?',
        options: [
          'To produce oxygen for animals',
          'To convert light energy into chemical energy',
          'To absorb carbon dioxide',
          'To create chlorophyll'
        ],
        correctAnswer: 'To convert light energy into chemical energy',
        explanation: 'Photosynthesis primarily converts light energy into chemical energy stored in glucose molecules.'
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Which of the following are required for photosynthesis? (Select all that apply)',
        options: [
          'Sunlight',
          'Carbon dioxide',
          'Oxygen',
          'Water',
          'Nitrogen'
        ],
        correctAnswer: ['Sunlight', 'Carbon dioxide', 'Water'],
        explanation: 'Photosynthesis requires sunlight, carbon dioxide, and water. Oxygen is produced as a byproduct.'
      },
      {
        id: 'q3',
        type: 'short-answer',
        question: 'In which part of the plant cell does photosynthesis occur?',
        correctAnswer: 'chloroplast',
        explanation: 'Photosynthesis occurs in the chloroplasts, which contain chlorophyll.'
      },
      {
        id: 'q4',
        type: 'single-choice',
        question: 'What is the chemical formula for glucose produced during photosynthesis?',
        options: [
          'CO2',
          'H2O',
          'C6H12O6',
          'O2'
        ],
        correctAnswer: 'C6H12O6',
        explanation: 'Glucose has the chemical formula C6H12O6 (6 carbon, 12 hydrogen, 6 oxygen atoms).'
      },
      {
        id: 'q5',
        type: 'multiple-choice',
        question: 'Which colors of light are most absorbed by chlorophyll? (Select all that apply)',
        options: [
          'Red',
          'Blue',
          'Green',
          'Yellow'
        ],
        correctAnswer: ['Red', 'Blue'],
        explanation: 'Chlorophyll primarily absorbs red and blue light, while reflecting green light (which is why plants appear green).'
      }
    ]
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleSingleChoice = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleMultipleChoice = (option: string) => {
    const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
    const newAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter(a => a !== option)
      : [...currentAnswers, option];
    
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: newAnswers }));
  };

  const handleShortAnswer = () => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: shortAnswerInput.trim() }));
    setShortAnswerInput('');
  };

  const handleNext = () => {
    if (currentQuestion.type === 'short-answer' && shortAnswerInput.trim()) {
      handleShortAnswer();
    }

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShortAnswerInput('');
    } else {
      setShowResults(true);
    }
  };

  const checkAnswer = (question: QuizQuestion): boolean => {
    const userAnswer = answers[question.id];
    
    if (question.type === 'short-answer') {
      const correctAnswer = (question.correctAnswer as string).toLowerCase().trim();
      const userAnswerStr = (userAnswer as string || '').toLowerCase().trim();
      return userAnswerStr.includes(correctAnswer) || correctAnswer.includes(userAnswerStr);
    }
    
    if (question.type === 'multiple-choice') {
      const correctAnswers = question.correctAnswer as string[];
      const userAnswers = (userAnswer as string[]) || [];
      return correctAnswers.length === userAnswers.length &&
        correctAnswers.every(a => userAnswers.includes(a));
    }
    
    return userAnswer === question.correctAnswer;
  };

  const calculateScore = () => {
    const correct = quiz.questions.filter(q => checkAnswer(q)).length;
    const percentage = Math.round((correct / quiz.totalQuestions) * 100);
    return { correct, percentage };
  };

  const canProceed = () => {
    if (currentQuestion.type === 'short-answer') {
      return shortAnswerInput.trim().length > 0;
    }
    return answers[currentQuestion.id] !== undefined && 
      (currentQuestion.type !== 'multiple-choice' || 
       (answers[currentQuestion.id] as string[])?.length > 0);
  };

  if (showResults) {
    const { correct, percentage } = calculateScore();
    
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 mb-8 text-center">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-4xl mb-2 dark:text-white">Quiz Complete!</h2>
            <div className="text-6xl my-6 dark:text-white">{percentage}%</div>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              You got {correct} out of {quiz.totalQuestions} questions correct
            </p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setAnswers({});
                  setShowResults(false);
                  setShortAnswerInput('');
                }}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Retake Quiz
              </button>
              <button
                onClick={onComplete}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
              >
                Back to Chat
              </button>
            </div>
          </div>

          {/* Answer Review */}
          <div className="space-y-6">
            <h3 className="text-2xl mb-4 dark:text-white">Review Your Answers</h3>
            {quiz.questions.map((question, index) => {
              const isCorrect = checkAnswer(question);
              const userAnswer = answers[question.id];
              
              return (
                <div key={question.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {isCorrect ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-3 dark:text-white">
                        <span className="text-gray-500 dark:text-gray-400">Q{index + 1}.</span> {question.question}
                      </h4>
                      
                      {question.type === 'short-answer' ? (
                        <div className="space-y-2">
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your answer:</p>
                            <p className="dark:text-white">{userAnswer as string || 'No answer provided'}</p>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Correct answer:</p>
                            <p className="text-green-700 dark:text-green-400">{question.correctAnswer as string}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {question.options?.map((option) => {
                            const isUserAnswer = question.type === 'multiple-choice'
                              ? (userAnswer as string[])?.includes(option)
                              : userAnswer === option;
                            const isCorrectAnswer = question.type === 'multiple-choice'
                              ? (question.correctAnswer as string[]).includes(option)
                              : question.correctAnswer === option;
                            
                            return (
                              <div
                                key={option}
                                className={`p-3 rounded-lg border-2 ${
                                  isCorrectAnswer
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                                    : isUserAnswer
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isCorrectAnswer && (
                                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  )}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  )}
                                  <span className="dark:text-white">{option}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <p className="text-sm text-blue-900 dark:text-blue-200">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Question {currentQuestionIndex + 1} of {quiz.totalQuestions}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / quiz.totalQuestions) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <div className="mb-8">
            <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm mb-4">
              {currentQuestion.type === 'single-choice' && 'Single Choice'}
              {currentQuestion.type === 'multiple-choice' && 'Multiple Choice - Select all that apply'}
              {currentQuestion.type === 'short-answer' && 'Short Answer'}
            </div>
            <h3 className="text-2xl dark:text-white">{currentQuestion.question}</h3>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.type === 'short-answer' ? (
              <div>
                <textarea
                  value={shortAnswerInput}
                  onChange={(e) => setShortAnswerInput(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white"
                />
              </div>
            ) : (
              currentQuestion.options?.map((option) => {
                const isSelected = currentQuestion.type === 'multiple-choice'
                  ? (answers[currentQuestion.id] as string[])?.includes(option)
                  : answers[currentQuestion.id] === option;

                return (
                  <button
                    key={option}
                    onClick={() => {
                      if (currentQuestion.type === 'multiple-choice') {
                        handleMultipleChoice(option);
                      } else {
                        handleSingleChoice(option);
                      }
                    }}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded ${
                        currentQuestion.type === 'multiple-choice' ? 'rounded-md' : 'rounded-full'
                      } border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="dark:text-white">{option}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}