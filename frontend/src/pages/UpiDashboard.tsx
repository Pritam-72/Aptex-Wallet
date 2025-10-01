import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertTriangle, Wallet, Activity } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { getUserStats, getPaymentRequest, octasToApt, UserStats } from '@/utils/contractUtils';
import { getAccountBalance } from '@/utils/walletUtils';
import { BlockchainStats } from '@/components/dashboard/BlockchainStats';

export const UpiDashboard: React.FC = () => {
  const { address } = useWallet();
  const [balance, setBalance] = useState<string>('0.0');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activePaymentRequests, setActivePaymentRequests] = useState(0);
  const [loyaltyTier, setLoyaltyTier] = useState<string>('None');

  const loadBlockchainData = useCallback(async (walletAddress: string) => {
    setStatsLoading(true);
    try {
      // Get balance
      const accountBalance = await getAccountBalance(walletAddress);
      setBalance(accountBalance);

      // Fetch user stats from blockchain
      const stats = await getUserStats(walletAddress);
      setUserStats(stats);

      if (stats) {
        // Calculate loyalty tier based on transaction count
        const txCount = parseInt(stats.transaction_count);
        let tier = 'None';
        if (txCount >= 100) tier = 'Diamond';
        else if (txCount >= 50) tier = 'Platinum';
        else if (txCount >= 20) tier = 'Gold';
        else if (txCount >= 10) tier = 'Silver';
        else if (txCount >= 1) tier = 'Bronze';
        setLoyaltyTier(tier);
      } else {
        setLoyaltyTier('None');
      }

      // Count active payment requests (incoming) - OPTIMIZED
      let activeCount = 0;
      let consecutiveNotFound = 0;
      const MAX_CONSECUTIVE_NOT_FOUND = 3;
      
      for (let i = 0; i < 20; i++) { // Reduced from 50 to 20
        try {
          const request = await getPaymentRequest(i);
          if (request) {
            consecutiveNotFound = 0;
            if (request.to_address === walletAddress && request.status === 0) {
              activeCount++;
            }
          } else {
            consecutiveNotFound++;
            if (consecutiveNotFound >= MAX_CONSECUTIVE_NOT_FOUND) {
              break;
            }
          }
        } catch (error) {
          consecutiveNotFound++;
          if (consecutiveNotFound >= MAX_CONSECUTIVE_NOT_FOUND) {
            break;
          }
        }
      }
      setActivePaymentRequests(activeCount);

    } catch (error) {
      console.error('Error loading blockchain data:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      loadBlockchainData(address);
    }
  }, [address, loadBlockchainData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Wallet Overview Card */}
      {address && (
        <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Wallet Overview</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {parseFloat(balance).toFixed(4)} APT
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Blockchain Statistics */}
      {address && (
        <BlockchainStats
          transactionCount={userStats?.transaction_count || '0'}
          totalVolume={userStats?.total_amount_transacted || '0'}
          loyaltyTier={loyaltyTier}
          activePaymentRequests={activePaymentRequests}
          isLoading={statsLoading}
        />
      )}

      {/* UPI Feature Card */}
      <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-2xl">UPI Integration</CardTitle>
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

      {/* Quick Stats */}
      {address && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Chain Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats ? parseInt(userStats.transaction_count) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total transactions recorded
              </p>
            </CardContent>
          </Card>

          <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Status</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loyaltyTier}</div>
              <p className="text-xs text-muted-foreground">
                Current tier level
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Not Connected State */}
      {!address && (
        <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-12">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No Wallet Connected</p>
              <p className="text-sm">Please connect your wallet to view the UPI dashboard</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
