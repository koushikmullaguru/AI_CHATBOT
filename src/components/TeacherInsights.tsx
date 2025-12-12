import { useState } from 'react';
import { BarChart3, Users, GraduationCap, TrendingUp, BookOpen, Award, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { StudentPerformanceReport } from './StudentPerformanceReport';

interface TeacherInsightsProps {
  teacherRole: 'subject-teacher' | 'class-head' | 'principal';
  teacherSubject?: string;
  teacherClass?: string;
  onBack: () => void;
}

export function TeacherInsights({ teacherRole, teacherSubject, teacherClass, onBack }: TeacherInsightsProps) {
  const [selectedView, setSelectedView] = useState<'class' | 'section' | 'student'>('class');
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubject, setSelectedSubject] = useState(teacherSubject || 'Mathematics');
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; name: string; rollNo: string } | null>(null);

  const classes = ['6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D'];
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography'];

  // Mock data - Class Level Performance
  const classPerformance = [
    { class: '6', avgScore: 78, students: 120, passRate: 92 },
    { class: '7', avgScore: 75, students: 115, passRate: 89 },
    { class: '8', avgScore: 72, students: 110, passRate: 85 },
    { class: '9', avgScore: 70, students: 105, passRate: 83 },
    { class: '10', avgScore: 68, students: 100, passRate: 80 },
    { class: '11', avgScore: 65, students: 80, passRate: 78 },
    { class: '12', avgScore: 71, students: 75, passRate: 82 },
  ];

  // Mock data - Section Level Performance
  const sectionPerformance = [
    { section: 'A', avgScore: 72, students: 25, attendance: 95, assignments: 88 },
    { section: 'B', avgScore: 68, students: 25, attendance: 92, assignments: 85 },
    { section: 'C', avgScore: 65, students: 25, attendance: 90, assignments: 82 },
    { section: 'D', avgScore: 63, students: 25, attendance: 88, assignments: 80 },
  ];

  // Mock data - Student Level Performance
  const studentPerformance = [
    { id: 1, name: 'Aarav Sharma', rollNo: '001', avgScore: 85, attendance: 96, assignments: 92, rank: 1, status: 'excellent' },
    { id: 2, name: 'Diya Patel', rollNo: '002', avgScore: 82, attendance: 94, assignments: 90, rank: 2, status: 'excellent' },
    { id: 3, name: 'Arjun Kumar', rollNo: '003', avgScore: 78, attendance: 92, assignments: 88, rank: 3, status: 'good' },
    { id: 4, name: 'Ananya Singh', rollNo: '004', avgScore: 75, attendance: 90, assignments: 85, rank: 4, status: 'good' },
    { id: 5, name: 'Vihaan Mehta', rollNo: '005', avgScore: 72, attendance: 88, assignments: 82, rank: 5, status: 'good' },
    { id: 6, name: 'Isha Gupta', rollNo: '006', avgScore: 68, attendance: 85, assignments: 78, rank: 6, status: 'average' },
    { id: 7, name: 'Aditya Reddy', rollNo: '007', avgScore: 65, attendance: 82, assignments: 75, rank: 7, status: 'average' },
    { id: 8, name: 'Saanvi Joshi', rollNo: '008', avgScore: 58, attendance: 78, assignments: 70, rank: 8, status: 'needs-attention' },
    { id: 9, name: 'Kabir Nair', rollNo: '009', avgScore: 55, attendance: 75, assignments: 68, rank: 9, status: 'needs-attention' },
    { id: 10, name: 'Myra Shah', rollNo: '010', avgScore: 50, attendance: 72, assignments: 65, rank: 10, status: 'needs-attention' },
  ];

  // Subject-wise performance for multi-subject view
  const subjectPerformance = [
    { subject: 'Mathematics', avgScore: 72, passRate: 85, students: 100 },
    { subject: 'Physics', avgScore: 68, passRate: 82, students: 100 },
    { subject: 'Chemistry', avgScore: 70, passScore: 83, students: 100 },
    { subject: 'Biology', avgScore: 75, passRate: 88, students: 100 },
    { subject: 'English', avgScore: 78, passRate: 90, students: 100 },
    { subject: 'History', avgScore: 73, passRate: 86, students: 100 },
    { subject: 'Geography', avgScore: 71, passRate: 84, students: 100 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'good': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      case 'average': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'needs-attention': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (score >= 60) return <TrendingUp className="w-4 h-4 text-blue-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  if (selectedStudent) {
    return (
      <StudentPerformanceReport
        studentId={selectedStudent.id}
        studentName={selectedStudent.name}
        rollNo={selectedStudent.rollNo}
        classInfo={`Class ${selectedClass}, Section ${selectedSection}`}
        subject={selectedSubject}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm"
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl mb-2 dark:text-white">Performance Insights</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {teacherRole === 'principal' && 'Complete school overview across all subjects and students'}
            {teacherRole === 'class-head' && `Class ${teacherClass} - All subjects overview`}
            {teacherRole === 'subject-teacher' && `${teacherSubject} - Subject specific insights`}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* View Toggle */}
            <div>
              <label className="block text-xs mb-2 dark:text-gray-300">View Level</label>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="class">Class Level</option>
                <option value="section">Section Level</option>
                <option value="student">Student Level</option>
              </select>
            </div>

            {/* Class Filter */}
            {(selectedView === 'class' && teacherRole === 'principal') && (
              <div>
                <label className="block text-xs mb-2 dark:text-gray-300">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              </div>
            )}

            {(selectedView === 'section' || selectedView === 'student') && (
              <div>
                <label className="block text-xs mb-2 dark:text-gray-300">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={teacherRole === 'subject-teacher'}
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject Filter - Show in all views */}
            <div>
              <label className="block text-xs mb-2 dark:text-gray-300">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={teacherRole === 'subject-teacher' && selectedView !== 'class'}
              >
                {teacherRole === 'principal' && selectedView === 'class' && <option value="all">All Subjects</option>}
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Section Filter - Show only in student view */}
            {selectedView === 'student' && (
              <div>
                <label className="block text-xs mb-2 dark:text-gray-300">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {sections.map(section => (
                    <option key={section} value={section}>Section {section}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-2xl mb-1">
              {selectedView === 'class' ? '700' : selectedView === 'section' ? '100' : '25'}
            </p>
            <p className="text-xs opacity-90">Total Students</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-2xl mb-1">72.5%</p>
            <p className="text-xs opacity-90">Average Score</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-2xl mb-1">85%</p>
            <p className="text-xs opacity-90">Pass Rate</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-2xl mb-1">91%</p>
            <p className="text-xs opacity-90">Attendance</p>
          </div>
        </div>

        {/* Main Content Area */}
        {selectedView === 'class' && teacherRole === 'principal' && selectedSubject === 'all' ? (
          /* Subject-wise Overview for Principal */
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg mb-4 dark:text-white">Subject-wise Performance Overview</h2>
            <div className="space-y-3">
              {subjectPerformance.map((subject) => (
                <div key={subject.subject} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      <h3 className="dark:text-white">{subject.subject}</h3>
                    </div>
                    {getPerformanceIcon(subject.avgScore)}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Average Score</p>
                      <p className="dark:text-white">{subject.avgScore}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pass Rate</p>
                      <p className="dark:text-white">{subject.passRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
                      <p className="dark:text-white">{subject.students}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${subject.avgScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : selectedView === 'class' ? (
          /* Class Level Performance */
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg mb-4 dark:text-white">
              Class-wise Performance - {teacherRole === 'principal' ? 'All Classes' : selectedSubject}
            </h2>
            <div className="space-y-3">
              {classPerformance.map((cls) => (
                <div key={cls.class} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="dark:text-white">Class {cls.class}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      cls.avgScore >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      cls.avgScore >= 65 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {cls.avgScore >= 75 ? 'Excellent' : cls.avgScore >= 65 ? 'Good' : 'Needs Focus'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
                      <p className="text-lg dark:text-white">{cls.avgScore}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pass Rate</p>
                      <p className="text-lg dark:text-white">{cls.passRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
                      <p className="text-lg dark:text-white">{cls.students}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        cls.avgScore >= 75 ? 'bg-green-500' :
                        cls.avgScore >= 65 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${cls.avgScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : selectedView === 'section' ? (
          /* Section Level Performance */
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg mb-4 dark:text-white">
              Section-wise Performance - Class {selectedClass} - {selectedSubject}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {sectionPerformance.map((section) => (
                <div key={section.section} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg dark:text-white">Section {section.section}</h3>
                    {getPerformanceIcon(section.avgScore)}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Average Score</span>
                        <span className="dark:text-white">{section.avgScore}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${section.avgScore}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Attendance</span>
                        <span className="dark:text-white">{section.attendance}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${section.attendance}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Assignment Completion</span>
                        <span className="dark:text-white">{section.assignments}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${section.assignments}%` }} />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Students</p>
                      <p className="text-lg dark:text-white">{section.students}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Student Level Performance */
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg mb-4 dark:text-white">
              Student Performance - Class {selectedClass}, Section {selectedSection} - {selectedSubject}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-sm dark:text-gray-300">Rank</th>
                    <th className="text-left py-3 px-2 text-sm dark:text-gray-300">Roll No</th>
                    <th className="text-left py-3 px-2 text-sm dark:text-gray-300">Student Name</th>
                    <th className="text-left py-3 px-2 text-sm dark:text-gray-300">Avg Score</th>
                    <th className="text-left py-3 px-2 text-sm dark:text-gray-300">Attendance</th>
                    <th className="text-left py-3 px-2 text-sm dark:text-gray-300">Assignments</th>
                    <th className="text-left py-3 px-2 text-sm dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-2 text-sm dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentPerformance.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-2 text-sm">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          student.rank <= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {student.rank}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm dark:text-gray-300">{student.rollNo}</td>
                      <td className="py-3 px-2 text-sm dark:text-white">{student.name}</td>
                      <td className="py-3 px-2 text-sm">
                        <div className="flex items-center gap-2">
                          {getPerformanceIcon(student.avgScore)}
                          <span className="dark:text-white">{student.avgScore}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm dark:text-gray-300">{student.attendance}%</td>
                      <td className="py-3 px-2 text-sm dark:text-gray-300">{student.assignments}%</td>
                      <td className="py-3 px-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(student.status)}`}>
                          {student.status === 'excellent' ? 'Excellent' :
                           student.status === 'good' ? 'Good' :
                           student.status === 'average' ? 'Average' :
                           'Needs Attention'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg mb-3 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            AI Recommendations
          </h3>
          <ul className="space-y-2 text-sm dark:text-gray-300">
            {selectedView === 'student' && (
              <>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>3 students need immediate attention - consider one-on-one sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Top performers can benefit from advanced challenges in Algebra</span>
                </li>
              </>
            )}
            {selectedView === 'section' && (
              <>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Section A shows strong performance - maintain current teaching methods</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>Section D attendance is below average - conduct parent meetings</span>
                </li>
              </>
            )}
            {selectedView === 'class' && (
              <>
                <li className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Class 6 performing exceptionally well - share best practices with other grades</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>Classes 11-12 need focused intervention in problem-solving skills</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}