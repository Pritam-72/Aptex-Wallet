import React, { useEffect, useState } from 'react';
import UserDemoDashboard from '@/components/UserDemoDashboard';
import HowItWorksSection from '@/components/HowItWorksSection';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { WelcomeBackDialog } from '@/components/ui/welcome-back-dialog';

const UserPage: React.FC = () => {
  const { user } = useAuth();
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setShowWelcomeDialog(true);
    }
  }, [user]);

  // Handle initial hash scroll
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500); // Give time for the page to fully render
    }
  }, []);

  return (
    <div className="min-h-screen">
      <UserDemoDashboard />
      <HowItWorksSection />
      <Footer />
      <WelcomeBackDialog
        isOpen={showWelcomeDialog}
        onOpenChange={setShowWelcomeDialog}
        dashboardPath="/user-dashboard"
      />
    </div>
  );
};

export default UserPage;
