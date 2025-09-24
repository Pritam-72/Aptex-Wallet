import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Settings, User, Bell, Palette, Globe, Download, Trash2, RefreshCw, Save, Shield, Smartphone, LogOut } from 'lucide-react';
// Removed wallet dependency
import walletManager from '@/services/WalletManager';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface UserPreferences {
  currency: string;
  language: string;
  theme: string;
  dateFormat: string;
  timeFormat: string;
  autoRefresh: boolean;
  compactMode: boolean;
}

interface NotificationSettings {
  transactions: boolean;
  security: boolean;
  marketing: boolean;
  updates: boolean;
  priceAlerts: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

interface PrivacySettings {
  shareData: boolean;
  analytics: boolean;
  crashReports: boolean;
  dataRetention: string;
  twoFactorAuth: boolean;
  biometricAuth: boolean;
}

interface AppSettings {
  profile: UserProfile;
  preferences: UserPreferences;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

const defaultSettings: AppSettings = {
  profile: {
    name: 'User',
    email: '',
    phone: ''
  },
  preferences: {
    currency: 'INR',
    language: 'en',
    theme: 'system',
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24h',
    autoRefresh: true,
    compactMode: false
  },
  notifications: {
    transactions: true,
    security: true,
    marketing: false,
    updates: true,
    priceAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  },
  privacy: {
    shareData: false,
    analytics: true,
    crashReports: true,
    dataRetention: '2years',
    twoFactorAuth: false,
    biometricAuth: false
  }
};

// Add prop type for onLogout
interface UserSettingsProps {
  onLogout?: () => void;
}

// Update component to accept props
export const UserSettings: React.FC<UserSettingsProps> = ({ onLogout }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const { isConnected, address, isLoading } = useWallet();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [pkPassword, setPkPassword] = useState('');
  const [pkError, setPkError] = useState<string | null>(null);
  const [pkLoading, setPkLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('cryppal-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Update settings and mark as changed
  const updateSettings = (section: keyof AppSettings, updates: Partial<any>) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
    setHasChanges(true);
  };

  // Save settings to localStorage
  const saveSettings = async () => {
    setSaving(true);
    try {
      localStorage.setItem('cryppal-settings', JSON.stringify(settings));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Export settings
  const exportSettings = () => {
    try {
      const exportData = {
        ...settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `cryppal-settings-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Settings exported",
        description: "Your settings have been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Import settings
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...importedData });
        setHasChanges(true);
        toast({
          title: "Settings imported",
          description: "Your settings have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid settings file. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Reset settings
  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      setSettings(defaultSettings);
      setHasChanges(true);
      toast({
        title: "Settings reset",
        description: "All settings have been reset to default values.",
      });
    }
  };

  const handleRevealPrivateKey = async () => {
    setPkError(null);
    setPkLoading(true);
    setPrivateKey(null);
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

  const sectionTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  ];

  return (
    <div className="space-y-6 relative pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 px-2 sm:px-0 pt-2 sm:pt-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
          <input
            type="file"
            accept=".json"
            onChange={importSettings}
            className="hidden"
            id="import-settings"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-settings')?.click()}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportSettings}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetSettings}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
            className="flex-1 sm:flex-none"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Unsaved changes alert - fixed at bottom on mobile */}
      {hasChanges && (
        <Alert className="border-yellow-600 bg-zinc-900 text-yellow-100 flex items-center justify-between shadow-lg fixed bottom-0 left-0 right-0 z-50 sm:static sm:rounded-lg sm:mt-4 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" /></svg>
            <AlertDescription>
              You have unsaved changes. Don't forget to save your settings.
            </AlertDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-yellow-50 border-none" onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Now'}
            </Button>
            <button
              className="ml-2 text-yellow-400 hover:text-yellow-200 text-lg font-bold px-2"
              aria-label="Dismiss"
              onClick={() => setHasChanges(false)}
            >
              ×
            </button>
          </div>
        </Alert>
      )}

      {/* Navigation Tabs - horizontally scrollable and sticky on mobile */}
      <div className="flex gap-2 border-b border-zinc-800 overflow-x-auto flex-nowrap sticky top-0 z-30 bg-background py-2 px-2 sm:static sm:bg-transparent sm:py-0 sm:px-0">
        {sectionTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-3 pb-2 pt-1 text-sm font-medium transition-colors whitespace-nowrap
              ${activeSection === tab.id
                ? 'text-white font-semibold border-b-2 border-white'
                : 'text-zinc-400 hover:text-zinc-200 border-b-2 border-transparent'}
            `}
            style={{ background: 'none', boxShadow: 'none' }}
          >
            <tab.icon className={`h-4 w-4 ${activeSection === tab.id ? 'text-white' : 'text-zinc-500'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Settings */}
      {activeSection === 'profile' && (
        <Card className="shadow-lg rounded-xl p-2 sm:p-0">
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Update your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 py-3 sm:px-6 sm:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col gap-2 sm:gap-4">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={settings.profile.name}
                  onChange={(e) => updateSettings('profile', { name: e.target.value })}
                  placeholder="Enter your full name"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col gap-2 sm:gap-4">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateSettings('profile', { email: e.target.value })}
                  placeholder="Enter your email"
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="my-2 border-t border-zinc-800/60" />
            <div className="flex flex-col gap-2 sm:gap-4 sm:col-span-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={settings.profile.phone}
                onChange={(e) => updateSettings('profile', { phone: e.target.value })}
                placeholder="Enter your phone number"
                className="text-sm sm:text-base"
              />
            </div>
            {/* Logout Button */}
            {typeof onLogout === 'function' && (
              <Button variant="destructive" className="mt-4 w-full sm:w-auto" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Privacy & Security */}
      {activeSection === 'privacy' && (
        <>
          {/* Private Key Reveal Section */}
          {isConnected && address && (
            <Card className="shadow-lg rounded-xl p-2 sm:p-0 mb-4">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-5 w-5" />
                  Reveal Private Key
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  For advanced users: Enter your wallet password to view your private key. Never share your private key with anyone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 py-3 sm:px-6 sm:py-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="pk-password">Wallet Password</Label>
                  <Input
                    id="pk-password"
                    type="password"
                    value={pkPassword}
                    onChange={e => setPkPassword(e.target.value)}
                    placeholder="Enter your wallet password"
                    disabled={pkLoading}
                    className="text-sm sm:text-base"
                  />
                </div>
                <Button onClick={handleRevealPrivateKey} disabled={pkLoading || !pkPassword} className="w-full sm:w-auto">
                  {pkLoading ? 'Unlocking...' : 'Reveal Private Key'}
                </Button>
                {pkError && <div className="text-red-500 text-xs sm:text-sm">{pkError}</div>}
                {showPrivateKey && privateKey && (
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-md p-3 sm:p-4 mt-2">
                    <Label>Private Key</Label>
                    <Input
                      type={showPrivateKey ? 'text' : 'password'}
                      value={privateKey}
                      readOnly
                      className="mt-2 font-mono text-xs sm:text-base"
                    />
                    <div className="text-xs text-yellow-500 mt-2">Never share your private key. Anyone with this key can access your funds.</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg rounded-xl p-2 sm:p-0">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage your privacy settings and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 py-3 sm:px-6 sm:py-4">
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium text-sm sm:text-base">Data & Privacy</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div>
                      <Label htmlFor="share-data">Share Usage Data</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">Help improve our service by sharing anonymous usage data</p>
                    </div>
                    <Switch
                      id="share-data"
                      checked={settings.privacy.shareData}
                      onCheckedChange={(checked) => updateSettings('privacy', { shareData: checked })}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div>
                      <Label htmlFor="analytics">Analytics</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">Allow analytics to personalize your experience</p>
                    </div>
                    <Switch
                      id="analytics"
                      checked={settings.privacy.analytics}
                      onCheckedChange={(checked) => updateSettings('privacy', { analytics: checked })}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div>
                      <Label htmlFor="crash-reports">Crash Reports</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">Send crash reports to help us fix issues</p>
                    </div>
                    <Switch
                      id="crash-reports"
                      checked={settings.privacy.crashReports}
                      onCheckedChange={(checked) => updateSettings('privacy', { crashReports: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
