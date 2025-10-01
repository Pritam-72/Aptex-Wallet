import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertTriangle } from 'lucide-react';

export const UpiDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-2xl">UPI Dashboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="bg-yellow-900/50 border-yellow-700">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-300">
              <strong>Feature Coming Soon</strong>
              <br />
              UPI ID mapping and directory features require a centralized backend or smart contract implementation.
              This feature was previously using localStorage mocking and has been disabled.
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center text-gray-400">
            <p className="mb-2">This feature will allow you to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Map your UPI ID to your wallet address</li>
              <li>Send money using UPI IDs instead of wallet addresses</li>
              <li>Search for other users by their UPI ID</li>
              <li>View global UPI directory statistics</li>
            </ul>
            <p className="mt-4 text-xs">
              Implementation requires: Backend API or Smart Contract for centralized registry
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
