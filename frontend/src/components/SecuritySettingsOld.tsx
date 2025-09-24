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
    icon: React.ComponentType<{ className?: string }>;
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
      </div>

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
