
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Onboarding } from '../components/Onboarding';
import { Dashboard } from '../components/Dashboard';
import { Auth } from '../components/Auth';

const Index = () => {
  const { user, loading } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-metal-darker flex items-center justify-center">
        <div className="text-metal-chrome">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (showDashboard) {
    return <Dashboard />;
  }

  return <Onboarding onComplete={() => setShowDashboard(true)} />;
};

export default Index;
