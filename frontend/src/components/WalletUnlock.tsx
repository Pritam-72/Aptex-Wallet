import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Wallet, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WalletUnlockProps {
  onCreateNew: () => void;
}

const WalletUnlock: React.FC<WalletUnlockProps> = ({ onCreateNew }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { unlockWallet } = useAuth();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await unlockWallet(password);
      
      if (success) {
        toast.success('Wallet unlocked successfully!');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setError('Failed to unlock wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // In a real implementation, this would guide users through wallet recovery
    toast.info('To recover your wallet, you\'ll need your seed phrase. Create a new wallet if you\'ve lost access.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your password to unlock your Aptos wallet
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleUnlock} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your wallet password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !password}
              size="lg"
            >
              {isLoading ? 'Unlocking...' : 'Unlock Wallet'}
            </Button>
            
            <div className="space-y-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleForgotPassword}
                className="w-full text-sm"
              >
                Forgot your password?
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={onCreateNew}
                className="w-full"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Create New Wallet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletUnlock;