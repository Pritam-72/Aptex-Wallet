import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, Lock, Key, Smartphone, Eye, EyeOff, Download, AlertTriangle } from 'lucide-react';
import walletManager from '@/services/WalletManager';

export const SecuritySettings: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<'show' | 'export' | null>(null);
  const [decryptedPhrase, setDecryptedPhrase] = useState<string | null>(null);

  // Mock security data
  const securityScore = 85;
  const lastLogin = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

  const handlePasswordSubmit = async () => {
    setPasswordError(null);
    setPasswordLoading(true);
    try {
      const wallet = await walletManager.loadDecryptedWallet(password);
      // Check if wallet is HDNodeWallet (has mnemonic) or regular Wallet (private key only)
      const phrase = (wallet as any).mnemonic?.phrase;
      if (phrase) {
        setDecryptedPhrase(phrase);
        if (pendingAction === 'show') {
          setShowSeedPhrase(true);
          setShowPasswordPrompt(false);
          setPassword('');
          setPendingAction(null);
        } else if (pendingAction === 'export') {
          // Export logic
          const element = document.createElement('a');
          const file = new Blob([phrase], { type: 'text/plain' });
          element.href = URL.createObjectURL(file);
          element.download = 'cryppal-seed-phrase.txt';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          setShowPasswordPrompt(false);
          setPassword('');
          setPendingAction(null);
        }
      } else {
        setPasswordError('No recovery phrase found for this wallet. This wallet may have been created from a private key.');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (
        msg.toLowerCase().includes('incorrect password') ||
        msg.toLowerCase().includes('invalid password') ||
        msg.toLowerCase().includes('invalid_argument')
      ) {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        setPasswordError('Failed to unlock wallet. Please check your password and try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleShowPhrase = () => {
    if (showSeedPhrase && decryptedPhrase) {
      // Hide phrase
      setShowSeedPhrase(false);
      setDecryptedPhrase(null);
    } else {
      // Show phrase - require password
      setPendingAction('show');
      setShowPasswordPrompt(true);
      setPassword('');
      setPasswordError(null);
      setDecryptedPhrase(null);
    }
  };

  const handleExportPhrase = () => {
    setPendingAction('export');
    setShowPasswordPrompt(true);
    setPassword('');
    setPasswordError(null);
    setDecryptedPhrase(null);
  };

  const handleClosePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPassword('');
    setPasswordError(null);
    setPendingAction(null);
    setDecryptedPhrase(null);
  };

  const SecurityItem = ({ icon: Icon, title, description, status, action, variant = 'default' }: {
    icon: any;
    title: string;
    description: string;
    status: string;
    action: React.ReactNode;
    variant?: 'default' | 'warning';
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${variant === 'warning' ? 'bg-amber-500/10' : 'bg-zinc-800/50'}`}>
          <Icon className={`h-4 w-4 ${variant === 'warning' ? 'text-amber-500' : 'text-zinc-400'}`} />
        </div>
        <div className="space-y-1">
          <div className="font-medium text-zinc-200">{title}</div>
          <div className="text-sm text-zinc-400">{description}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge 
          className={`text-xs px-2 py-1 border ${
            status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
            status === 'Setup Required' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
            'bg-zinc-800/50 text-zinc-400 border-zinc-700'
          }`}
        >
          {status}
        </Badge>
        {action}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Security Overview Header - Minimal */}
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
            <Shield className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-xl font-medium text-white">Security Overview</h1>
            <p className="text-zinc-400 text-sm">Your account security status and recommendations</p>
          </div>
        </div>

        {/* Security Score Card - Minimal */}
        <div className="border border-zinc-800 bg-zinc-900/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-300">Security Score</h3>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${securityScore}%` }}
                  ></div>
                </div>
                <span className="text-xs text-zinc-400">{securityScore}%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-400">{securityScore}%</div>
              <div className="text-xs text-emerald-400">Excellent</div>
            </div>
          </div>
        </div>

        {/* Last Login Info - Minimal */}
        <div className="flex items-center gap-3 p-3 border border-zinc-800 bg-zinc-900/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-zinc-500" />
          <div className="flex-1">
            <div className="text-sm text-zinc-300">Last Activity</div>
            <div className="text-xs text-zinc-500">
              {lastLogin.toLocaleDateString()} at {lastLogin.toLocaleTimeString()}
            </div>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
        </div>
      </div>

      {/* Security Features */}
      <div className="border border-zinc-800 bg-zinc-900/20 rounded-lg p-4">
        <div className="space-y-1 mb-4">
          <h2 className="text-lg font-medium text-white">Security Features</h2>
          <p className="text-zinc-400 text-sm">Manage your account protection settings</p>
        </div>
        
        <div className="space-y-0">
          <SecurityItem
            icon={Lock}
            title="Wallet Encrypted"
            description="Your wallet is secured with advanced encryption"
            status="Active"
            action={
              <Switch
                checked={true}
                disabled
                className="data-[state=checked]:bg-emerald-600"
              />
            }
          />
          
          <SecurityItem
            icon={Key}
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            status="Active"
            action={
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
                className="data-[state=checked]:bg-emerald-600"
              />
            }
          />
          
          <SecurityItem
            icon={Smartphone}
            title="Biometric Auth"
            description="Use fingerprint or face recognition for quick access"
            status="Setup Required"
            variant="warning"
            action={
              <Switch
                checked={biometricEnabled}
                onCheckedChange={setBiometricEnabled}
                className="data-[state=checked]:bg-emerald-600"
              />
            }
          />
          
          <SecurityItem
            icon={Lock}
            title="Auto-lock"
            description="Automatically lock your wallet after inactivity"
            status="Active"
            action={
              <Switch
                checked={autoLockEnabled}
                onCheckedChange={setAutoLockEnabled}
                className="data-[state=checked]:bg-emerald-600"
              />
            }
          />
        </div>
      </div>

      {/* Two-Factor Authentication */}
      {twoFactorEnabled && (
        <div className="border border-zinc-800 bg-zinc-900/20 rounded-lg p-4">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Smartphone className="h-3 w-3 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">Two-Factor Authentication</h2>
                <p className="text-zinc-400 text-sm">Manage your 2FA settings</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-sm text-emerald-400">
              2FA is currently enabled using your authenticator app
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs px-3 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 bg-transparent">
                View Backup Codes
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs px-3 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 bg-transparent">
                Reset 2FA
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Seed Phrase Section */}
      <div className="border border-zinc-800 bg-zinc-900/20 rounded-lg p-4">
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Key className="h-3 w-3 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Recovery Phrase</h2>
              <p className="text-zinc-400 text-sm">Backup your wallet recovery phrase</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <p className="text-sm text-amber-400">
            Keep your recovery phrase safe and secure. Never share it with anyone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowPhrase}
              className="h-8 text-xs px-3 border-amber-500/20 text-amber-400 hover:bg-amber-500/10 bg-transparent"
            >
              {showSeedPhrase ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showSeedPhrase ? 'Hide' : 'Show'} Phrase
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPhrase}
              className="h-8 text-xs px-3 border-amber-500/20 text-amber-400 hover:bg-amber-500/10 bg-transparent"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
          {showSeedPhrase && decryptedPhrase && (
            <div className="p-3 bg-black/30 border border-zinc-800 rounded-md font-mono text-xs text-zinc-300 break-all">
              {decryptedPhrase}
            </div>
          )}
        </div>
      </div>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Enter your wallet password to continue
            </h3>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Wallet password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              {passwordError && (
                <div className="text-red-400 text-sm">{passwordError}</div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={passwordLoading || !password}
                  className="flex-1"
                >
                  {passwordLoading ? 'Verifying...' : 'Continue'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClosePasswordPrompt}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
