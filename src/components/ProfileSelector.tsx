import { useState } from 'react';
import { StudentProfile } from '../types';
import { Lock, LogOut, Plus, BarChart3 } from 'lucide-react';
import { Theme } from '../hooks/useTheme';
import { ParentDashboard } from './ParentDashboard';

interface ProfileSelectorProps {
  parentId: string;
  onSelectProfile: (profile: StudentProfile) => void;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function ProfileSelector({ onSelectProfile, onLogout, theme, onToggleTheme }: ProfileSelectorProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);

  // Mock student profiles
  const profiles: StudentProfile[] = [
    {
      id: 'st1',
      name: 'Emma Smith',
      grade: '8th Grade',
      avatar: '👧',
      pin: '1234',
    },
    {
      id: 'st2',
      name: 'Oliver Smith',
      grade: '6th Grade',
      avatar: '👦',
      pin: '5678',
    },
    {
      id: 'st3',
      name: 'Sophia Smith',
      grade: '10th Grade',
      avatar: '👩',
      pin: '9012',
    },
  ];

  const handleProfileClick = (profileId: string) => {
    setSelectedProfileId(profileId);
    setPin('');
    setError('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = profiles.find(p => p.id === selectedProfileId);
    
    if (profile && pin === profile.pin) {
      onSelectProfile(profile);
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
    setError('');
  };

  // Show dashboard
  if (showDashboard) {
    return (
      <ParentDashboard
        profiles={profiles}
        onSelectProfile={onSelectProfile}
        onClose={() => setShowDashboard(false)}
      />
    );
  }

  if (selectedProfileId) {
    const profile = profiles.find(p => p.id === selectedProfileId);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => setSelectedProfileId(null)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            ← Back to profiles
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{profile?.avatar}</div>
              <h2 className="text-2xl mb-1 dark:text-white">{profile?.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.grade}</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <label className="block text-sm mb-3 text-gray-700 dark:text-gray-300 text-center">
                  Enter PIN to continue
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl tracking-[1em] focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    maxLength={4}
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 text-center mt-2">{error}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  Demo: Emma-1234, Oliver-5678, Sophia-9012
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={pin.length !== 4}
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl mb-2 dark:text-white">Who&#39;s learning?</h1>
            <p className="text-gray-600 dark:text-gray-300">Select a student profile to continue</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDashboard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">View Insights</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleProfileClick(profile.id)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">
                {profile.avatar}
              </div>
              <h3 className="mb-1 dark:text-white">{profile.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.grade}</p>
              <div className="mt-4 flex items-center justify-center gap-1 text-gray-400">
                <Lock className="w-4 h-4" />
                <span className="text-xs">PIN Protected</span>
              </div>
            </button>
          ))}
          
          <button
            className="bg-white dark:bg-gray-800 bg-opacity-50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-500 transition-all duration-300 flex flex-col items-center justify-center group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
              <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">Add Student</p>
          </button>
        </div>
      </div>
    </div>
  );
}