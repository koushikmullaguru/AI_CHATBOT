import { useState } from 'react';
import { User, BookOpen, Award, TrendingUp, Calendar, Mail, Phone, MapPin, Edit2, Save, X, Star, Target, CheckCircle, GraduationCap } from 'lucide-react';
import { StudentProfile } from '../types';

interface StudentProfileScreenProps {
  profile: StudentProfile;
  onClose: () => void;
}

interface ReportCard {
  term: string;
  year: string;
  subjects: {
    name: string;
    grade: string;
    marks: number;
    outOf: number;
    percentage: number;
  }[];
  overall: {
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
    rank: number;
  };
}

export function StudentProfileScreen({ profile, onClose }: StudentProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInterests, setEditedInterests] = useState<string[]>([
    'Mathematics',
    'Science',
    'Reading',
    'Sports',
    'Art',
    'Music'
  ]);
  const [newInterest, setNewInterest] = useState('');

  // Mock student data - in real app, this would come from an API
  const studentData = {
    fullName: profile.name,
    class: profile.class,
    rollNumber: 'STU2024015',
    dateOfBirth: 'January 15, 2010',
    email: 'student@school.edu',
    phone: '+1 234-567-8900',
    address: '123 Education Street, Learning City, 12345',
    bloodGroup: 'O+',
    parentName: 'John Doe',
    parentEmail: 'parent@email.com',
    parentPhone: '+1 234-567-8901',
    admissionDate: 'April 1, 2018',
    section: 'A'
  };

  const reportCards: ReportCard[] = [
    {
      term: 'Final Term',
      year: '2024',
      subjects: [
        { name: 'Mathematics', grade: 'A+', marks: 95, outOf: 100, percentage: 95 },
        { name: 'Science', grade: 'A', marks: 88, outOf: 100, percentage: 88 },
        { name: 'English', grade: 'A+', marks: 92, outOf: 100, percentage: 92 },
        { name: 'Social Studies', grade: 'A', marks: 85, outOf: 100, percentage: 85 },
        { name: 'Computer Science', grade: 'A+', marks: 97, outOf: 100, percentage: 97 },
        { name: 'Physical Education', grade: 'A', marks: 90, outOf: 100, percentage: 90 }
      ],
      overall: {
        totalMarks: 600,
        obtainedMarks: 547,
        percentage: 91.17,
        grade: 'A+',
        rank: 3
      }
    },
    {
      term: 'Mid Term',
      year: '2024',
      subjects: [
        { name: 'Mathematics', grade: 'A', marks: 88, outOf: 100, percentage: 88 },
        { name: 'Science', grade: 'A', marks: 85, outOf: 100, percentage: 85 },
        { name: 'English', grade: 'A', marks: 90, outOf: 100, percentage: 90 },
        { name: 'Social Studies', grade: 'B+', marks: 82, outOf: 100, percentage: 82 },
        { name: 'Computer Science', grade: 'A+', marks: 95, outOf: 100, percentage: 95 },
        { name: 'Physical Education', grade: 'A', marks: 87, outOf: 100, percentage: 87 }
      ],
      overall: {
        totalMarks: 600,
        obtainedMarks: 527,
        percentage: 87.83,
        grade: 'A',
        rank: 5
      }
    },
    {
      term: 'Final Term',
      year: '2023',
      subjects: [
        { name: 'Mathematics', grade: 'A', marks: 90, outOf: 100, percentage: 90 },
        { name: 'Science', grade: 'A', marks: 86, outOf: 100, percentage: 86 },
        { name: 'English', grade: 'A', marks: 88, outOf: 100, percentage: 88 },
        { name: 'Social Studies', grade: 'A', marks: 84, outOf: 100, percentage: 84 },
        { name: 'Computer Science', grade: 'A+', marks: 94, outOf: 100, percentage: 94 },
        { name: 'Physical Education', grade: 'A', marks: 89, outOf: 100, percentage: 89 }
      ],
      overall: {
        totalMarks: 600,
        obtainedMarks: 531,
        percentage: 88.50,
        grade: 'A',
        rank: 4
      }
    }
  ];

  const achievements = [
    { title: 'Math Olympiad Winner', date: 'Nov 2024', icon: '🏆' },
    { title: 'Science Fair - First Prize', date: 'Oct 2024', icon: '🔬' },
    { title: 'Perfect Attendance', date: 'Sep 2024', icon: '🎯' },
    { title: 'Creative Writing Contest', date: 'Aug 2024', icon: '✍️' }
  ];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !editedInterests.includes(newInterest.trim())) {
      setEditedInterests([...editedInterests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setEditedInterests(editedInterests.filter(i => i !== interest));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl">
              {profile.avatar}
            </div>
            <div>
              <h2 className="text-3xl mb-2">{studentData.fullName}</h2>
              <div className="flex items-center gap-4 text-white/90">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  Class {studentData.class} - Section {studentData.section}
                </span>
                <span>Roll No: {studentData.rollNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Personal Info & Interests */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl mb-4 flex items-center gap-2 dark:text-white">
                  <User className="w-5 h-5 text-purple-500" />
                  Personal Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Date of Birth</p>
                    <p className="dark:text-white">{studentData.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Blood Group</p>
                    <p className="dark:text-white">{studentData.bloodGroup}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Admission Date</p>
                    <p className="dark:text-white">{studentData.admissionDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </p>
                    <p className="dark:text-white">{studentData.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone
                    </p>
                    <p className="dark:text-white">{studentData.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Address
                    </p>
                    <p className="dark:text-white">{studentData.address}</p>
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl mb-4 dark:text-white">Parent/Guardian</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Name</p>
                    <p className="dark:text-white">{studentData.parentName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Email</p>
                    <p className="dark:text-white">{studentData.parentEmail}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="dark:text-white">{studentData.parentPhone}</p>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl flex items-center gap-2 dark:text-white">
                    <Star className="w-5 h-5 text-purple-500" />
                    Interests & Hobbies
                  </h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {isEditing ? (
                      <Save className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Edit2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editedInterests.map((interest, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-purple-200 dark:border-purple-700"
                    >
                      <span className="dark:text-white">{interest}</span>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveInterest(interest)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                      placeholder="Add new interest..."
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleAddInterest}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6">
                <h3 className="text-xl mb-4 flex items-center gap-2 dark:text-white">
                  <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Recent Achievements
                </h3>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <p className="dark:text-white">{achievement.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{achievement.date}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Report Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-2xl mb-6 flex items-center gap-2 dark:text-white">
                  <BookOpen className="w-6 h-6 text-purple-500" />
                  Academic Report Cards
                </h3>

                {reportCards.map((report, reportIndex) => (
                  <div
                    key={reportIndex}
                    className="mb-6 last:mb-0 bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    {/* Report Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <h4 className="text-xl dark:text-white">{report.term} - {report.year}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Class {studentData.class} - Section {studentData.section}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl mb-1">
                          <span className={`${getGradeColor(report.overall.grade)}`}>
                            {report.overall.grade}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Overall Grade</p>
                      </div>
                    </div>

                    {/* Overall Statistics */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-1 dark:text-white">
                          {report.overall.percentage.toFixed(2)}%
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Percentage</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-1 dark:text-white">
                          {report.overall.obtainedMarks}/{report.overall.totalMarks}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Marks</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-1 dark:text-white">
                          #{report.overall.rank}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Class Rank</p>
                      </div>
                    </div>

                    {/* Subject-wise Performance */}
                    <div className="space-y-3">
                      <h5 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                        Subject-wise Performance
                      </h5>
                      {report.subjects.map((subject, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="dark:text-white">{subject.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {subject.marks}/{subject.outOf}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-sm ${getGradeColor(subject.grade)}`}>
                                    {subject.grade}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${getPercentageColor(subject.percentage)}`}
                                    style={{ width: `${subject.percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                                  {subject.percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Performance Insights */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <h6 className="mb-1 dark:text-white">Performance Insights</h6>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {report.overall.percentage >= 90
                              ? 'Outstanding performance! Keep up the excellent work.'
                              : report.overall.percentage >= 80
                              ? 'Great job! Consistent effort will help you reach the top.'
                              : 'Good progress. Focus on weak areas for better results.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}