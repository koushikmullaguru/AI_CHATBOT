import { useState } from 'react';
import { ClassConfig } from './TeacherClassSelector';
import { Calendar, Plus, Edit, Trash2, Check } from 'lucide-react';

interface CurriculumPlannerProps {
  classConfig: ClassConfig;
  onBack: () => void;
}

interface CurriculumUnit {
  id: string;
  title: string;
  duration: string;
  topics: string[];
  objectives: string[];
  assessments: string[];
}

export function CurriculumPlanner({ classConfig, onBack }: CurriculumPlannerProps) {
  const [units, setUnits] = useState<CurriculumUnit[]>([
    {
      id: '1',
      title: 'Introduction to Fundamentals',
      duration: '2 weeks',
      topics: ['Basic Concepts', 'Key Terminology', 'Historical Context'],
      objectives: ['Understand core principles', 'Define key terms', 'Appreciate historical development'],
      assessments: ['Quiz', 'Class Discussion', 'Short Essay'],
    },
    {
      id: '2',
      title: 'Core Principles',
      duration: '3 weeks',
      topics: ['Theory 1', 'Theory 2', 'Practical Applications'],
      objectives: ['Apply theoretical knowledge', 'Solve basic problems', 'Analyze examples'],
      assessments: ['Mid-term Exam', 'Project Presentation', 'Lab Work'],
    },
  ]);

  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnit, setNewUnit] = useState<Partial<CurriculumUnit>>({
    title: '',
    duration: '',
    topics: [],
    objectives: [],
    assessments: [],
  });

  const generateSuggestedPlan = () => {
    const suggestedUnits: CurriculumUnit[] = [
      {
        id: Date.now().toString(),
        title: 'Unit 1: Foundations',
        duration: '2 weeks',
        topics: ['Introduction', 'Basic Concepts', 'Terminology'],
        objectives: ['Understand fundamentals', 'Build strong foundation'],
        assessments: ['Formative Quiz', 'Class Participation'],
      },
      {
        id: (Date.now() + 1).toString(),
        title: 'Unit 2: Core Topics',
        duration: '4 weeks',
        topics: ['Main Concept 1', 'Main Concept 2', 'Applications'],
        objectives: ['Master core content', 'Apply to real situations'],
        assessments: ['Unit Test', 'Project Work'],
      },
      {
        id: (Date.now() + 2).toString(),
        title: 'Unit 3: Advanced Study',
        duration: '3 weeks',
        topics: ['Complex Problems', 'Critical Analysis', 'Research'],
        objectives: ['Develop higher-order thinking', 'Independent study'],
        assessments: ['Research Paper', 'Presentation'],
      },
      {
        id: (Date.now() + 3).toString(),
        title: 'Unit 4: Review & Assessment',
        duration: '2 weeks',
        topics: ['Comprehensive Review', 'Exam Preparation'],
        objectives: ['Consolidate learning', 'Prepare for final assessment'],
        assessments: ['Final Exam', 'Portfolio Review'],
      },
    ];
    
    setUnits(suggestedUnits);
  };

  const addUnit = () => {
    if (newUnit.title && newUnit.duration) {
      setUnits([...units, {
        id: Date.now().toString(),
        title: newUnit.title,
        duration: newUnit.duration,
        topics: newUnit.topics || [],
        objectives: newUnit.objectives || [],
        assessments: newUnit.assessments || [],
      }]);
      setNewUnit({ title: '', duration: '', topics: [], objectives: [], assessments: [] });
      setIsAddingUnit(false);
    }
  };

  const deleteUnit = (id: string) => {
    setUnits(units.filter(u => u.id !== id));
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

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl mb-1 dark:text-white">Curriculum Planner</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {classConfig.class} • {classConfig.subject}
              {classConfig.section && ` • Section ${classConfig.section}`}
            </p>
          </div>
          <button
            onClick={generateSuggestedPlan}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
          >
            Generate Plan
          </button>
        </div>

        {/* Curriculum Units */}
        <div className="space-y-4 mb-4">
          {units.map((unit, index) => (
            <div key={unit.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-sm">
                    <span className="text-purple-600 dark:text-purple-400">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="dark:text-white">{unit.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{unit.duration}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteUnit(unit.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="mb-2 dark:text-white text-xs">Topics</h4>
                  <ul className="space-y-1">
                    {unit.topics.map((topic, idx) => (
                      <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                        <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 dark:text-white text-xs">Objectives</h4>
                  <ul className="space-y-1">
                    {unit.objectives.map((objective, idx) => (
                      <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                        <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 dark:text-white text-xs">Assessments</h4>
                  <ul className="space-y-1">
                    {unit.assessments.map((assessment, idx) => (
                      <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                        <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{assessment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Unit */}
        {!isAddingUnit ? (
          <button
            onClick={() => setIsAddingUnit(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-500 dark:hover:text-purple-400 transition-all text-sm"
          >
            + Add Unit
          </button>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="mb-3 dark:text-white">New Unit</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newUnit.title}
                onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Unit title"
              />
              <input
                type="text"
                value={newUnit.duration}
                onChange={(e) => setNewUnit({ ...newUnit, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Duration"
              />
              <div className="flex gap-2">
                <button
                  onClick={addUnit}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddingUnit(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}