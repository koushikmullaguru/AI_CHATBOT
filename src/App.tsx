import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ProfileSelector } from './components/ProfileSelector';
import { ChatInterface } from './components/ChatInterface';
import { User, StudentProfile } from './types';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      
      // If parent, show profile selector
      if (user.userType === 'parent') {
        setShowProfileSelector(true);
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Show profile selector for parents
    if (user.userType === 'parent') {
      setShowProfileSelector(true);
    }
  };

  const handleProfileSelect = (profile: StudentProfile) => {
    setSelectedProfile(profile);
    setShowProfileSelector(false);
  };

  const handleSwitchProfile = () => {
    setShowProfileSelector(true);
    setSelectedProfile(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProfile(null);
    setShowProfileSelector(false);
    localStorage.removeItem('currentUser');
  };

  // Not logged in
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
  }

  // Parent needs to select profile
  if (currentUser.userType === 'parent' && showProfileSelector) {
    return (
      <ProfileSelector
        parentId={currentUser.id}
        onSelectProfile={handleProfileSelect}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Show chat interface
  return (
    <ChatInterface
      user={currentUser}
      selectedProfile={selectedProfile}
      onSwitchProfile={currentUser.userType === 'parent' ? handleSwitchProfile : undefined}
      onLogout={handleLogout}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}