import { useState } from 'react';
import { ClassConfig } from './TeacherClassSelector';
import { FileText, Download, Settings } from 'lucide-react';
import { Trash2 } from 'lucide-react';

interface TeacherExamCreatorProps {
  classConfig: ClassConfig;
  onBack: () => void;
}

interface ExamSection {
  name: string;
  questionType: string;
  count: number;
  marks: number;
}

export function TeacherExamCreator({ classConfig, onBack }: TeacherExamCreatorProps) {
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sections, setSections] = useState<ExamSection[]>([
    { name: 'Section A', questionType: 'MCQ', count: 10, marks: 10 },
    { name: 'Section B', questionType: 'Short Answer', count: 5, marks: 30 },
    { name: 'Section C', questionType: 'Long Answer', count: 3, marks: 60 },
  ]);
  const [generatedExam, setGeneratedExam] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const generateExam = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      let exam = `# ${examTitle || 'Examination'}\n\n`;
      exam += `**Subject:** ${classConfig.subject}\n`;
      exam += `**Class:** ${classConfig.class}${classConfig.section ? ` - Section ${classConfig.section}` : ''}\n`;
      exam += `**Date:** __________\n`;
      exam += `**Time Allowed:** ${duration} minutes\n`;
      exam += `**Maximum Marks:** ${totalMarks}\n\n`;
      exam += `**Student Name:** ________________________\n`;
      exam += `**Roll Number:** ________________________\n\n`;
      
      if (selectedTopics.length > 0) {
        exam += `**Topics Covered:** ${selectedTopics.join(', ')}\n\n`;
      }
      
      exam += `---\n\n`;
      exam += `## General Instructions:\n\n`;
      exam += `1. All questions are compulsory.\n`;
      exam += `2. Read each question carefully before answering.\n`;
      exam += `3. Write answers in the space provided.\n`;
      exam += `4. Marks are indicated against each question.\n`;
      exam += `5. Use of calculators is ${classConfig.subject.includes('Math') ? 'allowed' : 'not allowed'}.\n\n`;
      exam += `---\n\n`;

      sections.forEach((section, sectionIndex) => {
        exam += `## ${section.name}: ${section.questionType} Questions\n\n`;
        exam += `**(${section.count} questions × ${section.marks / section.count} marks each = ${section.marks} marks)**\n\n`;

        for (let i = 1; i <= section.count; i++) {
          const questionNumber = sections.slice(0, sectionIndex).reduce((sum, s) => sum + s.count, 0) + i;
          
          if (section.questionType === 'MCQ') {
            exam += `**Q${questionNumber}.** Which of the following is correct regarding [concept]?\n\n`;
            exam += `   a) Option A - [Description]\n`;
            exam += `   b) Option B - [Description]\n`;
            exam += `   c) Option C - [Description]\n`;
            exam += `   d) Option D - [Description]\n\n`;
            exam += `   **[${section.marks / section.count} mark]**\n\n`;
          } else if (section.questionType === 'Short Answer') {
            exam += `**Q${questionNumber}.** Answer the following in brief (50-80 words):\n\n`;
            exam += `   [Question about ${classConfig.subject} topic]\n\n`;
            exam += `   **[${section.marks / section.count} marks]**\n\n`;
            exam += `   Answer:\n   ________________________________________________________________\n\n`;
            exam += `   ________________________________________________________________\n\n`;
            exam += `   ________________________________________________________________\n\n`;
          } else if (section.questionType === 'Long Answer') {
            exam += `**Q${questionNumber}.** Answer the following in detail:\n\n`;
            exam += `   [Detailed question requiring comprehensive answer about ${classConfig.subject}]\n\n`;
            exam += `   **[${section.marks / section.count} marks]**\n\n`;
            exam += `   Answer:\n\n\n\n\n\n\n\n`;
          } else if (section.questionType === 'True/False') {
            exam += `**Q${questionNumber}.** State whether the following is True or False:\n\n`;
            exam += `   [Statement about concept]\n\n`;
            exam += `   Answer: __________ **[${section.marks / section.count} mark]**\n\n`;
          } else if (section.questionType === 'Fill in the Blanks') {
            exam += `**Q${questionNumber}.** Fill in the blank:\n\n`;
            exam += `   The process of __________ is important in ${classConfig.subject}.\n\n`;
            exam += `   **[${section.marks / section.count} mark]**\n\n`;
          } else if (section.questionType === 'Problem Solving') {
            exam += `**Q${questionNumber}.** Solve the following problem. Show all your work:\n\n`;
            exam += `   [Problem statement]\n\n`;
            exam += `   **[${section.marks / section.count} marks]**\n\n`;
            exam += `   Solution:\n\n\n\n\n\n\n`;
          }
        }
        
        exam += `\n---\n\n`;
      });

      exam += `**End of Examination**\n\n`;
      exam += `*Check your answers before submitting*\n`;
      
      setGeneratedExam(exam);
      setIsGenerating(false);
    }, 2000);
  };

  const addSection = () => {
    setSections([...sections, {
      name: `Section ${String.fromCharCode(65 + sections.length)}`,
      questionType: 'MCQ',
      count: 5,
      marks: 10,
    }]);
  };

  const updateSection = (index: number, field: keyof ExamSection, value: string | number) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
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
          <h1 className="text-2xl mb-1 dark:text-white">Exam Creator</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {classConfig.class} • {classConfig.subject}
            {classConfig.section && ` • Section ${classConfig.section}`}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Configuration Panel */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="mb-3 dark:text-white text-sm">Exam Settings</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1 dark:text-gray-300">Title</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Mid-Term Exam"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs mb-1 dark:text-gray-300">Duration (min)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 dark:text-gray-300">Total Marks</label>
                    <input
                      type="number"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Topics Selection */}
            {classConfig.topics && classConfig.topics.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
                <h3 className="mb-3 dark:text-white text-sm">
                  Select Topics {selectedTopics.length > 0 && `(${selectedTopics.length})`}
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {classConfig.topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-all ${
                        selectedTopics.includes(topic)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Optional: Select topics to include
                </p>
              </div>
            )}

            {/* Sections */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="mb-3 dark:text-white text-sm">Sections</h3>
              
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <div key={index} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs">
                    <div className="flex justify-between items-center mb-2">
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => updateSection(index, 'name', e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white flex-1 mr-2"
                      />
                      <button
                        onClick={() => removeSection(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <select
                      value={section.questionType}
                      onChange={(e) => updateSection(index, 'questionType', e.target.value)}
                      className="w-full px-2 py-1 mb-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                    >
                      <option>MCQ</option>
                      <option>Short Answer</option>
                      <option>Long Answer</option>
                      <option>True/False</option>
                      <option>Fill in the Blanks</option>
                      <option>Problem Solving</option>
                    </select>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="number"
                        value={section.count}
                        onChange={(e) => updateSection(index, 'count', Number(e.target.value))}
                        placeholder="Qs"
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="number"
                        value={section.marks}
                        onChange={(e) => updateSection(index, 'marks', Number(e.target.value))}
                        placeholder="Marks"
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={addSection}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 dark:hover:text-orange-400 transition-all text-xs"
                >
                  + Add Section
                </button>
              </div>

              <button
                onClick={generateExam}
                disabled={!examTitle || isGenerating}
                className="w-full mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md min-h-[500px] border border-gray-100 dark:border-gray-700">
              {!generatedExam ? (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Configure and generate exam</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg dark:text-white">Preview</h2>
                    <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:text-gray-200 max-h-[600px] overflow-y-auto">
                    {generatedExam}
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