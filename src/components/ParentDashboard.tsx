import { useState } from 'react';
import { StudentProfile } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Target, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Brain,
  Award
} from 'lucide-react';

interface ParentDashboardProps {
  profiles: StudentProfile[];
  onSelectProfile: (profile: StudentProfile) => void;
  onClose: () => void;
}

interface StudySession {
  subject: string;
  mode: string;
  duration: number;
  date: string;
  performance: number;
}

interface StudentInsight {
  studentId: string;
  totalStudyTime: number;
  sessionsCompleted: number;
  averagePerformance: number;
  strengths: string[];
  needsImprovement: string[];
  recentSessions: StudySession[];
  weeklyProgress: { day: string; hours: number }[];
  upcomingTasks: { task: string; subject: string; dueDate: string }[];
}

export function ParentDashboard({ profiles, onSelectProfile, onClose }: ParentDashboardProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Mock insights data - in real app, this would come from backend
  const insights: Record<string, StudentInsight> = {
    'st1': {
      studentId: 'st1',
      totalStudyTime: 12.5,
      sessionsCompleted: 24,
      averagePerformance: 85,
      strengths: ['Mathematics', 'Science', 'Problem Solving'],
      needsImprovement: ['History', 'Essay Writing'],
      recentSessions: [
        { subject: 'Mathematics', mode: 'Quiz', duration: 45, date: 'Today', performance: 90 },
        { subject: 'Science', mode: 'Revision', duration: 30, date: 'Yesterday', performance: 88 },
        { subject: 'English', mode: 'Homework', duration: 60, date: '2 days ago', performance: 75 },
      ],
      weeklyProgress: [
        { day: 'Mon', hours: 2.5 },
        { day: 'Tue', hours: 1.8 },
        { day: 'Wed', hours: 2.2 },
        { day: 'Thu', hours: 1.5 },
        { day: 'Fri', hours: 2.0 },
        { day: 'Sat', hours: 1.5 },
        { day: 'Sun', hours: 1.0 },
      ],
      upcomingTasks: [
        { task: 'Algebra Quiz Preparation', subject: 'Mathematics', dueDate: 'Tomorrow' },
        { task: 'Science Project', subject: 'Biology', dueDate: 'Dec 15' },
        { task: 'History Essay', subject: 'History', dueDate: 'Dec 18' },
      ],
    },
    'st2': {
      studentId: 'st2',
      totalStudyTime: 8.2,
      sessionsCompleted: 15,
      averagePerformance: 78,
      strengths: ['Art', 'English', 'Creative Writing'],
      needsImprovement: ['Mathematics', 'Physics'],
      recentSessions: [
        { subject: 'English', mode: 'Discussion', duration: 40, date: 'Today', performance: 82 },
        { subject: 'Mathematics', mode: 'Exam Prep', duration: 50, date: 'Yesterday', performance: 70 },
      ],
      weeklyProgress: [
        { day: 'Mon', hours: 1.5 },
        { day: 'Tue', hours: 1.2 },
        { day: 'Wed', hours: 1.8 },
        { day: 'Thu', hours: 1.0 },
        { day: 'Fri', hours: 1.5 },
        { day: 'Sat', hours: 0.8 },
        { day: 'Sun', hours: 0.4 },
      ],
      upcomingTasks: [
        { task: 'Math Practice Problems', subject: 'Mathematics', dueDate: 'Tomorrow' },
        { task: 'Poetry Analysis', subject: 'English', dueDate: 'Dec 14' },
      ],
    },
    'st3': {
      studentId: 'st3',
      totalStudyTime: 15.8,
      sessionsCompleted: 32,
      averagePerformance: 92,
      strengths: ['Physics', 'Chemistry', 'Mathematics', 'Critical Thinking'],
      needsImprovement: ['Time Management'],
      recentSessions: [
        { subject: 'Physics', mode: 'Exam Prep', duration: 90, date: 'Today', performance: 95 },
        { subject: 'Chemistry', mode: 'Quiz', duration: 45, date: 'Today', performance: 92 },
        { subject: 'Mathematics', mode: 'Problem Solving', duration: 60, date: 'Yesterday', performance: 90 },
      ],
      weeklyProgress: [
        { day: 'Mon', hours: 2.8 },
        { day: 'Tue', hours: 2.5 },
        { day: 'Wed', hours: 2.2 },
        { day: 'Thu', hours: 2.0 },
        { day: 'Fri', hours: 2.5 },
        { day: 'Sat', hours: 2.0 },
        { day: 'Sun', hours: 1.8 },
      ],
      upcomingTasks: [
        { task: 'Physics Board Exam', subject: 'Physics', dueDate: 'Dec 20' },
        { task: 'Chemistry Lab Report', subject: 'Chemistry', dueDate: 'Dec 16' },
        { task: 'Calculus Assignment', subject: 'Mathematics', dueDate: 'Dec 17' },
      ],
    },
  };

  const getRecommendations = (insight: StudentInsight): string[] => {
    const recommendations: string[] = [];
    
    if (insight.averagePerformance < 75) {
      recommendations.push('Schedule more practice sessions to improve overall performance');
    }
    
    if (insight.needsImprovement.length > 0) {
      recommendations.push(`Focus on ${insight.needsImprovement[0]} with targeted revision sessions`);
    }
    
    const avgHours = insight.weeklyProgress.reduce((sum, day) => sum + day.hours, 0) / 7;
    if (avgHours < 1.5) {
      recommendations.push('Increase daily study time to at least 2 hours for better results');
    }
    
    if (insight.upcomingTasks.length > 0) {
      recommendations.push(`Prioritize upcoming task: ${insight.upcomingTasks[0].task}`);
    }
    
    recommendations.push('Use quiz mode to test understanding before exams');
    
    return recommendations;
  };

  const student = selectedStudent ? profiles.find(p => p.id === selectedStudent) : null;
  const studentInsight = selectedStudent ? insights[selectedStudent] : null;

  if (!selectedStudent || !student || !studentInsight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl mb-2 dark:text-white">Parent Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Monitor your children's learning progress</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Continue to Chat
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {profiles.map((profile) => {
              const insight = insights[profile.id];
              return (
                <button
                  key={profile.id}
                  onClick={() => setSelectedStudent(profile.id)}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-5xl">{profile.avatar}</div>
                      <div>
                        <h3 className="text-xl dark:text-white">{profile.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{profile.grade}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                      <div className="text-2xl text-blue-600 dark:text-blue-400">{insight?.totalStudyTime}h</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">This Week</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                      <div className="text-2xl text-green-600 dark:text-green-400">{insight?.averagePerformance}%</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Avg Score</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const recommendations = getRecommendations(studentInsight);
  const maxHours = Math.max(...studentInsight.weeklyProgress.map(d => d.hours));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-4xl dark:text-white">{student.name}'s Progress</h1>
              <p className="text-gray-600 dark:text-gray-300">{student.grade} • Detailed Insights</p>
            </div>
          </div>
          <button
            onClick={() => onSelectProfile(student)}
            className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Start Learning Session
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-3xl dark:text-white">{studentInsight.totalStudyTime}h</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Study Time</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-3xl dark:text-white">{studentInsight.averagePerformance}%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Avg Performance</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-3xl dark:text-white">{studentInsight.sessionsCompleted}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Sessions</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-3xl dark:text-white">{studentInsight.upcomingTasks.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Upcoming Tasks</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Weekly Progress Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-2xl dark:text-white">Weekly Study Activity</h2>
              </div>
              <div className="flex items-end justify-between gap-4 h-48">
                {studentInsight.weeklyProgress.map((day) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg relative" style={{ height: '100%' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all"
                        style={{ height: `${(day.hours / maxHours) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{day.day}</div>
                    <div className="text-sm dark:text-white">{day.hours}h</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-2xl">AI-Powered Recommendations</h2>
              </div>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 bg-white/10 rounded-lg p-4">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-2xl dark:text-white">Recent Study Sessions</h2>
              </div>
              <div className="space-y-3">
                {studentInsight.recentSessions.map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        session.performance >= 85 ? 'bg-green-100 dark:bg-green-900/30' :
                        session.performance >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <BookOpen className={`w-6 h-6 ${
                          session.performance >= 85 ? 'text-green-600 dark:text-green-400' :
                          session.performance >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="dark:text-white">{session.subject}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{session.mode} • {session.duration} min • {session.date}</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${
                      session.performance >= 85 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      session.performance >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {session.performance}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Strengths */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h2 className="text-xl dark:text-white">Strengths</h2>
              </div>
              <div className="space-y-2">
                {studentInsight.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm dark:text-white">{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Improvement */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                <h2 className="text-xl dark:text-white">Focus Areas</h2>
              </div>
              <div className="space-y-2">
                {studentInsight.needsImprovement.map((area, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm dark:text-white">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Planner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl dark:text-white">Study Planner</h2>
              </div>
              <div className="space-y-3">
                {studentInsight.upcomingTasks.map((task, index) => (
                  <div key={index} className="p-3 border-l-4 border-indigo-500 bg-gray-50 dark:bg-gray-700 rounded">
                    <h4 className="text-sm dark:text-white mb-1">{task.task}</h4>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{task.subject}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                + Add New Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
