import { useState } from 'react';
import { BookOpen, GraduationCap, Target, ArrowRight, Pencil } from 'lucide-react';
import { AddToPlannerButton } from './AddToPlannerButton';

interface HomeworkTopic {
  class: string;
  subject: string;
  topic: string;
  assignmentType: string;
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

interface HomeworkSetupProps {
  onStartHomework: (config: HomeworkTopic) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  isDark?: boolean;
}

export function HomeworkSetup({ onStartHomework, onAddTask, isDark = false }: HomeworkSetupProps) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedAssignmentType, setSelectedAssignmentType] = useState('');

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
    '6th Grade': ['Mathematics', 'Science', 'English', 'Social Studies', 'Geography', 'Art'],
    '7th Grade': ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer'],
    '8th Grade': ['Algebra', 'Biology', 'English', 'History', 'Civics', 'Physics'],
    '9th Grade': ['Algebra', 'Biology', 'English', 'World History', 'Physics', 'Chemistry'],
    '10th Grade': ['Geometry', 'Chemistry', 'English', 'World History', 'Physics', 'Biology'],
    '11th Grade': ['Pre-Calculus', 'Chemistry', 'English Literature', 'US History', 'Physics', 'Economics'],
    '12th Grade': ['Calculus', 'Advanced Physics', 'English Literature', 'Economics', 'Computer Science', 'Statistics']
  };

  const topicsBySubject: Record<string, string[]> = {
    'Mathematics': [
      'Fractions and Decimals',
      'Integers and Whole Numbers',
      'Ratios and Proportions',
      'Percentages',
      'Basic Geometry',
      'Area and Perimeter',
      'Data Handling',
      'Simple Equations',
      'Algebraic Expressions',
      'Word Problems',
    ],
    'Algebra': [
      'Linear Equations',
      'Quadratic Equations',
      'Polynomials',
      'Factorization',
      'Functions and Graphs',
      'Inequalities',
      'Systems of Equations',
      'Exponents and Radicals',
      'Sequences and Series',
      'Matrices',
    ],
    'Geometry': [
      'Lines and Angles',
      'Triangles',
      'Quadrilaterals',
      'Circles',
      'Polygons',
      'Coordinate Geometry',
      'Transformations',
      'Surface Area and Volume',
      'Congruence and Similarity',
      'Theorems and Proofs',
    ],
    'Calculus': [
      'Limits and Continuity',
      'Derivatives',
      'Applications of Derivatives',
      'Integrals',
      'Applications of Integrals',
      'Differential Equations',
      'Sequences and Series',
      'Vector Calculus',
      'Optimization Problems',
      'Related Rates',
    ],
    'Pre-Calculus': [
      'Functions',
      'Trigonometry',
      'Complex Numbers',
      'Vectors',
      'Conic Sections',
      'Exponential Functions',
      'Logarithmic Functions',
      'Polynomial Functions',
      'Rational Functions',
      'Parametric Equations',
    ],
    'Science': [
      'Matter and Its Properties',
      'Physical and Chemical Changes',
      'Atoms and Molecules',
      'Motion and Force',
      'Energy',
      'Light and Sound',
      'Living Organisms',
      'Plant and Animal Cells',
      'Food and Nutrition',
      'Weather and Climate',
    ],
    'Biology': [
      'Cell Structure and Function',
      'Genetics and Heredity',
      'Evolution and Natural Selection',
      'Ecology and Ecosystems',
      'Human Body Systems',
      'Plant Biology',
      'Animal Behavior',
      'Microorganisms',
      'Reproduction',
      'Biotechnology',
    ],
    'Chemistry': [
      'Atomic Structure',
      'Chemical Bonding',
      'Periodic Table',
      'Chemical Reactions',
      'Acids, Bases and Salts',
      'Metals and Non-Metals',
      'Organic Chemistry',
      'Carbon Compounds',
      'Stoichiometry',
      'Chemical Equilibrium',
    ],
    'Physics': [
      'Motion and Laws of Motion',
      'Force and Pressure',
      'Work and Energy',
      'Gravitation',
      'Sound',
      'Light and Reflection',
      'Electricity',
      'Magnetism',
      'Current Electricity',
      'Electromagnetic Induction',
    ],
    'Advanced Physics': [
      'Mechanics',
      'Thermodynamics',
      'Electromagnetism',
      'Optics',
      'Modern Physics',
      'Quantum Mechanics',
      'Relativity',
      'Nuclear Physics',
      'Waves and Oscillations',
      'Solid State Physics',
    ],
    'English': [
      'Grammar - Parts of Speech',
      'Grammar - Tenses',
      'Grammar - Active and Passive Voice',
      'Vocabulary Building',
      'Reading Comprehension',
      'Essay Writing',
      'Letter Writing',
      'Paragraph Writing',
      'Poetry Analysis',
      'Story Writing',
    ],
    'English Literature': [
      'Poetry Analysis',
      'Drama and Theatre',
      'Novel Study',
      'Short Stories',
      'Literary Devices',
      'Character Analysis',
      'Theme Analysis',
      'Critical Essays',
      'Shakespeare Studies',
      'Modern Literature',
    ],
    'History': [
      'Ancient Civilizations',
      'Medieval Period',
      'Renaissance',
      'Industrial Revolution',
      'World War I',
      'World War II',
      'Cold War',
      'Colonialism',
      'Independence Movements',
      'Modern History',
    ],
    'World History': [
      'Ancient Mesopotamia',
      'Ancient Egypt',
      'Ancient Greece',
      'Ancient Rome',
      'Medieval Europe',
      'Age of Exploration',
      'American Revolution',
      'French Revolution',
      'World Wars',
      'Contemporary World',
    ],
    'US History': [
      'Colonial America',
      'American Revolution',
      'Constitution',
      'Civil War',
      'Reconstruction',
      'Industrial Age',
      'World War Era',
      'Civil Rights Movement',
      'Cold War',
      'Modern America',
    ],
    'Social Studies': [
      'Geography and Maps',
      'Communities',
      'Government',
      'Economics Basics',
      'Culture and Society',
      'Historical Events',
      'Citizenship',
      'Natural Resources',
      'Transportation',
      'Communication',
    ],
    'Geography': [
      'Maps and Globes',
      'Continents and Oceans',
      'Climate Zones',
      'Natural Resources',
      'Population Geography',
      'Physical Geography',
      'Human Geography',
      'Environmental Issues',
      'Agriculture',
      'Urbanization',
    ],
    'Civics': [
      'Constitution',
      'Fundamental Rights',
      'Fundamental Duties',
      'Democracy',
      'Elections',
      'Government Structure',
      'Judiciary',
      'Local Government',
      'Secularism',
      'Social Justice',
    ],
    'Computer': [
      'Computer Basics',
      'Operating Systems',
      'MS Office',
      'Internet and Email',
      'Programming Basics',
      'HTML and Web Design',
      'Algorithms',
      'Data Representation',
      'Computer Networks',
      'Cybersecurity',
    ],
    'Computer Science': [
      'Programming Fundamentals',
      'Data Structures',
      'Algorithms',
      'Object-Oriented Programming',
      'Database Management',
      'Web Development',
      'Software Engineering',
      'Computer Networks',
      'Artificial Intelligence',
      'Machine Learning',
    ],
    'Economics': [
      'Microeconomics',
      'Macroeconomics',
      'Demand and Supply',
      'Market Structures',
      'National Income',
      'Money and Banking',
      'International Trade',
      'Public Finance',
      'Economic Development',
      'Indian Economy',
    ],
    'Art': [
      'Drawing Basics',
      'Color Theory',
      'Painting Techniques',
      'Sculpture',
      'Art History',
      'Perspective Drawing',
      'Still Life',
      'Portraits',
      'Landscape Art',
      'Digital Art',
    ],
    'Statistics': [
      'Data Collection',
      'Data Presentation',
      'Measures of Central Tendency',
      'Measures of Dispersion',
      'Probability',
      'Distributions',
      'Hypothesis Testing',
      'Correlation and Regression',
      'Sampling',
      'Statistical Inference',
    ],
  };

  const assignmentTypes = [
    { id: 'problem-solving', name: 'Problem Solving', icon: '🧮', description: 'Math problems, equations, calculations' },
    { id: 'essay', name: 'Essay/Writing', icon: '✍️', description: 'Essays, compositions, creative writing' },
    { id: 'research', name: 'Research Project', icon: '🔬', description: 'Research assignments, projects' },
    { id: 'reading', name: 'Reading Assignment', icon: '📖', description: 'Book chapters, comprehension' },
    { id: 'worksheet', name: 'Worksheet', icon: '📝', description: 'Fill-in-the-blanks, exercises' },
    { id: 'lab', name: 'Lab Report', icon: '🧪', description: 'Science experiments, lab work' },
  ];

  const subjects = selectedClass ? (subjectsByClass[selectedClass] || []) : [];
  const topics = selectedSubject ? (topicsBySubject[selectedSubject] || []) : [];

  const handleStart = () => {
    if (selectedClass && selectedSubject && selectedTopic && selectedAssignmentType) {
      onStartHomework({
        class: selectedClass,
        subject: selectedSubject,
        topic: selectedTopic,
        assignmentType: selectedAssignmentType,
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Pencil className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl mb-4 dark:text-white">Homework Help</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Let's get your homework done together!
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 space-y-8">
          {/* Step 1: Select Class */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h3 className="text-xl dark:text-white">Step 1: Select Your Class</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose your current grade level</p>
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
                    setSelectedAssignmentType('');
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedClass === cls
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="text-sm dark:text-white">{cls}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Subject */}
          {selectedClass && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-xl dark:text-white">Step 2: Select Subject</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Which subject is your homework in?</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSelectedTopic('');
                      setSelectedAssignmentType('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedSubject === subject
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="dark:text-white">{subject}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Topic */}
          {selectedSubject && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl dark:text-white">Step 3: Select Topic</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">What topic is your homework about?</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setSelectedAssignmentType('');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedTopic === topic
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm dark:text-white">{topic}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Select Assignment Type */}
          {selectedTopic && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Pencil className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl dark:text-white">Step 4: Assignment Type</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">What kind of homework is it?</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {assignmentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedAssignmentType(type.id)}
                    className={`p-5 rounded-xl border-2 transition-all text-left ${
                      selectedAssignmentType === type.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <h4 className="mb-1 dark:text-white">{type.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Button */}
          {selectedAssignmentType && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl p-6">
                <h4 className="mb-3 dark:text-white">Homework Details</h4>
                <div className="grid md:grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Class:</span>
                    <span className="dark:text-white">{selectedClass}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                    <span className="dark:text-white">{selectedSubject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Topic:</span>
                    <span className="dark:text-white">{selectedTopic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="capitalize dark:text-white">{assignmentTypes.find(t => t.id === selectedAssignmentType)?.name}</span>
                  </div>
                </div>
                <button
                  onClick={handleStart}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl"
                >
                  <span className="text-lg">Start Homework Help</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
                {onAddTask && (
                  <div className="mt-4">
                    <AddToPlannerButton
                      subject={selectedSubject}
                      topic={selectedTopic}
                      onAddTask={(task) => {
                        onAddTask(task);
                        alert('Task added to your planner! View it by clicking the Planner button in the header.');
                      }}
                      isDark={isDark}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}