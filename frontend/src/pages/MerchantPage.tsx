import React, { useEffect, useState } from 'react';
import MerchantDemoDashboard from '@/components/MerchantDemoDashboard';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { WelcomeBackDialog } from '@/components/ui/welcome-back-dialog';

const MerchantPage: React.FC = () => {
  const { user } = useAuth();
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setShowWelcomeDialog(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-black">
      <MerchantDemoDashboard />
      {/* Add more merchant-specific sections as needed */}
      <Footer />
      <WelcomeBackDialog
        isOpen={showWelcomeDialog}
        onOpenChange={setShowWelcomeDialog}
        dashboardPath="/merchant-dashboard"
      />
    </div>
  );
};

export default MerchantPage;
