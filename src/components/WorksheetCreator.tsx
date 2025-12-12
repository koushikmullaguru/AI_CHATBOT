import { useState } from 'react';
import { ClassConfig } from './TeacherClassSelector';
import { FileText, Download, Eye } from 'lucide-react';

interface WorksheetCreatorProps {
  classConfig: ClassConfig;
  onBack: () => void;
}

export function WorksheetCreator({ classConfig, onBack }: WorksheetCreatorProps) {
  const [topic, setTopic] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [generatedWorksheet, setGeneratedWorksheet] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const questionTypes = [
    { id: 'mcq', label: 'Multiple Choice', icon: '✓' },
    { id: 'fill-blank', label: 'Fill in the Blanks', icon: '___' },
    { id: 'true-false', label: 'True/False', icon: 'T/F' },
    { id: 'short-answer', label: 'Short Answer', icon: '✍️' },
    { id: 'matching', label: 'Matching', icon: '↔️' },
    { id: 'problem-solving', label: 'Problem Solving', icon: '🧮' },
  ];

  const generateWorksheet = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      let worksheet = `# ${topic} - Practice Worksheet\n\n`;
      worksheet += `**Subject:** ${classConfig.subject}\n`;
      worksheet += `**Class:** ${classConfig.class}${classConfig.section ? ` - Section ${classConfig.section}` : ''}\n`;
      worksheet += `**Date:** ${new Date().toLocaleDateString()}\n`;
      worksheet += `**Student Name:** _________________\n\n`;
      worksheet += `**Instructions:** Answer all questions. Show your work for problem-solving questions.\n\n`;
      worksheet += `---\n\n`;

      for (let i = 1; i <= questionCount; i++) {
        if (questionType === 'mcq') {
          worksheet += `**Question ${i}:** Which of the following best describes [concept related to ${topic}]?\n\n`;
          worksheet += `   a) Option A - [First choice]\n`;
          worksheet += `   b) Option B - [Second choice]\n`;
          worksheet += `   c) Option C - [Third choice]\n`;
          worksheet += `   d) Option D - [Fourth choice]\n\n`;
          worksheet += `   Answer: ____\n\n`;
        } else if (questionType === 'fill-blank') {
          worksheet += `**Question ${i}:** Complete the sentence:\n\n`;
          worksheet += `   The process of ____________ is essential for understanding ${topic}.\n\n`;
          worksheet += `   Answer: ____________________\n\n`;
        } else if (questionType === 'true-false') {
          worksheet += `**Question ${i}:** True or False: [Statement about ${topic}]\n\n`;
          worksheet += `   Answer: ____ (Circle one: True / False)\n\n`;
        } else if (questionType === 'short-answer') {
          worksheet += `**Question ${i}:** Explain the concept of [specific aspect of ${topic}] in 2-3 sentences.\n\n`;
          worksheet += `   Answer:\n   ________________________________________________________________\n\n`;
          worksheet += `   ________________________________________________________________\n\n`;
          worksheet += `   ________________________________________________________________\n\n`;
        } else if (questionType === 'matching') {
          worksheet += `**Question ${i}:** Match the terms with their definitions:\n\n`;
          worksheet += `   Column A          Column B\n`;
          worksheet += `   1. Term A         a) Definition 1\n`;
          worksheet += `   2. Term B         b) Definition 2\n`;
          worksheet += `   3. Term C         c) Definition 3\n\n`;
          worksheet += `   Answers: 1-___, 2-___, 3-___\n\n`;
        } else if (questionType === 'problem-solving') {
          worksheet += `**Question ${i}:** Solve the following problem:\n\n`;
          worksheet += `   [Problem statement related to ${topic}]\n\n`;
          worksheet += `   Show your work:\n\n\n\n\n`;
          worksheet += `   Final Answer: ________________\n\n`;
        }
      }

      worksheet += `---\n\n`;
      worksheet += `**Bonus Question:** [Challenge question for advanced students]\n\n\n\n`;
      worksheet += `**Total Points:** ${questionCount} points + 2 bonus points\n`;
      
      setGeneratedWorksheet(worksheet);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm"
        >
          ← Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl mb-1 dark:text-white">Worksheet Creator</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {classConfig.class} • {classConfig.subject}
            {classConfig.section && ` • Section ${classConfig.section}`}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Configuration Panel */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="mb-3 dark:text-white">Settings</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-2 dark:text-gray-300">Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Quadratic Equations"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-2 dark:text-gray-300">Question Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {questionTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setQuestionType(type.id)}
                        className={`p-2 rounded-lg text-xs transition-all ${
                          questionType === type.id
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="mb-1">{type.icon}</div>
                        <div className="text-xs">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-2 dark:text-gray-300">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs mb-1 dark:text-gray-300">Questions: {questionCount}</label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={generateWorksheet}
                  disabled={!topic || !questionType || isGenerating}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md min-h-[500px] border border-gray-100 dark:border-gray-700">
              {!generatedWorksheet ? (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Configure and generate worksheet</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg dark:text-white">Preview</h2>
                    <button className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:text-gray-200 max-h-[600px] overflow-y-auto">
                    {generatedWorksheet}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}