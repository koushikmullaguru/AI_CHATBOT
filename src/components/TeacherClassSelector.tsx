import { useState } from 'react';
import { GraduationCap, BookOpen, Users, ArrowRight } from 'lucide-react';

export interface ClassConfig {
  class: string;
  subject: string;
  section?: string;
  topics?: string[];
}

interface TeacherClassSelectorProps {
  onSelect: (config: ClassConfig) => void;
  title: string;
  description: string;
  showSection?: boolean;
  showTopics?: boolean;
}

export function TeacherClassSelector({ onSelect, title, description, showSection = true, showTopics = false }: TeacherClassSelectorProps) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const classes = [
    '6th Grade',
    '7th Grade',
    '8th Grade',
    '9th Grade',
    '10th Grade',
    '11th Grade',
    '12th Grade'
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
    'Art',
    'Physical Education',
  ];

  const sections = ['A', 'B', 'C', 'D', 'E'];

  // Sample topics based on subject
  const topicsBySubject: Record<string, string[]> = {
    'Mathematics': ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Probability'],
    'Physics': ['Mechanics', 'Thermodynamics', 'Optics', 'Electricity', 'Magnetism', 'Modern Physics'],
    'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'Organic Chemistry', 'Acids & Bases', 'Electrochemistry'],
    'Biology': ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Physiology', 'Plant Biology'],
    'English': ['Grammar', 'Literature', 'Essay Writing', 'Poetry', 'Drama', 'Comprehension'],
    'History': ['Ancient History', 'Medieval History', 'Modern History', 'World Wars', 'Independence Movement'],
    'Geography': ['Physical Geography', 'Human Geography', 'Climate', 'Resources', 'Map Skills'],
    'Computer Science': ['Programming Basics', 'Data Structures', 'Algorithms', 'Web Development', 'Databases'],
    'Economics': ['Microeconomics', 'Macroeconomics', 'Money & Banking', 'International Trade'],
    'Political Science': ['Political Theory', 'Indian Government', 'International Relations'],
  };

  const availableTopics = selectedSubject ? (topicsBySubject[selectedSubject] || []) : [];

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleContinue = () => {
    if (selectedClass && selectedSubject) {
      onSelect({
        class: selectedClass,
        subject: selectedSubject,
        section: showSection ? selectedSection : undefined,
        topics: showTopics && selectedTopics.length > 0 ? selectedTopics : undefined,
      });
    }
  };

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
    setError('');
  };

  const canContinue = selectedClass && selectedSubject && (!showSection || selectedSection) && (!showTopics || selectedTopics.length > 0);

  return (
    <div className="h-full overflow-y-auto px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl mb-2 dark:text-white">{title}</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-6 border border-gray-100 dark:border-gray-700">
          {/* Step 1: Select Class */}
          <div>
            <h3 className="mb-3 dark:text-white">Select Class</h3>
            <div className="grid grid-cols-4 gap-2">
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => {
                    setSelectedClass(cls);
                    setSelectedSubject('');
                    setSelectedSection('');
                  }}
                  className={`p-3 rounded-lg transition-all text-sm ${
                    selectedClass === cls
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Subject */}
          {selectedClass && (
            <div>
              <h3 className="mb-3 dark:text-white">Select Subject</h3>
              <div className="grid grid-cols-3 gap-2">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSelectedSection('');
                    }}
                    className={`p-3 rounded-lg transition-all text-sm ${
                      selectedSubject === subject
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Section (optional) */}
          {showSection && selectedSubject && (
            <div>
              <h3 className="mb-3 dark:text-white">Select Section</h3>
              <div className="grid grid-cols-5 gap-2">
                {sections.map((section) => (
                  <button
                    key={section}
                    onClick={() => setSelectedSection(section)}
                    className={`p-3 rounded-lg transition-all ${
                      selectedSection === section
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Select Topics (optional) */}
          {showTopics && selectedSubject && availableTopics.length > 0 && (
            <div>
              <h3 className="mb-3 dark:text-white">
                Select Topics {selectedTopics.length > 0 && `(${selectedTopics.length} selected)`}
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`p-3 rounded-lg transition-all text-sm text-left ${
                      selectedTopics.includes(topic)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Select one or more topics to focus on
              </p>
            </div>
          )}

          {/* Continue Button */}
          {canContinue && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleContinue}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}