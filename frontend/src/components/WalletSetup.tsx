import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Wallet, Shield, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface WalletSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const WalletSetup: React.FC<WalletSetupProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [walletData, setWalletData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey'>('mnemonic');
  const [showMnemonic, setShowMnemonic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = ['Secure Wallet', 'Confirm Phrase', 'Create Password', 'Complete'];

  const generateMockWallet = () => {
    // Mock wallet generation - replace with actual wallet generation
    const mockMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const mockAddress = '0x742d35Cc6663C0532d8c5E9C4267B53A0D7C9b1F';
    
    return {
      mnemonic: mockMnemonic,
      address: mockAddress,
      privateKey: '0x' + Math.random().toString(16).substr(2, 64)
    };
  };

  const handleGenerateWallet = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newWallet = generateMockWallet();
      setWalletData(newWallet);
      setStep(2);
    } catch (err) {
      setError('Failed to generate wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const value = importType === 'mnemonic' ? mnemonic : privateKey;
      
      if (!value) {
        throw new Error('Please enter a valid ' + importType);
      }
      
      // Mock import - replace with actual import logic
      const importedWallet = {
        mnemonic: importType === 'mnemonic' ? value : '',
        address: '0x' + Math.random().toString(16).substr(2, 40),
        privateKey: importType === 'privateKey' ? value : '0x' + Math.random().toString(16).substr(2, 64)
      };
      
      setWalletData(importedWallet);
      setStep(4); // Skip mnemonic confirmation for imported wallets
    } catch (err) {
      setError('Failed to import wallet. Please check your input.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWallet = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep(5);
    } catch (err) {
      setError('Failed to save wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetState = () => {
    setStep(1);
    setWalletData(null);
    setPassword('');
    setConfirmPassword('');
    setMnemonic('');
    setPrivateKey('');
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleComplete = () => {
    onComplete();
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Create Your Wallet
          </DialogTitle>
          <DialogDescription>
            Follow these steps to secure your new Aptos wallet.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center py-4">
          {steps.map((label, idx) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-2">
                <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold ${
                  step > idx + 1 ? 'bg-green-500 text-white' : 
                  step === idx + 1 ? 'bg-blue-500 text-white' : 
                  'bg-gray-200 text-gray-600'
                }`}>
                  {step > idx + 1 ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${step > idx + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-6">
          {/* Step 1: Choose action */}
          {step === 1 && (
            <div className="space-y-4">
              <Tabs defaultValue="generate">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="generate">Generate New</TabsTrigger>
                  <TabsTrigger value="import">Import</TabsTrigger>
                </TabsList>
                
                <TabsContent value="generate" className="space-y-4">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Generate a New Wallet</h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      Create a new secure wallet with a 12-word recovery phrase.
                    </p>
                    <Button 
                      onClick={handleGenerateWallet} 
                      className="w-full bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Generating...' : 'Generate Wallet'}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="import" className="space-y-4">
                  <Tabs value={importType} onValueChange={(v) => setImportType(v as 'mnemonic' | 'privateKey')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="mnemonic">Recovery Phrase</TabsTrigger>
                      <TabsTrigger value="privateKey">Private Key</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="mnemonic" className="space-y-2">
                      <Label htmlFor="mnemonic">12-word Recovery Phrase</Label>
                      <Input
                        id="mnemonic"
                        type="text"
                        placeholder="word1 word2 word3..."
                        value={mnemonic}
                        onChange={(e) => setMnemonic(e.target.value)}
                      />
                    </TabsContent>
                    
                    <TabsContent value="privateKey" className="space-y-2">
                      <Label htmlFor="privateKey">Private Key</Label>
                      <Input
                        id="privateKey"
                        type="password"
                        placeholder="0x..."
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                      />
                    </TabsContent>
                  </Tabs>
                  
                  <Button 
                    onClick={handleImportWallet} 
                    className="w-full bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
                    disabled={isLoading || (!mnemonic && !privateKey)}
                  >
                    {isLoading ? 'Importing...' : 'Import Wallet'}
                  </Button>
                </TabsContent>
              </Tabs>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Show mnemonic */}
          {step === 2 && walletData && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Backup Your Recovery Phrase</h3>
                <p className="text-gray-600 text-sm">
                  Write down these 12 words in order. You'll need them to recover your wallet.
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="h-4 w-4 text-yellow-600" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMnemonic(!showMnemonic)}
                  >
                    {showMnemonic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(showMnemonic ? walletData.mnemonic.split(' ') : Array(12).fill('••••')).map((word: string, idx: number) => (
                    <div key={idx} className="bg-white p-2 rounded border text-center text-sm">
                      <span className="text-gray-500 text-xs">{idx + 1}.</span> {word}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(walletData.mnemonic)}
                  className="w-full mt-3"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Keep this phrase safe and private. Anyone with this phrase can access your wallet.
                </AlertDescription>
              </Alert>
              
              <Button onClick={() => setStep(3)} className="w-full bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0">
                I've Saved My Recovery Phrase
              </Button>
            </div>
          )}

          {/* Step 3: Confirm mnemonic (skipped for simplicity) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Confirm Recovery Phrase</h3>
                <p className="text-gray-600 text-sm">
                  Please confirm you've saved your recovery phrase by proceeding.
                </p>
              </div>
              <Button onClick={() => setStep(4)} className="w-full bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0">
                Continue to Password Setup
              </Button>
            </div>
          )}

          {/* Step 4: Create password */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Create Password</h3>
                <p className="text-gray-600 text-sm">
                  Create a strong password to encrypt your wallet locally.
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleSaveWallet} 
                className="w-full bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? 'Creating Wallet...' : 'Create Wallet'}
              </Button>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Wallet Created Successfully!</h3>
                <p className="text-gray-600 text-sm">
                  Your wallet has been created and encrypted securely.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Your Wallet Address</div>
                <div className="font-mono text-sm bg-white p-2 rounded border break-all">
                  {walletData?.address}
                </div>
              </div>
              
              <Button onClick={handleComplete} className="w-full bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0">
                Continue to Dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};