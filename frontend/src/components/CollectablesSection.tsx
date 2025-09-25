import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gift, 
  Star, 
  Trophy, 
  Award, 
  Crown,
  Gem,
  ExternalLink,
  Calendar,
  Percent,
  Building,
  Clock,
  Sparkles,
  Medal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface OfferNFT {
  id: string;
  companyName: string;
  companyLogo: string;
  discountPercentage: number;
  productLink: string;
  description: string;
  expiryDate: string;
  isRedeemed: boolean;
  mintedAt: string;
  category: string;
}

interface LoyaltyNFT {
  id: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  transactionCount: number;
  mintedAt: string;
  name: string;
  description: string;
  imageUrl: string;
  attributes: string[];
}

interface CollectablesSectionProps {
  userAddress: string;
}

export const CollectablesSection: React.FC<CollectablesSectionProps> = ({ userAddress }) => {
  const [offerNFTs, setOfferNFTs] = useState<OfferNFT[]>([]);
  const [loyaltyNFTs, setLoyaltyNFTs] = useState<LoyaltyNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load NFTs from localStorage
  useEffect(() => {
    if (userAddress) {
      loadNFTs();
    }
  }, [userAddress]);

  const loadNFTs = () => {
    try {
      // Load Offer NFTs
      const storedOfferNFTs = localStorage.getItem(`offer_nfts_${userAddress}`);
      if (storedOfferNFTs) {
        setOfferNFTs(JSON.parse(storedOfferNFTs));
      }

      // Load Loyalty NFTs
      const storedLoyaltyNFTs = localStorage.getItem(`loyalty_nfts_${userAddress}`);
      if (storedLoyaltyNFTs) {
        setLoyaltyNFTs(JSON.parse(storedLoyaltyNFTs));
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
    }
  };

  // Get tier icon and styling (monochrome)
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return { icon: Medal, color: 'text-muted-foreground', bgColor: 'bg-muted/10', borderColor: 'border-border/30' };
      case 'silver':
        return { icon: Award, color: 'text-muted-foreground', bgColor: 'bg-muted/10', borderColor: 'border-border/30' };
      case 'gold':
        return { icon: Trophy, color: 'text-foreground', bgColor: 'bg-muted/20', borderColor: 'border-border/50' };
      case 'platinum':
        return { icon: Star, color: 'text-foreground', bgColor: 'bg-muted/20', borderColor: 'border-border/50' };
      case 'diamond':
        return { icon: Gem, color: 'text-foreground', bgColor: 'bg-muted/30', borderColor: 'border-border/70' };
      default:
        return { icon: Medal, color: 'text-muted-foreground', bgColor: 'bg-muted/10', borderColor: 'border-border/30' };
    }
  };

  // Handle offer NFT redemption
  const handleRedeemOffer = (nftId: string, productLink: string) => {
    // Mark as redeemed
    const updatedOfferNFTs = offerNFTs.map(nft => 
      nft.id === nftId ? { ...nft, isRedeemed: true } : nft
    );
    setOfferNFTs(updatedOfferNFTs);
    localStorage.setItem(`offer_nfts_${userAddress}`, JSON.stringify(updatedOfferNFTs));

    // Open product link
    window.open(productLink, '_blank');

    toast({
      title: "Offer Redeemed! 🎉",
      description: "You've successfully redeemed this offer. Enjoy your discount!",
      duration: 5000,
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if offer is expired
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
            Collectables
          </h1>
          <p className="text-muted-foreground mt-1">Your NFT collection and rewards</p>
        </div>
      </div>

      <Tabs defaultValue="offers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card/50 border border-border/50">
          <TabsTrigger value="offers" className="data-[state=active]:bg-muted/30 data-[state=active]:text-foreground">
            <Gift className="h-4 w-4 mr-2" />
            Offers ({offerNFTs.length})
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="data-[state=active]:bg-muted/30 data-[state=active]:text-foreground">
            <Crown className="h-4 w-4 mr-2" />
            Loyalty ({loyaltyNFTs.length})
          </TabsTrigger>
        </TabsList>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-4">
          {offerNFTs.length === 0 ? (
            <Card className="bg-card/50 border-border/50 cosmic-glow">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Offer NFTs Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Make transactions to have a chance of receiving exclusive offer NFTs from partner companies!
                </p>
                <div className="mt-4 text-sm text-muted-foreground">
                  🎲 40% chance per transaction
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offerNFTs.map((nft, index) => (
                <motion.div
                  key={nft.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={`bg-card/50 border-border/50 hover:border-border/80 transition-all duration-300 cosmic-glow ${
                    nft.isRedeemed ? 'opacity-75' : ''
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted/30 rounded-full flex items-center justify-center">
                            <Building className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-medium text-foreground">
                              {nft.companyName}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">{nft.category}</p>
                          </div>
                        </div>
                        <Badge className={`${
                          nft.isRedeemed ? 'bg-muted/50 text-muted-foreground' : 
                          isExpired(nft.expiryDate) ? 'bg-muted/30 text-muted-foreground' : 
                          'bg-muted/20 text-foreground'
                        } border border-border/30`}>
                          {nft.isRedeemed ? 'Redeemed' : 
                           isExpired(nft.expiryDate) ? 'Expired' : 'Active'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center py-4 bg-muted/10 rounded-lg border border-border/30">
                        <div className="text-3xl font-bold text-foreground flex items-center justify-center gap-1">
                          <Percent className="h-6 w-6" />
                          {nft.discountPercentage}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">Discount</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-foreground">{nft.description}</p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Expires: {formatDate(nft.expiryDate)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Minted: {formatDate(nft.mintedAt)}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleRedeemOffer(nft.id, nft.productLink)}
                        disabled={nft.isRedeemed || isExpired(nft.expiryDate)}
                        className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {nft.isRedeemed ? (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            Already Redeemed
                          </>
                        ) : isExpired(nft.expiryDate) ? (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Expired
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Redeem Offer
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Loyalty Tab */}
        <TabsContent value="loyalty" className="space-y-4">
          {loyaltyNFTs.length === 0 ? (
            <Card className="bg-card/50 border-border/50 cosmic-glow">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Crown className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Loyalty NFTs Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Complete more transactions to unlock loyalty NFTs and showcase your wallet activity!
                </p>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div className="space-y-2">
                    <Medal className="h-6 w-6 text-muted-foreground mx-auto" />
                    <div className="text-xs text-foreground">Bronze</div>
                    <div className="text-xs text-muted-foreground">1+ transactions</div>
                  </div>
                  <div className="space-y-2">
                    <Award className="h-6 w-6 text-muted-foreground mx-auto" />
                    <div className="text-xs text-foreground">Silver</div>
                    <div className="text-xs text-muted-foreground">10+ transactions</div>
                  </div>
                  <div className="space-y-2">
                    <Trophy className="h-6 w-6 text-muted-foreground mx-auto" />
                    <div className="text-xs text-foreground">Gold</div>
                    <div className="text-xs text-muted-foreground">50+ transactions</div>
                  </div>
                  <div className="space-y-2">
                    <Star className="h-6 w-6 text-muted-foreground mx-auto" />
                    <div className="text-xs text-foreground">Platinum</div>
                    <div className="text-xs text-muted-foreground">100+ transactions</div>
                  </div>
                  <div className="space-y-2">
                    <Gem className="h-6 w-6 text-muted-foreground mx-auto" />
                    <div className="text-xs text-foreground">Diamond</div>
                    <div className="text-xs text-muted-foreground">250+ transactions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loyaltyNFTs.map((nft, index) => {
                const tierInfo = getTierInfo(nft.tier);
                const TierIcon = tierInfo.icon;
                
                return (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={`bg-card/50 border-border/50 hover:border-border/80 transition-all duration-300 cosmic-glow`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 ${tierInfo.bgColor} rounded-full flex items-center justify-center border ${tierInfo.borderColor}`}>
                              <TierIcon className={`h-6 w-6 ${tierInfo.color}`} />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-medium text-foreground">
                                {nft.name}
                              </CardTitle>
                              <p className={`text-xs text-muted-foreground capitalize font-medium`}>
                                {nft.tier} Tier
                              </p>
                            </div>
                          </div>
                          <Badge className={`${tierInfo.bgColor} text-muted-foreground border ${tierInfo.borderColor}`}>
                            NFT
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className={`text-center py-4 ${tierInfo.bgColor} rounded-lg border ${tierInfo.borderColor}`}>
                          <div className={`text-2xl font-bold ${tierInfo.color} flex items-center justify-center gap-2`}>
                            <TierIcon className="h-5 w-5" />
                            {nft.transactionCount}
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">Transactions</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm text-foreground">{nft.description}</p>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Minted: {formatDate(nft.mintedAt)}</span>
                          </div>
                        </div>

                        {nft.attributes.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Attributes:</p>
                            <div className="flex flex-wrap gap-1">
                              {nft.attributes.map((attribute, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="text-xs border-border/30 text-muted-foreground"
                                >
                                  {attribute}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className={`p-3 ${tierInfo.bgColor} rounded-lg border ${tierInfo.borderColor}`}>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Sparkles className="h-3 w-3" />
                            <span>Loyalty Reward</span>
                          </div>
                          <p className={`text-sm ${tierInfo.color} font-medium`}>
                            Exclusive {nft.tier} member benefits
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};