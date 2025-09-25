import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, X, FileImage, Hash, Calendar, User, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InvoiceData, previewInvoice, downloadInvoice } from '@/utils/invoiceGenerator';
import { motion } from 'framer-motion';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: InvoiceData | null;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && transaction) {
      generatePreview();
    }
  }, [isOpen, transaction]);

  const generatePreview = async () => {
    if (!transaction) return;
    
    setIsGenerating(true);
    try {
      const imageDataURL = await previewInvoice(transaction);
      setPreviewImage(imageDataURL);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Preview Error",
        description: "Failed to generate invoice preview. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!transaction) return;
    
    setIsDownloading(true);
    try {
      const success = await downloadInvoice(transaction);
      if (success) {
        toast({
          title: "Invoice Downloaded! 📄",
          description: "Your transaction invoice NFT has been saved to your device.",
          duration: 4000,
        });
        onClose();
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Download Error",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-card/95 border-border/50 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl font-semibold flex items-center gap-2">
            <div className="h-10 w-10 bg-muted/20 rounded-full flex items-center justify-center">
              <FileImage className="h-5 w-5 text-foreground" />
            </div>
            Transaction Invoice NFT
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Preview and download your transaction as a unique NFT-style invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Amount</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{transaction.amount} APT</div>
              <Badge className={`${
                transaction.type === 'sent' 
                  ? 'bg-muted/20 text-muted-foreground' 
                  : 'bg-muted/30 text-foreground'
              } border border-border/30`}>
                {transaction.type === 'sent' ? 'Sent' : 'Received'}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Transaction Hash</span>
              </div>
              <div className="text-sm font-mono text-foreground bg-muted/10 p-2 rounded border border-border/30">
                {transaction.transactionHash.slice(0, 20)}...{transaction.transactionHash.slice(-15)}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{transaction.timestamp.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">From</span>
              </div>
              <div className="text-sm font-mono text-foreground bg-muted/10 p-2 rounded border border-border/30">
                {transaction.from.slice(0, 25)}...{transaction.from.slice(-10)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">To</span>
              </div>
              <div className="text-sm font-mono text-foreground bg-muted/10 p-2 rounded border border-border/30">
                {transaction.to.slice(0, 25)}...{transaction.to.slice(-10)}
              </div>
            </div>
          </div>

          {/* Invoice Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Invoice Preview</h3>
              <div className="text-xs text-muted-foreground">
                NFT Format • 800x800px • PNG
              </div>
            </div>
            
            <div className="bg-muted/5 border border-border/30 rounded-lg p-4 cosmic-glow">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-4"></div>
                  <p className="text-muted-foreground">Generating invoice NFT...</p>
                </div>
              ) : previewImage ? (
                <div className="flex justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative group"
                  >
                    <img
                      src={previewImage}
                      alt="Invoice NFT Preview"
                      className="max-w-full h-auto max-h-96 rounded-lg shadow-lg border border-border/30"
                    />
                    <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                      <div className="bg-background/90 px-3 py-1 rounded border border-border/50">
                        <span className="text-xs text-foreground">Click to expand</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Preview unavailable</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <div className="text-xs text-muted-foreground">
              This invoice NFT contains your transaction details and can be used as proof of payment.
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-border/50 hover:bg-muted/20"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button
                onClick={handleDownload}
                disabled={isDownloading || !previewImage}
                className="bg-foreground text-background hover:bg-foreground/90 font-medium"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice NFT
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};