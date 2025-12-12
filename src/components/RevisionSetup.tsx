import { useState } from 'react';
import { RevisionTopic } from '../types';
import { BookOpen, GraduationCap, Target, ArrowRight } from 'lucide-react';

interface RevisionSetupProps {
  onStartRevision: (topic: RevisionTopic) => void;
}

export function RevisionSetup({ onStartRevision }: RevisionSetupProps) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  const classes = [
    '6th Grade',
    '7th Grade',
    '8th Grade',
    '9th Grade',
    '10th Grade',
    '11th Grade',
    '12th Grade'
  ];

  const subjectsByClass: Record<string, string[]> = {
    '6th Grade': ['Mathematics', 'Science', 'English', 'Social Studies', 'Geography'],
    '7th Grade': ['Mathematics', 'Science', 'English', 'History', 'Geography'],
    '8th Grade': ['Algebra', 'Biology', 'English', 'History', 'Civics'],
    '9th Grade': ['Algebra', 'Biology', 'English', 'World History', 'Physics'],
    '10th Grade': ['Geometry', 'Chemistry', 'English', 'World History', 'Physics'],
    '11th Grade': ['Pre-Calculus', 'Chemistry', 'English Literature', 'US History', 'Physics'],
    '12th Grade': ['Calculus', 'Advanced Physics', 'English Literature', 'Economics', 'Computer Science']
  };

  const topicsBySubject: Record<string, string[]> = {
    'Mathematics': ['Fractions', 'Decimals', 'Geometry', 'Algebra Basics', 'Word Problems'],
    'Algebra': ['Linear Equations', 'Quadratic Equations', 'Polynomials', 'Functions', 'Inequalities'],
    'Geometry': ['Triangles', 'Circles', 'Angles', 'Area and Perimeter', 'Volume'],
    'Calculus': ['Limits', 'Derivatives', 'Integrals', 'Applications', 'Series'],
    'Science': ['Matter and Energy', 'Life Processes', 'Forces and Motion', 'Earth Science', 'Simple Machines'],
    'Biology': ['Cell Structure', 'Genetics', 'Evolution', 'Ecology', 'Human Body Systems'],
    'Chemistry': ['Atomic Structure', 'Chemical Reactions', 'Periodic Table', 'Acids and Bases', 'Organic Chemistry'],
    'Physics': ['Motion and Forces', 'Energy', 'Waves', 'Electricity', 'Magnetism'],
    'English': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing Skills', 'Literature'],
    'History': ['Ancient Civilizations', 'World Wars', 'Industrial Revolution', 'Cold War', 'Modern History'],
    'Geography': ['Maps and Globes', 'Continents and Oceans', 'Climate', 'Natural Resources', 'Population'],
  };

  const subjects = selectedClass ? (subjectsByClass[selectedClass] || []) : [];
  const topics = selectedSubject ? (topicsBySubject[selectedSubject] || []) : [];

  const handleStart = () => {
    if (selectedClass && selectedSubject && selectedTopic) {
      onStartRevision({
        class: selectedClass,
        subject: selectedSubject,
        topic: selectedTopic
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl mb-4">Revision Mode</h2>
          <p className="text-xl text-gray-600">
            Choose what you'd like to revise today
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 space-y-8">
          {/* Step 1: Select Class */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl">Step 1: Select Your Class</h3>
                <p className="text-sm text-gray-500">Choose your current grade level</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => {
                    setSelectedClass(cls);
                    setSelectedSubject('');
                    setSelectedTopic('');
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedClass === cls
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Subject */}
          {selectedClass && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl">Step 2: Select Subject</h3>
                  <p className="text-sm text-gray-500">Pick the subject you want to revise</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSelectedTopic('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedSubject === subject
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Topic */}
          {selectedSubject && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-xl">Step 3: Select Topic</h3>
                  <p className="text-sm text-gray-500">Choose the specific topic to revise</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedTopic === topic
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Button */}
          {selectedTopic && (
            <div className="pt-6 border-t border-gray-200 animate-fadeIn">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
                <h4 className="mb-2">Ready to start?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  You've selected: <strong>{selectedClass}</strong> → <strong>{selectedSubject}</strong> → <strong>{selectedTopic}</strong>
                </p>
                <button
                  onClick={handleStart}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
                >
                  <span className="text-lg">Start Revision</span>
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