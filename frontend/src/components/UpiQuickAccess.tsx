import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowRight } from 'lucide-react';

interface UpiQuickAccessProps {
  onNavigateToUpi: () => void;
  className?: string;
}

export const UpiQuickAccess: React.FC<UpiQuickAccessProps> = ({ 
  onNavigateToUpi, 
  className = "" 
}) => {
  return (
    <div className={`bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-800/50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <CreditCard className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">UPI Integration</h3>
            <p className="text-sm text-gray-400">Manage your UPI payment handles</p>
          </div>
        </div>
        <Button
          onClick={onNavigateToUpi}
          variant="ghost"
          size="sm"
          className="text-blue-300 hover:text-blue-200 hover:bg-blue-900/30"
        >
          Manage
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};