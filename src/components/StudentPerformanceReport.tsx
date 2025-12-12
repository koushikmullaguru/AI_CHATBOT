import { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Award, AlertCircle, BookOpen, Calendar, BarChart3, Download, Mail } from 'lucide-react';

interface StudentPerformanceReportProps {
  studentId: number;
  studentName: string;
  rollNo: string;
  classInfo: string;
  subject: string;
  onBack: () => void;
}

export function StudentPerformanceReport({ studentId, studentName, rollNo, classInfo, subject, onBack }: StudentPerformanceReportProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'detailed' | 'recommendations'>('overview');

  // Mock student data
  const studentData = {
    name: studentName,
    rollNo: rollNo,
    class: classInfo,
    subject: subject,
    overallScore: 78,
    rank: 3,
    totalStudents: 25,
    attendance: 92,
    trend: 'improving', // improving, declining, stable
    
    // Performance by topic
    topicPerformance: [
      { topic: 'Algebra', score: 85, maxScore: 100, attempts: 12, lastAttempt: '2024-12-05', trend: 'up' },
      { topic: 'Geometry', score: 75, maxScore: 100, attempts: 10, lastAttempt: '2024-12-04', trend: 'stable' },
      { topic: 'Trigonometry', score: 82, maxScore: 100, attempts: 8, lastAttempt: '2024-12-03', trend: 'up' },
      { topic: 'Calculus', score: 65, maxScore: 100, attempts: 6, lastAttempt: '2024-12-02', trend: 'down' },
      { topic: 'Statistics', score: 88, maxScore: 100, attempts: 9, lastAttempt: '2024-12-01', trend: 'up' },
    ],

    // Monthly progress
    monthlyProgress: [
      { month: 'Jul', score: 65 },
      { month: 'Aug', score: 68 },
      { month: 'Sep', score: 72 },
      { month: 'Oct', score: 75 },
      { month: 'Nov', score: 76 },
      { month: 'Dec', score: 78 },
    ],

    // Assessment breakdown
    assessments: [
      { type: 'Quizzes', score: 82, total: 100, count: 15 },
      { type: 'Homework', score: 85, total: 100, count: 20 },
      { type: 'Exams', score: 72, total: 100, count: 3 },
      { type: 'Projects', score: 80, total: 100, count: 2 },
      { type: 'Class Participation', score: 88, total: 100, count: 25 },
    ],

    // Strengths and weaknesses
    strengths: [
      'Strong conceptual understanding in Algebra',
      'Excellent problem-solving skills in Statistics',
      'Consistent homework completion',
      'Active class participation',
      'Good time management in exams'
    ],
    
    weaknesses: [
      'Struggles with advanced Calculus concepts',
      'Needs more practice in word problems',
      'Occasional difficulty with complex multi-step problems',
      'Could improve speed in timed assessments'
    ],

    // Recent activities
    recentActivities: [
      { date: '2024-12-08', activity: 'Completed Algebra Quiz', score: 88, type: 'quiz' },
      { date: '2024-12-07', activity: 'Submitted Geometry Homework', score: 85, type: 'homework' },
      { date: '2024-12-06', activity: 'Mid-term Exam', score: 75, type: 'exam' },
      { date: '2024-12-05', activity: 'Trigonometry Practice Test', score: 90, type: 'practice' },
      { date: '2024-12-04', activity: 'Statistics Assignment', score: 92, type: 'homework' },
    ],

    // AI Insights
    aiInsights: {
      summary: `${studentName} is showing consistent improvement over the past 6 months, with a notable upward trend in overall performance. The student demonstrates strong aptitude in Algebra and Statistics, maintaining scores above 80%. However, there's a need for focused intervention in Calculus where performance has declined to 65%.`,
      
      learningPattern: 'Visual learner with strong analytical skills. Performs better with practice-based learning and real-world applications.',
      
      recommendations: [
        {
          priority: 'high',
          title: 'Calculus Intervention Required',
          description: 'Schedule one-on-one tutoring sessions to address conceptual gaps in Calculus. Focus on fundamental concepts before moving to advanced topics.',
          action: 'Assign remedial exercises and provide additional resources'
        },
        {
          priority: 'medium',
          title: 'Enhance Problem-Solving Speed',
          description: 'Practice timed exercises to improve speed without compromising accuracy. This will help in competitive exams.',
          action: 'Provide weekly timed practice tests'
        },
        {
          priority: 'low',
          title: 'Maintain Strong Performance',
          description: 'Continue encouraging excellence in Algebra and Statistics. Consider advanced challenges to keep the student engaged.',
          action: 'Assign enrichment problems and extension activities'
        }
      ],

      predictedGrade: 'A-',
      confidenceLevel: 85,
      
      comparisonToClass: {
        aboveAverage: ['Statistics', 'Algebra', 'Class Participation'],
        average: ['Geometry', 'Projects'],
        belowAverage: ['Calculus']
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Insights
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl mb-2 dark:text-white">Student Performance Report</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span><strong>Name:</strong> {studentData.name}</span>
                <span><strong>Roll No:</strong> {studentData.rollNo}</span>
                <span><strong>Class:</strong> {studentData.class}</span>
                <span><strong>Subject:</strong> {studentData.subject}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Report
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Overall Score</div>
            <div className="text-2xl mb-1 dark:text-white">{studentData.overallScore}%</div>
            <div className={`text-xs flex items-center gap-1 ${studentData.trend === 'improving' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
              <TrendingUp className="w-3 h-3" />
              {studentData.trend}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Class Rank</div>
            <div className="text-2xl mb-1 dark:text-white">#{studentData.rank}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">of {studentData.totalStudents}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Attendance</div>
            <div className="text-2xl mb-1 dark:text-white">{studentData.attendance}%</div>
            <div className="text-xs text-green-600 dark:text-green-400">Excellent</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Predicted Grade</div>
            <div className="text-2xl mb-1 dark:text-white">{studentData.aiInsights.predictedGrade}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{studentData.aiInsights.confidenceLevel}% confidence</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Assessments</div>
            <div className="text-2xl mb-1 dark:text-white">{studentData.assessments.reduce((acc, a) => acc + a.count, 0)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-2 text-sm transition-colors border-b-2 ${
              selectedTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('detailed')}
            className={`px-4 py-2 text-sm transition-colors border-b-2 ${
              selectedTab === 'detailed'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Detailed Analysis
          </button>
          <button
            onClick={() => setSelectedTab('recommendations')}
            className={`px-4 py-2 text-sm transition-colors border-b-2 ${
              selectedTab === 'recommendations'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            AI Recommendations
          </button>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* AI Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg mb-3 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                AI Performance Summary
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{studentData.aiInsights.summary}</p>
              <div className="text-sm">
                <strong className="text-gray-900 dark:text-white">Learning Pattern:</strong>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{studentData.aiInsights.learningPattern}</p>
              </div>
            </div>

            {/* Monthly Progress Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg mb-4 dark:text-white">6-Month Progress Trend</h3>
              <div className="flex items-end justify-between h-48 gap-2">
                {studentData.monthlyProgress.map((month, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{month.score}%</div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg relative" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg absolute bottom-0 transition-all"
                        style={{ height: `${month.score}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">{month.month}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg mb-4 dark:text-white">Performance by Topic</h3>
              <div className="space-y-3">
                {studentData.topicPerformance.map((topic, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="dark:text-white">{topic.topic}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {getTrendIcon(topic.trend)}
                        <span className={`text-lg ${getScoreColor(topic.score)}`}>{topic.score}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${topic.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{topic.attempts} attempts</span>
                      <span>Last: {topic.lastAttempt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg mb-4 dark:text-white">Assessment Type Breakdown</h3>
              <div className="space-y-3">
                {studentData.assessments.map((assessment, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="dark:text-white">{assessment.type} ({assessment.count})</span>
                      <span className={getScoreColor(assessment.score)}>{assessment.score}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                        style={{ width: `${assessment.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'detailed' && (
          <div className="space-y-6">
            {/* Strengths */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg mb-4 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-green-500" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {studentData.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span className="dark:text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg mb-4 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {studentData.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span className="dark:text-gray-300">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Comparison to Class Average */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg mb-4 dark:text-white">Comparison to Class Average</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Above Average</div>
                  <div className="space-y-1">
                    {studentData.aiInsights.comparisonToClass.aboveAverage.map((item, idx) => (
                      <div key={idx} className="text-sm text-green-600 dark:text-green-400">{item}</div>
                    ))}
                  </div>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">At Average</div>
                  <div className="space-y-1">
                    {studentData.aiInsights.comparisonToClass.average.map((item, idx) => (
                      <div key={idx} className="text-sm text-blue-600 dark:text-blue-400">{item}</div>
                    ))}
                  </div>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Below Average</div>
                  <div className="space-y-1">
                    {studentData.aiInsights.comparisonToClass.belowAverage.map((item, idx) => (
                      <div key={idx} className="text-sm text-red-600 dark:text-red-400">{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg mb-4 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Recent Activities
              </h3>
              <div className="space-y-2">
                {studentData.recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 w-20">{activity.date}</div>
                      <div className="text-sm dark:text-white">{activity.activity}</div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        activity.type === 'exam' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        activity.type === 'quiz' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {activity.type}
                      </span>
                    </div>
                    <div className={`text-sm ${getScoreColor(activity.score)}`}>{activity.score}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'recommendations' && (
          <div className="space-y-6">
            {studentData.aiInsights.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg dark:text-white">{rec.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs ${getPriorityColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{rec.description}</p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Recommended Action</div>
                  <div className="text-sm dark:text-white">{rec.action}</div>
                </div>
              </div>
            ))}

            {/* Study Plan Suggestion */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <h3 className="text-lg mb-3 dark:text-white">Suggested Weekly Study Plan</h3>
              <div className="grid md:grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{day}</div>
                    <div className="text-xs dark:text-white">
                      {idx < 5 ? 'Calculus\n30 min' : idx === 5 ? 'Practice\n60 min' : 'Review\n45 min'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
