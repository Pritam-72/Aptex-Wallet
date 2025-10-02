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
  Medal,
  FileImage,
  Download,
  Hash,
  User,
  CreditCard,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  getUserStats,
  octasToApt,
  UserStats as ContractUserStats
} from '@/utils/contractUtils';

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
  tierNumber: number; // 0-4
  transactionCount: number;
  totalAmountTransacted: string; // in APT
  name: string;
  description: string;
  imageUrl: string;
  attributes: string[];
}

interface InvoiceNFT {
  id: string;
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  type: 'sent' | 'received';
  timestamp: Date;
  status: 'confirmed';
  generatedAt: Date;
  invoiceImageUrl?: string;
}

interface CollectablesSectionProps {
  userAddress: string;
  refreshTrigger?: number; // Add refresh trigger to reload NFTs when transactions happen
}

export const CollectablesSection: React.FC<CollectablesSectionProps> = ({ userAddress, refreshTrigger }) => {
  const [offerNFTs, setOfferNFTs] = useState<OfferNFT[]>([]);
  const [loyaltyNFTs, setLoyaltyNFTs] = useState<LoyaltyNFT[]>([]);
  const [invoiceNFTs, setInvoiceNFTs] = useState<InvoiceNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const { toast } = useToast();

  // Helper function to determine loyalty tier from transaction count
  const getLoyaltyTier = (txCount: number): { tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond', tierNumber: number } => {
    if (txCount >= 100) return { tier: 'diamond', tierNumber: 4 };
    if (txCount >= 50) return { tier: 'platinum', tierNumber: 3 };
    if (txCount >= 20) return { tier: 'gold', tierNumber: 2 };
    if (txCount >= 10) return { tier: 'silver', tierNumber: 1 };
    return { tier: 'bronze', tierNumber: 0 };
  };

  // Helper function to get tier attributes
  const getTierAttributes = (tier: string, txCount: number, totalAmount: string): string[] => {
    const baseAttributes = [
      `${txCount} Transactions`,
      `${totalAmount} APT Total Volume`,
      `Tier: ${tier.charAt(0).toUpperCase() + tier.slice(1)}`
    ];

    switch (tier) {
      case 'diamond':
        return [...baseAttributes, 'Elite Member', 'Max Benefits', '20% Bonus Rewards'];
      case 'platinum':
        return [...baseAttributes, 'Premium Member', '15% Bonus Rewards', 'Priority Support'];
      case 'gold':
        return [...baseAttributes, 'Gold Member', '10% Bonus Rewards'];
      case 'silver':
        return [...baseAttributes, 'Silver Member', '5% Bonus Rewards'];
      default:
        return [...baseAttributes, 'Bronze Member', 'Standard Benefits'];
    }
  };

  // Load NFTs from blockchain and localStorage
  useEffect(() => {
    if (userAddress) {
      void loadNFTs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, refreshTrigger]); // Also reload when refreshTrigger changes (after transactions)

  const loadNFTs = async () => {
    try {
      setLoading(true);
      
      // Load Loyalty NFT from blockchain
      await loadLoyaltyNFT();

      // Load Offer/Coupon NFTs from localStorage (for now)
      const storedOfferNFTs = localStorage.getItem(`offer_nfts_${userAddress}`);
      if (storedOfferNFTs) {
        setOfferNFTs(JSON.parse(storedOfferNFTs));
      }

      // Load Invoice NFTs from transaction history
      loadInvoiceNFTs();
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast({
        title: "Error Loading NFTs",
        description: "Failed to load your collectables. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load Loyalty NFT from blockchain based on user stats
  const loadLoyaltyNFT = async () => {
    setLoadingLoyalty(true);
    try {
      const stats = await getUserStats(userAddress);
      
      console.log('📊 Loaded user stats:', stats);
      
      if (stats) {
        const txCount = parseInt(stats.total_transactions);
        const totalAmount = '0.0000'; // Contract doesn't track total amount anymore
        const { tier, tierNumber } = getLoyaltyTier(txCount);

        // Only create loyalty NFT if user has made transactions
        if (txCount > 0) {
          const loyaltyNFT: LoyaltyNFT = {
            id: `loyalty-${userAddress}`,
            tier,
            tierNumber,
            transactionCount: txCount,
            totalAmountTransacted: totalAmount,
            name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Loyalty Badge`,
            description: `Earned through ${txCount} transactions with ${totalAmount} APT total volume. This NFT represents your loyalty and activity on the platform.`,
            imageUrl: `/nft-images/${tier}.png`, // Placeholder
            attributes: getTierAttributes(tier, txCount, totalAmount)
          };

          setLoyaltyNFTs([loyaltyNFT]);
        } else {
          setLoyaltyNFTs([]);
        }
      } else {
        // No stats found, user hasn't registered or made transactions
        setLoyaltyNFTs([]);
      }
    } catch (error) {
      console.error('Error loading loyalty NFT:', error);
      setLoyaltyNFTs([]);
    } finally {
      setLoadingLoyalty(false);
    }
  };

  // Load Invoice NFTs from transaction history
  const loadInvoiceNFTs = () => {
    try {
      // Get the current wallet's public key to access transaction history
      const walletData = localStorage.getItem('cryptal_wallet');
      if (walletData) {
        const parsedData = JSON.parse(walletData);
        const currentIndex = parsedData.currentAccountIndex || 0;
        const publicKey = parsedData.accounts?.[currentIndex]?.publicKey;
        
        if (publicKey) {
          const storedTransactions = localStorage.getItem(`transactions_${publicKey}`);
          if (storedTransactions) {
            const transactions = JSON.parse(storedTransactions);
            
            // Convert transactions to Invoice NFTs
            interface StoredTransaction {
              txHash?: string;
              from: string;
              to: string;
              aptosAmount?: string;
              ethAmount?: string;
              type: string;
              timestamp: string;
            }
            
            const invoices: InvoiceNFT[] = transactions.map((tx: StoredTransaction, index: number) => ({
              id: `invoice-${tx.txHash || Date.now()}-${index}`,
              transactionHash: tx.txHash || `mock-${Date.now()}-${index}`,
              from: tx.from,
              to: tx.to,
              amount: tx.aptosAmount || tx.ethAmount || '0',
              type: tx.type,
              timestamp: new Date(tx.timestamp),
              status: 'confirmed' as const,
              generatedAt: new Date(tx.timestamp)
            })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first
            
            setInvoiceNFTs(invoices);
          }
        }
      }
    } catch (error) {
      console.error('Error loading invoice NFTs:', error);
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

  // Handle invoice NFT download
  const handleDownloadInvoice = async (invoice: InvoiceNFT) => {
    try {
      // Import the invoice generator functions
      const { downloadInvoice } = await import('@/utils/invoiceGenerator');
      
      const invoiceData = {
        transactionHash: invoice.transactionHash,
        from: invoice.from,
        to: invoice.to,
        amount: invoice.amount,
        type: invoice.type,
        timestamp: invoice.timestamp,
        status: invoice.status
      };

      const success = await downloadInvoice(invoiceData);
      
      if (success) {
        toast({
          title: "Invoice Downloaded! 📄",
          description: "Your transaction invoice NFT has been saved to your device.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Download Error",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  // Handle invoice NFT preview
  const handlePreviewInvoice = async (invoice: InvoiceNFT) => {
    try {
      // Import the invoice generator functions
      const { previewInvoice } = await import('@/utils/invoiceGenerator');
      
      const invoiceData = {
        transactionHash: invoice.transactionHash,
        from: invoice.from,
        to: invoice.to,
        amount: invoice.amount,
        type: invoice.type,
        timestamp: invoice.timestamp,
        status: invoice.status
      };

      const imageDataURL = await previewInvoice(invoiceData);
      
      // Open preview in new tab
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Invoice NFT Preview</title></head>
            <body style="margin:0;padding:20px;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
              <img src="${imageDataURL}" alt="Invoice NFT" style="max-width:100%;height:auto;border:1px solid #333;border-radius:8px;" />
            </body>
          </html>
        `);
      }
      
      toast({
        title: "Invoice Preview Opened! 👀",
        description: "Your invoice NFT preview has been opened in a new tab.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error previewing invoice:', error);
      toast({
        title: "Preview Error",
        description: "Failed to preview invoice. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    }
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
        <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-border/50">
          <TabsTrigger value="offers" className="data-[state=active]:bg-muted/30 data-[state=active]:text-foreground">
            <Gift className="h-4 w-4 mr-2" />
            Offers ({offerNFTs.length})
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="data-[state=active]:bg-muted/30 data-[state=active]:text-foreground">
            <Crown className="h-4 w-4 mr-2" />
            Loyalty ({loyaltyNFTs.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-muted/30 data-[state=active]:text-foreground">
            <FileImage className="h-4 w-4 mr-2" />
            Invoices ({invoiceNFTs.length})
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
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadLoyaltyNFT()}
              disabled={loadingLoyalty}
              className="gap-2"
            >
              {loadingLoyalty ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          {loadingLoyalty ? (
            <Card className="bg-card/50 border-border/50 cosmic-glow">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading your loyalty status from blockchain...</p>
              </CardContent>
            </Card>
          ) : loyaltyNFTs.length === 0 ? (
            <Card className="bg-card/50 border-border/50 cosmic-glow">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Crown className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Loyalty NFTs Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Complete your first transaction to unlock a loyalty NFT and showcase your wallet activity!
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
                    <div className="text-xs text-muted-foreground">20+ transactions</div>
                  </div>
                  <div className="space-y-2">
                    <Star className="h-6 w-6 text-muted-foreground mx-auto" />
                    <div className="text-xs text-foreground">Platinum</div>
                    <div className="text-xs text-muted-foreground">50+ transactions</div>
                  </div>
                  <div className="space-y-2">
                    <Gem className="h-6 w-6 text-muted-foreground mx-auto" />
                    <div className="text-xs text-foreground">Diamond</div>
                    <div className="text-xs text-muted-foreground">100+ transactions</div>
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
                            <Award className="h-3 w-3" />
                            <span>Total Volume: {nft.totalAmountTransacted} APT</span>
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

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {invoiceNFTs.length === 0 ? (
            <Card className="bg-card/50 border-border/50 cosmic-glow">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Invoice NFTs Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Make transactions to generate unique invoice NFTs that can be downloaded as proof of payment.
                </p>
                <div className="mt-6 space-y-2 text-center">
                  <div className="text-xs text-muted-foreground">
                    • Each transaction creates a unique NFT-style invoice
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • Download as high-resolution PNG images
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • Perfect for record-keeping and proof of payment
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {invoiceNFTs.map((invoice, index) => {
                const isRecent = new Date().getTime() - invoice.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
                
                return (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-card/50 border-border/50 hover:bg-card/70 transition-all duration-300 cosmic-glow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              invoice.type === 'sent' 
                                ? 'bg-muted/20 text-muted-foreground' 
                                : 'bg-muted/30 text-foreground'
                            }`}>
                              {invoice.type === 'sent' ? '↗️' : '↙️'}
                            </div>
                            <div>
                              <CardTitle className="text-sm text-foreground">
                                Invoice #{invoice.id.split('-').pop()?.slice(-4)}
                              </CardTitle>
                              <CardDescription className="text-xs text-muted-foreground capitalize">
                                {invoice.type} Transaction
                              </CardDescription>
                            </div>
                          </div>
                          {isRecent && (
                            <Badge className="bg-muted/20 text-foreground border border-border/30 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Amount Display */}
                        <div className="text-center py-3 bg-muted/10 rounded-lg border border-border/30">
                          <div className="text-xl font-bold text-foreground flex items-center justify-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {parseFloat(invoice.amount).toFixed(4)} APT
                          </div>
                          <p className="text-muted-foreground text-xs mt-1">Transaction Amount</p>
                        </div>

                        {/* Transaction Details */}
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Hash className="h-3 w-3" />
                              <span>Transaction Hash</span>
                            </div>
                            <div className="font-mono text-xs text-foreground bg-muted/10 p-2 rounded border border-border/30">
                              {invoice.transactionHash.slice(0, 15)}...{invoice.transactionHash.slice(-10)}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{invoice.type === 'sent' ? 'To' : 'From'}</span>
                            </div>
                            <div className="font-mono text-xs text-foreground bg-muted/10 p-2 rounded border border-border/30">
                              {invoice.type === 'sent' 
                                ? `${invoice.to.slice(0, 15)}...${invoice.to.slice(-10)}`
                                : `${invoice.from.slice(0, 15)}...${invoice.from.slice(-10)}`
                              }
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Generated: {formatDate(invoice.generatedAt.toISOString())}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                          <Button
                            onClick={() => handlePreviewInvoice(invoice)}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs hover:bg-blue-600/10 hover:border-blue-600/20 hover:text-blue-400"
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            Preview
                          </Button>
                          <Button
                            onClick={() => handleDownloadInvoice(invoice)}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs hover:bg-green-600/10 hover:border-green-600/20 hover:text-green-400"
                          >
                            <Download className="h-3 w-3 mr-2" />
                            Download
                          </Button>
                        </div>

                        {/* NFT Badge */}
                        <div className="bg-muted/10 p-2 rounded-lg border border-border/30">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <FileImage className="h-3 w-3" />
                            <span>NFT Certificate</span>
                          </div>
                          <p className="text-xs text-foreground">
                            Unique digital invoice with transaction verification
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