import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Key, Smartphone, Eye, EyeOff, Download, AlertTriangle } from 'lucide-react';

export const SecuritySettings: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);

  // Mock security data
  const securityScore = 85;
  const lastLogin = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
  const mockSeedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  const handleExportSeedPhrase = () => {
    const element = document.createElement('a');
    const file = new Blob([mockSeedPhrase], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'cryppal-seed-phrase.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const SecurityItem = ({ icon: Icon, title, description, status, action, variant = 'default' }: {
    icon: any;
    title: string;
    description: string;
    status: string;
    action: React.ReactNode;
    variant?: 'default' | 'warning';
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-border/40 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${variant === 'warning' ? 'bg-amber-500/10' : 'bg-muted/30'}`}>
          <Icon className={`h-4 w-4 ${variant === 'warning' ? 'text-amber-500' : 'text-muted-foreground'}`} />
        </div>
        <div className="space-y-1">
          <div className="font-medium text-foreground">{title}</div>
          <div className="text-sm text-muted-foreground leading-relaxed">{description}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge 
          variant={status === 'Active' ? 'default' : status === 'Setup Required' ? 'secondary' : 'outline'}
          className={`text-xs px-2 py-1 ${
            status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
            status === 'Setup Required' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
            'bg-muted/50 text-muted-foreground border-border'
          }`}
        >
          {status}
        </Badge>
        {action}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Security Overview Header */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
              <Shield className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Security Overview</h1>
              <p className="text-muted-foreground">Your account security status and recommendations</p>
            </div>
          </div>
        </div>

        {/* Security Score */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border border-border/60 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium text-foreground">Security Score</h3>
              <p className="text-sm text-muted-foreground">Based on your current security settings</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                {securityScore}%
              </div>
              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Strong</div>
            </div>
          </div>
        </div>

        {/* Last Login Info */}
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/20">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Last login: {lastLogin.toLocaleDateString()} at {lastLogin.toLocaleTimeString()} from this device
          </span>
        </div>
      </div>

      {/* Security Features */}
      <Card className="border-border/60 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="space-y-1 mb-6">
            <h2 className="text-lg font-semibold text-foreground">Security Features</h2>
            <p className="text-muted-foreground text-sm">Manage your account protection settings</p>
          </div>
          
          <div className="space-y-0">
            <SecurityItem
              icon={Lock}
              title="Wallet Encrypted"
              description="Your wallet is secured with advanced encryption"
              status="Active"
              action={null}
            />
            
            <SecurityItem
              icon={Smartphone}
              title="2FA Enabled"
              description="Two-factor authentication adds extra security to your account"
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
              icon={Key}
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
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      {twoFactorEnabled && (
        <Card className="border-border/60 bg-background/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
                  <p className="text-muted-foreground text-sm">Manage your 2FA settings</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                2FA is currently enabled using your authenticator app
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs px-3 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10">
                  View Backup Codes
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs px-3 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10">
                  Reset 2FA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recovery & Backup */}
      <Card className="border-border/60 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="space-y-1 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Key className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recovery & Backup</h2>
                <p className="text-muted-foreground text-sm">Secure your wallet with recovery options</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Backup Seed Phrase</div>
                  <div className="text-sm text-muted-foreground">Secure your 12-word recovery phrase</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                  className="h-8 text-xs px-3 border-amber-500/20 text-amber-600 hover:bg-amber-500/10"
                >
                  {showSeedPhrase ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showSeedPhrase ? 'Hide' : 'Show'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSeedPhrase}
                  className="h-8 text-xs px-3 border-amber-500/20 text-amber-600 hover:bg-amber-500/10"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
            
            {showSeedPhrase && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border/40 font-mono text-sm text-foreground">
                {mockSeedPhrase}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
