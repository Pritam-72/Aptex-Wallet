import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileImage, Download, Eye } from 'lucide-react';
import { InvoicePreviewModal } from '@/components/InvoicePreviewModal';
import { InvoiceData, downloadInvoice } from '@/utils/invoiceGenerator';
import { useToast } from '@/hooks/use-toast';

const InvoiceDemoPage: React.FC = () => {
  const [invoiceModal, setInvoiceModal] = useState<{
    isOpen: boolean;
    transaction: InvoiceData | null;
  }>({
    isOpen: false,
    transaction: null
  });

  const { toast } = useToast();

  // Sample transaction data for demo
  const sampleTransactions: InvoiceData[] = [
    {
      transactionHash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
      from: "0x742d35Cc6664C02c05B9d7Dd2b4b6e47E74F1B7A",
      to: "0x8ba1f109551bD432803012645Hac136c22c2C3B0",
      amount: "2.5",
      type: "sent" as const,
      timestamp: new Date(),
      status: "confirmed" as const
    },
    {
      transactionHash: "0x9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba",
      from: "0x123f456789abcdef123456789abcdef123456789a",
      to: "0x742d35Cc6664C02c05B9d7Dd2b4b6e47E74F1B7A",
      amount: "5.75",
      type: "received" as const,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: "confirmed" as const
    },
    {
      transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      from: "0x742d35Cc6664C02c05B9d7Dd2b4b6e47E74F1B7A",
      to: "0xdeadbeef12345678901234567890123456789012",
      amount: "0.1",
      type: "sent" as const,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      status: "confirmed" as const
    }
  ];

  const handlePreviewInvoice = (transaction: InvoiceData) => {
    setInvoiceModal({
      isOpen: true,
      transaction: transaction
    });
  };

  const handleQuickDownload = async (transaction: InvoiceData) => {
    try {
      const success = await downloadInvoice(transaction);
      
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

  const closeInvoiceModal = () => {
    setInvoiceModal({
      isOpen: false,
      transaction: null
    });
  };

  return (
    <div className="min-h-screen cosmic-glow bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Invoice NFT Demo</h1>
            <p className="text-muted-foreground">
              Generate NFT-style invoices for your Aptos transactions
            </p>
          </div>

          <div className="grid gap-6">
            {sampleTransactions.map((transaction, index) => (
              <Card key={index} className="bg-card/50 border-border/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'sent' 
                          ? 'bg-red-500/10 text-red-500' 
                          : 'bg-green-500/10 text-green-500'
                      }`}>
                        {transaction.type === 'sent' ? '↗️' : '↙️'}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-foreground">
                          {transaction.amount} APT
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {transaction.type} Transaction
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-foreground">
                        {transaction.timestamp.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          {transaction.type === 'sent' ? 'To:' : 'From:'}
                        </div>
                        <div className="font-mono text-xs text-foreground bg-muted/10 p-2 rounded border border-border/30">
                          {transaction.type === 'sent' 
                            ? `${transaction.to.slice(0, 25)}...${transaction.to.slice(-10)}`
                            : `${transaction.from.slice(0, 25)}...${transaction.from.slice(-10)}`
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Transaction Hash:</div>
                        <div className="font-mono text-xs text-foreground bg-muted/10 p-2 rounded border border-border/30">
                          {transaction.transactionHash.slice(0, 20)}...{transaction.transactionHash.slice(-15)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                      <Button
                        onClick={() => handlePreviewInvoice(transaction)}
                        variant="outline"
                        className="flex-1 hover:bg-blue-600/10 hover:border-blue-600/20 hover:text-blue-400"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Invoice NFT
                      </Button>
                      <Button
                        onClick={() => handleQuickDownload(transaction)}
                        variant="outline"
                        className="flex-1 hover:bg-green-600/10 hover:border-green-600/20 hover:text-green-400"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Quick Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-card/30 border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                About Invoice NFTs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Invoice NFTs are unique, downloadable certificates for your transactions that include:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Transaction hash and verification details</li>
                  <li>Sender and recipient addresses</li>
                  <li>Amount and timestamp information</li>
                  <li>NFT-style artistic design with cosmic elements</li>
                  <li>High-resolution 800x800px PNG format</li>
                </ul>
                <p className="pt-2">
                  These invoices can serve as proof of payment and are perfect for record-keeping or sharing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {invoiceModal.transaction && (
        <InvoicePreviewModal
          isOpen={invoiceModal.isOpen}
          onClose={closeInvoiceModal}
          transaction={invoiceModal.transaction}
        />
      )}
    </div>
  );
};

export default InvoiceDemoPage;