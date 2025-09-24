import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Store, Bell, Shield, Zap, Wallet, Globe, Eye, EyeOff, Copy, Key, Lock as LockIcon, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import walletManager from '@/services/WalletManager';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Add prop types for tab control
export type MerchantSettingsTab = 'profile' | 'privacy';

interface MerchantSettingsProps {
  activeTab?: MerchantSettingsTab;
  setActiveTab?: (tab: MerchantSettingsTab) => void;
}

// Refactor component to accept props
export const MerchantSettings: React.FC<MerchantSettingsProps> = ({ activeTab: propActiveTab, setActiveTab: propSetActiveTab }) => {
  // Business Information State
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    type: '',
    website: '',
    address: '',
    phone: '',
    email: ''
  });

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    minPayment: '0',
    maxPayment: '0',
    autoConfirm: true,
    requireDescription: false,
    allowPartialPayments: false
  });

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    transactions: true,
    security: true,
    marketing: false,
    updates: true,
    priceAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    requirePasswordForPayments: true,
    autoLogout: true,
    ipWhitelist: false
  });

  // API Settings State
  const [apiSettings, setApiSettings] = useState({
    apiEnabled: false,
    webhooksEnabled: false,
    testMode: true
  });

  // Reveal Private Key State
  const [pkPassword, setPkPassword] = useState('');
  const [pkLoading, setPkLoading] = useState(false);
  const [pkError, setPkError] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Security Features State
  const [walletEncrypted, setWalletEncrypted] = useState(true);
  const [autoLock, setAutoLock] = useState(true);
  const [lastActivity, setLastActivity] = useState(new Date());

  // Recovery Phrase State
  const [showPhrase, setShowPhrase] = useState(false);
  const [phraseLoading, setPhraseLoading] = useState(false);
  const [phraseError, setPhraseError] = useState<string | null>(null);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);

  // Recovery Phrase Password Prompt State
  const [showPhrasePrompt, setShowPhrasePrompt] = useState(false);
  const [phrasePassword, setPhrasePassword] = useState('');
  const [decryptedPhrase, setDecryptedPhrase] = useState<string | null>(null);
  const [pendingPhraseAction, setPendingPhraseAction] = useState<'show' | 'export' | null>(null);

  // Tab state: use prop if provided, else internal state
  const [internalTab, setInternalTab] = useState<MerchantSettingsTab>('profile');
  const activeTab = propActiveTab ?? internalTab;
  const setActiveTab = propSetActiveTab ?? setInternalTab;

  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleRevealPrivateKey = async () => {
    setPkError(null);
    setPkLoading(true);
    setPrivateKey(null);
    setCopied(false);
    try {
      const wallet = await walletManager.loadDecryptedWallet(pkPassword);
      // Remove '0x' prefix if present
      const cleanPrivateKey = wallet.privateKey.startsWith('0x') ? wallet.privateKey.slice(2) : wallet.privateKey;
      setPrivateKey(cleanPrivateKey);
      setShowPrivateKey(true);
    } catch (err: any) {
      const msg = err.message || '';
      if (
        msg.toLowerCase().includes('incorrect password') ||
        msg.toLowerCase().includes('invalid password') ||
        msg.toLowerCase().includes('invalid_argument')
      ) {
        setPkError('Incorrect password. Please try again.');
      } else {
        setPkError('Failed to unlock wallet. Please check your password and try again.');
      }
    } finally {
      setPkLoading(false);
    }
  };

  const handleCopy = async () => {
    if (privateKey) {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Recovery Phrase logic (UserSettings style)
  const handleShowPhrase = () => {
    setPendingPhraseAction('show');
    setShowPhrasePrompt(true);
    setPhrasePassword('');
    setPhraseError(null);
    setDecryptedPhrase(null);
  };

  const handleExportPhrase = () => {
    setPendingPhraseAction('export');
    setShowPhrasePrompt(true);
    setPhrasePassword('');
    setPhraseError(null);
    setDecryptedPhrase(null);
  };

  const handlePhrasePasswordSubmit = async () => {
    setPhraseError(null);
    setPhraseLoading(true);
    try {
      const wallet = await walletManager.loadDecryptedWallet(phrasePassword);
      const phrase = wallet.mnemonic?.phrase;
      if (phrase) {
        setDecryptedPhrase(phrase);
        if (pendingPhraseAction === 'export') {
          // Export logic
          const element = document.createElement('a');
          const file = new Blob([phrase], { type: 'text/plain' });
          element.href = URL.createObjectURL(file);
          element.download = 'cryppal-recovery-phrase.txt';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          setShowPhrasePrompt(false);
          setPhrasePassword('');
          setPendingPhraseAction(null);
        }
      } else {
        setPhraseError('No recovery phrase found for this wallet.');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (
        msg.toLowerCase().includes('incorrect password') ||
        msg.toLowerCase().includes('invalid password') ||
        msg.toLowerCase().includes('invalid_argument')
      ) {
        setPhraseError('Incorrect password. Please try again.');
      } else {
        setPhraseError('Failed to unlock wallet. Please check your password and try again.');
      }
    } finally {
      setPhraseLoading(false);
    }
  };

  const handleClosePhrasePrompt = () => {
    setShowPhrasePrompt(false);
    setPhrasePassword('');
    setPhraseError(null);
    setPendingPhraseAction(null);
    setDecryptedPhrase(null);
  };

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await signOut();
    navigate('/auth-type');
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button
          className={`flex items-center gap-2 px-2 pb-2 border-b-2 transition-colors text-base font-medium ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="inline-block"><Store className="h-5 w-5" /></span> Profile
        </button>
        <button
          className={`flex items-center gap-2 px-2 pb-2 border-b-2 transition-colors text-base font-medium ${activeTab === 'privacy' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('privacy')}
        >
          <span className="inline-block"><Shield className="h-5 w-5" /></span> Privacy & Security
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>Business Information</CardTitle>
            </div>
            <CardDescription>
              Update your business details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  placeholder="Enter business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  value={businessInfo.type}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, type: e.target.value })}
                  placeholder="e.g., Retail, Services, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={businessInfo.website}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                  placeholder="www.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy & Security Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Privacy & Security */}
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Privacy & Security</CardTitle>
              </div>
              <CardDescription>
                Manage your privacy settings and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Data & Privacy</h4>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold">Share Usage Data</p>
                    <p className="text-sm text-muted-foreground">Help improve our service by sharing anonymous usage data</p>
                  </div>
                  <Switch checked={false} />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold">Analytics</p>
                    <p className="text-sm text-muted-foreground">Allow analytics to personalize your experience</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">Crash Reports</p>
                    <p className="text-sm text-muted-foreground">Send crash reports to help us fix issues</p>
                  </div>
                  <Switch checked={true} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Security Overview</CardTitle>
              </div>
              <CardDescription>Your account security status and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Last Activity</span>
                <span className="ml-auto text-xs text-muted-foreground">{lastActivity.toLocaleString()}</span>
                <span className="ml-2 h-2 w-2 rounded-full bg-green-500 inline-block" />
              </div>
            </CardContent>
          </Card>

          {/* Security Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Security Features</CardTitle>
              <CardDescription>Manage your account protection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <LockIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">Wallet Encrypted</div>
                    <div className="text-xs text-muted-foreground">Your wallet is secured with advanced encryption</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-900/80 text-emerald-400">Active</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <LockIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">Auto-lock</div>
                    <div className="text-xs text-muted-foreground">Automatically lock your wallet after inactivity</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-900/80 text-emerald-400">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reveal Private Key */}
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Reveal Private Key</CardTitle>
              </div>
              <CardDescription>
                For advanced users: Enter your wallet password to view your private key. Never share your private key with anyone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletPassword">Wallet Password</Label>
                <Input
                  id="walletPassword"
                  type="password"
                  value={pkPassword}
                  onChange={e => setPkPassword(e.target.value)}
                  placeholder="Enter your wallet password"
                  disabled={pkLoading}
                />
              </div>
              <Button onClick={handleRevealPrivateKey} disabled={pkLoading || !pkPassword} className="mt-2 w-full sm:w-auto">
                {pkLoading ? 'Unlocking...' : 'Reveal Private Key'}
              </Button>
              {pkError && <div className="text-red-500 text-xs sm:text-sm">{pkError}</div>}
              {showPrivateKey && privateKey && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-md p-3 sm:p-4 mt-2">
                  <Label>Private Key</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type={showPrivateKey ? 'text' : 'password'}
                      value={privateKey}
                      readOnly
                      className="font-mono text-xs sm:text-base"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setShowPrivateKey(v => !v)}>
                      {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    {copied && <span className="text-green-500 text-xs ml-2">Copied!</span>}
                  </div>
                  <div className="text-xs text-yellow-500 mt-2">Never share your private key. Anyone with this key can access your funds.</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recovery Phrase */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                <CardTitle>Recovery Phrase</CardTitle>
              </div>
              <CardDescription>Backup your wallet recovery phrase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-900/10 border border-amber-700 rounded-lg p-4 mb-4">
                <span className="text-amber-400 text-sm">Keep your recovery phrase safe and secure. Never share it with anyone.</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 bg-transparent" onClick={handleShowPhrase}>
                  Show Phrase
                </Button>
                <Button variant="outline" className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 bg-transparent" onClick={handleExportPhrase}>
                  Export
                </Button>
              </div>
              {/* Password Prompt Modal/Inline */}
              {showPhrasePrompt && (
                <div className="mt-4 p-4 bg-black/40 border border-amber-500/30 rounded-lg">
                  <div className="mb-2 font-medium text-amber-400">Enter your wallet password to continue</div>
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      type="password"
                      value={phrasePassword}
                      onChange={e => setPhrasePassword(e.target.value)}
                      placeholder="Wallet password"
                      disabled={phraseLoading}
                      className="w-64"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handlePhrasePasswordSubmit}
                      disabled={phraseLoading || !phrasePassword}
                      className="bg-amber-500/80 text-white hover:bg-amber-500"
                    >
                      {phraseLoading ? 'Unlocking...' : 'Continue'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClosePhrasePrompt}
                      disabled={phraseLoading}
                      className="text-amber-400"
                    >
                      Cancel
                    </Button>
                  </div>
                  {phraseError && <div className="text-red-500 text-xs mb-2">{phraseError}</div>}
                  {/* Show phrase if unlocked and action is show */}
                  {pendingPhraseAction === 'show' && decryptedPhrase && (
                    <div className="p-3 bg-black/30 border border-zinc-800 rounded-md font-mono text-xs text-zinc-300 break-all mt-2">
                      {decryptedPhrase}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log Out Button with Minimal Monochrome Style, Left-Aligned */}
      <div className="flex justify-start mt-16">
        <Button
          variant="ghost"
          className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 text-base font-normal text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-none shadow-none border-none"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="h-5 w-5 mr-1 text-muted-foreground" />
          Log Out
        </Button>
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent className="max-w-xs bg-background border border-border p-4">
            <DialogHeader>
              <DialogTitle className="text-base font-medium text-foreground">Log Out</DialogTitle>
            </DialogHeader>
            <div className="py-2 text-center text-muted-foreground text-sm">
              Are you sure you want to log out?
            </div>
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="ghost" className="text-muted-foreground" onClick={() => setShowLogoutDialog(false)}>
                Cancel
              </Button>
              <Button variant="ghost" className="text-foreground" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1 text-foreground" />
                Log Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}; 