import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import WalletOnboarding from '@/components/WalletOnboarding';
import WalletUnlock from '@/components/WalletUnlock';

const WalletAuthPage: React.FC = () => {
  const { hasWallet, createWallet } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(!hasWallet);

  const handleWalletCreated = async (walletData: any) => {
    try {
      await createWallet(walletData);
      // User will be automatically redirected by the authentication flow
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  const handleCreateNew = () => {
    setShowOnboarding(true);
  };

  if (showOnboarding || !hasWallet) {
    return <WalletOnboarding onComplete={handleWalletCreated} />;
  }

  return <WalletUnlock onCreateNew={handleCreateNew} />;
};

export default WalletAuthPage;