import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift,
  Plus,
  Loader2,
  RefreshCw,
  Percent,
  Calendar,
  XCircle,
  CheckCircle,
  Users,
  Image as ImageIcon,
  Send
} from "lucide-react";
import { motion } from "framer-motion";
import {
  getCouponTemplate,
  createCouponTemplate,
  deactivateCouponTemplate,
  mintCouponNftToUser,
  octasToApt,
  aptToOctas,
  resolveRecipient,
  CouponTemplate,
} from '@/utils/contractUtils';
import { Account } from "@aptos-labs/ts-sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CompanyCouponSectionProps {
  companyAddress: string;
  account: Account | null;
}

export const CompanyCouponSection: React.FC<CompanyCouponSectionProps> = ({ companyAddress, account }) => {
  const [templates, setTemplates] = useState<CouponTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Create Template modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [validDays, setValidDays] = useState('30');
  const [imageUrl, setImageUrl] = useState('');

  // Mint NFT modal states
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CouponTemplate | null>(null);
  const [recipientInput, setRecipientInput] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [recipientType, setRecipientType] = useState<'address' | 'wallet_id' | 'upi_id' | null>(null);

  useEffect(() => {
    if (companyAddress) {
      void loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyAddress]);

  // Auto-resolve recipient
  useEffect(() => {
    const timer = setTimeout(() => {
      if (recipientInput.trim()) {
        void handleResolveRecipient();
      } else {
        setResolvedAddress(null);
        setRecipientType(null);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientInput]);

  const handleResolveRecipient = async () => {
    if (!recipientInput.trim()) return;

    setResolving(true);
    try {
      const result = await resolveRecipient(recipientInput.trim());
      if (result.address) {
        setResolvedAddress(result.address);
        // Convert camelCase to snake_case for state
        const normalizedType = result.type === 'walletId' ? 'wallet_id' : 
                               result.type === 'upiId' ? 'upi_id' : 
                               'address';
        setRecipientType(normalizedType);
      } else {
        setResolvedAddress(null);
        setRecipientType(null);
      }
    } catch (error) {
      console.error('Error resolving recipient:', error);
      setResolvedAddress(null);
      setRecipientType(null);
    } finally {
      setResolving(false);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Load template IDs created by this company
      const storedTemplateIds = localStorage.getItem(`company_coupons_${companyAddress}`);
      
      if (storedTemplateIds) {
        const templateIds: number[] = JSON.parse(storedTemplateIds);
        const loadedTemplates: CouponTemplate[] = [];

        for (const templateId of templateIds) {
          const template = await getCouponTemplate(templateId);
          if (template && template.company === companyAddress) {
            loadedTemplates.push(template);
          }
        }

        setTemplates(loadedTemplates);
      } else {
        // Try loading first 20 template IDs as fallback
        const loadedTemplates: CouponTemplate[] = [];
        for (let i = 0; i < 20; i++) {
          const template = await getCouponTemplate(i);
          if (template && template.company === companyAddress) {
            loadedTemplates.push(template);
          }
        }
        setTemplates(loadedTemplates);
      }
    } catch (error) {
      console.error('Error loading coupon templates:', error);
      toast({
        title: "Error Loading Templates",
        description: "Failed to load coupon templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!account) return;

    const discount = parseFloat(discountPercentage);
    const maxDiscount = parseFloat(maxDiscountAmount);
    const days = parseInt(validDays);

    if (!title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a coupon title.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Missing Description",
        description: "Please enter a description.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(discount) || discount < 1 || discount > 100) {
      toast({
        title: "Invalid Discount",
        description: "Please enter a discount percentage between 1 and 100.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(maxDiscount) || maxDiscount <= 0) {
      toast({
        title: "Invalid Max Discount",
        description: "Please enter a valid maximum discount amount.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(days) || days < 1 || days > 365) {
      toast({
        title: "Invalid Valid Days",
        description: "Please enter a valid number of days (1-365).",
        variant: "destructive",
      });
      return;
    }

    setProcessingId('creating');
    try {
      const maxDiscountOctas = aptToOctas(maxDiscount).toString();
      const image = imageUrl.trim() || '/coupon-placeholder.png';

      const result = await createCouponTemplate(
        account,
        title.trim(),
        description.trim(),
        discount,
        maxDiscountOctas,
        days,
        image
      );

      if (result.success) {
        toast({
          title: "Template Created! ✅",
          description: `Successfully created coupon template "${title}".`,
        });

        // Store the template ID
        const storedTemplateIds = localStorage.getItem(`company_coupons_${companyAddress}`);
        const templateIds: number[] = storedTemplateIds ? JSON.parse(storedTemplateIds) : [];
        const nextId = templates.length > 0 
          ? Math.max(...templates.map(t => parseInt(t.id))) + 1 
          : 0;
        templateIds.push(nextId);
        localStorage.setItem(`company_coupons_${companyAddress}`, JSON.stringify(templateIds));

        // Reset form
        setTitle('');
        setDescription('');
        setDiscountPercentage('');
        setMaxDiscountAmount('');
        setValidDays('30');
        setImageUrl('');
        setCreateModalOpen(false);

        await loadTemplates();
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create coupon template",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivate = async (template: CouponTemplate) => {
    if (!account) return;

    setProcessingId(template.id);
    try {
      const result = await deactivateCouponTemplate(account, parseInt(template.id));

      if (result.success) {
        toast({
          title: "Template Deactivated! ✅",
          description: `Successfully deactivated "${template.title}".`,
        });
        await loadTemplates();
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error('Error deactivating template:', error);
      toast({
        title: "Deactivation Failed",
        description: error instanceof Error ? error.message : "Failed to deactivate template",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleMintNft = async () => {
    if (!account || !selectedTemplate || !resolvedAddress) {
      toast({
        title: "Invalid Recipient",
        description: "Please enter a valid recipient address, wallet ID, or UPI ID.",
        variant: "destructive",
      });
      return;
    }

    setProcessingId('minting');
    try {
      const result = await mintCouponNftToUser(
        account,
        resolvedAddress,
        parseInt(selectedTemplate.id)
      );

      if (result.success) {
        toast({
          title: "Coupon NFT Minted! ✅",
          description: `Successfully sent "${selectedTemplate.title}" to user.`,
        });
        setRecipientInput('');
        setResolvedAddress(null);
        setRecipientType(null);
        setMintModalOpen(false);
        await loadTemplates();
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast({
        title: "Minting Failed",
        description: error instanceof Error ? error.message : "Failed to mint coupon NFT",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getRecipientTypeBadge = (type: 'address' | 'wallet_id' | 'upi_id' | null) => {
    if (!type) return null;
    
    const colors = {
      address: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      wallet_id: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      upi_id: 'bg-green-500/20 text-green-400 border-green-500/30',
    };

    const labels = {
      address: 'Address',
      wallet_id: 'Wallet ID',
      upi_id: 'UPI ID',
    };

    return (
      <Badge className={colors[type]}>
        {labels[type]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="h-6 w-6 text-muted-foreground" />
            Coupon Templates
          </h2>
          <p className="text-muted-foreground mt-1">Create and manage discount coupon NFTs</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Coupon Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template to mint discount coupon NFTs
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Coupon Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Summer Sale 2024"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the offer and terms..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Discount Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount Percentage (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="10"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Max Discount Amount (APT)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Valid Days */}
                <div className="space-y-2">
                  <Label htmlFor="validDays">Valid for (Days)</Label>
                  <Input
                    id="validDays"
                    type="number"
                    min="1"
                    max="365"
                    placeholder="30"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://example.com/coupon-image.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => void handleCreateTemplate()}
                  disabled={processingId === 'creating'}
                >
                  {processingId === 'creating' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create Template</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="icon"
            onClick={() => void loadTemplates()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold text-foreground">{templates.length}</p>
              </div>
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Templates</p>
                <p className="text-2xl font-bold text-foreground">
                  {templates.filter(t => t.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Minted</p>
                <p className="text-2xl font-bold text-foreground">
                  {templates.reduce((sum, t) => sum + parseInt(t.total_minted), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates List */}
      {loading && templates.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading coupon templates...</p>
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card className="bg-card/50 border-border/50 cosmic-glow">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Coupon Templates</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Create coupon templates to mint discount NFTs for your customers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template, index) => {
            const maxDiscount = octasToApt(template.max_discount_amount);
            const isProcessing = processingId === template.id;

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/50 border-border/50 cosmic-glow hover:border-primary/30 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          {template.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          template.is_active
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }
                      >
                        {template.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Discount Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Discount
                        </p>
                        <p className="text-foreground font-medium text-lg">
                          {template.discount_percentage}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Max Amount</p>
                        <p className="text-foreground font-medium text-lg">
                          {maxDiscount.toFixed(4)} APT
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-muted/20 rounded-lg">
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Valid Days
                        </p>
                        <p className="text-foreground font-medium">{template.valid_days}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Minted
                        </p>
                        <p className="text-foreground font-medium">{template.total_minted}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {template.is_active && (
                        <Dialog 
                          open={mintModalOpen && selectedTemplate?.id === template.id} 
                          onOpenChange={(open) => {
                            setMintModalOpen(open);
                            if (open) setSelectedTemplate(template);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              className="flex-1"
                              size="sm"
                              disabled={!account || isProcessing}
                            >
                              <Send className="h-3 w-3 mr-2" />
                              Mint to User
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Mint Coupon NFT</DialogTitle>
                              <DialogDescription>
                                Send this coupon to a user as an NFT
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="p-3 bg-muted/20 rounded-lg space-y-1">
                                <p className="text-sm font-medium text-foreground">{template.title}</p>
                                <p className="text-xs text-muted-foreground">{template.discount_percentage}% off</p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="recipient">User (Address / Wallet ID / UPI ID)</Label>
                                <Input
                                  id="recipient"
                                  placeholder="0x... or wallet_id or user@provider"
                                  value={recipientInput}
                                  onChange={(e) => setRecipientInput(e.target.value)}
                                />
                                {resolving && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Resolving...
                                  </p>
                                )}
                                {resolvedAddress && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs text-green-400">✓ Resolved</p>
                                      {getRecipientTypeBadge(recipientType)}
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono break-all">
                                      {resolvedAddress}
                                    </p>
                                  </div>
                                )}
                                {recipientInput && !resolving && !resolvedAddress && (
                                  <p className="text-xs text-red-400">✗ Invalid recipient</p>
                                )}
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => void handleMintNft()}
                                disabled={!resolvedAddress || processingId === 'minting'}
                              >
                                {processingId === 'minting' ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Minting...
                                  </>
                                ) : (
                                  <>Mint Coupon NFT</>
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {template.is_active && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeactivate(template)}
                          disabled={!account || isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
