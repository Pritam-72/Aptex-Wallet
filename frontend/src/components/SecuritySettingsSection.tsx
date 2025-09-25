import React, { useState } from 'react';
import { Shield, Key, Smartphone, Bell, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChangePasswordModal } from './ChangePasswordModal';

const SecuritySettingsSection = () => {
  const [notifications, setNotifications] = useState({
    transactions: true,
    priceAlerts: true,
    security: true,
    marketing: false
  });

  const [securityFeatures, setSecurityFeatures] = useState({
    twoFactor: true,
    biometric: false,
    autoLock: true,
    fraudDetection: true
  });

  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const handlePasswordChanged = () => {
    // Password was successfully changed
    console.log('Password changed successfully');
  };

  const seedPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  return (
    <section className="py-16 px-6 md:px-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Security & Settings</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your wallet security, backup your seed phrase, and customize your notification preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Security Settings */}
          <div className="space-y-6">
            <Card className="glass-card p-6 border-border">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Features
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch
                    checked={securityFeatures.twoFactor}
                    onCheckedChange={(checked) => 
                      setSecurityFeatures({...securityFeatures, twoFactor: checked})
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Biometric Lock</p>
                    <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
                  </div>
                  <Switch
                    checked={securityFeatures.biometric}
                    onCheckedChange={(checked) => 
                      setSecurityFeatures({...securityFeatures, biometric: checked})
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-Lock</p>
                    <p className="text-sm text-muted-foreground">Lock wallet after inactivity</p>
                  </div>
                  <Switch
                    checked={securityFeatures.autoLock}
                    onCheckedChange={(checked) => 
                      setSecurityFeatures({...securityFeatures, autoLock: checked})
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Fraud Detection</p>
                    <p className="text-sm text-muted-foreground">Monitor suspicious activity</p>
                  </div>
                  <Switch
                    checked={securityFeatures.fraudDetection}
                    onCheckedChange={(checked) => 
                      setSecurityFeatures({...securityFeatures, fraudDetection: checked})
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Seed Phrase Backup */}
            <Card className="glass-card p-6 border-border">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Key className="h-5 w-5" />
                Seed Phrase Backup
              </h3>
              
              <div className="space-y-4">
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="font-medium text-warning">Important</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your seed phrase is the only way to recover your wallet. Keep it safe and never share it with anyone.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="seedphrase">Recovery Phrase</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                    >
                      {showSeedPhrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <code className="text-sm font-mono">
                      {showSeedPhrase ? seedPhrase : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Copy to Clipboard
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Download Backup
                    </Button>
                  </div>
                </div>

                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium text-success">Backup Status: Secured</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last verified: 2 days ago
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Notifications & Preferences */}
          <div className="space-y-6">
            <Card className="glass-card p-6 border-border">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Transaction Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified of all transactions</p>
                  </div>
                  <Switch
                    checked={notifications.transactions}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, transactions: checked})
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Price Alerts</p>
                    <p className="text-sm text-muted-foreground">Notifications for price targets</p>
                  </div>
                  <Switch
                    checked={notifications.priceAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, priceAlerts: checked})
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Security Alerts</p>
                    <p className="text-sm text-muted-foreground">Important security notifications</p>
                  </div>
                  <Switch
                    checked={notifications.security}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, security: checked})
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Updates</p>
                    <p className="text-sm text-muted-foreground">News and feature updates</p>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, marketing: checked})
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Account Settings */}
            <Card className="glass-card p-6 border-border">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currency">Default Currency</Label>
                  <select className="w-full mt-1 p-2 rounded-md border border-border bg-background">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="language">Language</Label>
                  <select className="w-full mt-1 p-2 rounded-md border border-border bg-background">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select className="w-full mt-1 p-2 rounded-md border border-border bg-background">
                    <option value="UTC">UTC</option>
                    <option value="PST">Pacific Time (PST)</option>
                    <option value="EST">Eastern Time (EST)</option>
                    <option value="CET">Central European Time (CET)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Account Actions */}
            <Card className="glass-card p-6 border-border">
              <h3 className="text-xl font-semibold mb-6">Account Actions</h3>
              
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsChangePasswordModalOpen(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Manage Connected Devices
                </Button>
                <Button variant="outline" className="w-full justify-start text-warning hover:text-warning">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reset Wallet
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onPasswordChanged={handlePasswordChanged}
      />
    </section>
  );
};

export default SecuritySettingsSection;
