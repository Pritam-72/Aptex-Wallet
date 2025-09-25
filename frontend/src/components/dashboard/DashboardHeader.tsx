import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, QrCode, Plus, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  activeSection: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentAccount: any;
  user: any;
  onShowReceiveQR: () => void;
  onAddWallet: () => void;
  onLogout: () => void;
  addWalletLoading: boolean;
}

const getPageDescription = (section: string) => {
  const descriptions: { [key: string]: string } = {
    wallet: 'Manage your digital assets and wallet settings',
    transactions: 'View and track your transaction history',
    portfolio: 'Monitor your investment performance',
    security: 'Configure security settings and preferences',
    overview: 'Dashboard overview and analytics'
  };
  return descriptions[section] || 'Dashboard';
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeSection,
  sidebarOpen,
  setSidebarOpen,
  currentAccount,
  user,
  onShowReceiveQR,
  onAddWallet,
  onLogout,
  addWalletLoading
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hover:bg-muted/50 cosmic-glow"
          title={`${sidebarOpen ? 'Close' : 'Open'} sidebar (⌘B)`}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-foreground">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {getPageDescription(activeSection)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {currentAccount && (
          <>
            <Button
              variant="outline"
              onClick={onShowReceiveQR}
              className="flex items-center gap-2 border-border hover:bg-muted/50 cosmic-glow"
            >
              <QrCode className="h-4 w-4" />
              Receive
            </Button>
            <Button
              variant="outline"
              onClick={onAddWallet}
              className="flex items-center gap-2 border-border hover:bg-muted/50 cosmic-glow"
              disabled={addWalletLoading}
            >
              <Plus className="h-4 w-4" />
              Add Wallet
            </Button>
          </>
        )}
        
        {/* User Menu */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};