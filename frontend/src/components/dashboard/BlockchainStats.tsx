import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Award, 
  Mail, 
  Loader2,
  Trophy,
  Star
} from 'lucide-react';
import { octasToApt } from '@/utils/contractUtils';

interface BlockchainStatsProps {
  transactionCount: string;
  totalVolume: string;
  loyaltyTier: string;
  activePaymentRequests: number;
  isLoading: boolean;
}

export const BlockchainStats: React.FC<BlockchainStatsProps> = ({
  transactionCount,
  totalVolume,
  loyaltyTier,
  activePaymentRequests,
  isLoading
}) => {
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'diamond':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'platinum':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'gold':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'silver':
        return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 'bronze':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'diamond':
      case 'platinum':
        return <Star className="h-4 w-4" />;
      case 'gold':
        return <Trophy className="h-4 w-4" />;
      case 'silver':
      case 'bronze':
        return <Award className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Blockchain Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const txCount = parseInt(transactionCount);
  const volume = octasToApt(totalVolume);

  return (
    <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp className="h-5 w-5 text-primary" />
          Blockchain Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Transaction Count */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Transactions</div>
            <div className="text-2xl font-bold text-foreground">{txCount}</div>
            <div className="text-xs text-muted-foreground">On-chain</div>
          </div>

          {/* Total Volume */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Total Volume</div>
            <div className="text-2xl font-bold text-foreground">{volume.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground">APT Transacted</div>
          </div>

          {/* Loyalty Tier */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Loyalty Tier</div>
            <Badge className={`${getTierColor(loyaltyTier)} text-base font-bold h-8 flex items-center gap-2`}>
              {getTierIcon(loyaltyTier)}
              {loyaltyTier}
            </Badge>
            <div className="text-xs text-muted-foreground">NFT Status</div>
          </div>

          {/* Active Requests */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Pending Requests</div>
            <div className="text-2xl font-bold text-foreground flex items-center gap-2">
              {activePaymentRequests}
              {activePaymentRequests > 0 && (
                <Mail className="h-5 w-5 text-primary animate-pulse" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">Payment Requests</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
