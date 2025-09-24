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
import { Settings, User, Bell, Palette, Globe, Download, Trash2, RefreshCw } from 'lucide-react';
import { ProfileService } from '@/services/ProfileService';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

export const UserSettings: React.FC = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  
  const [preferences, setPreferences] = useState({
    currency: 'INR',
    language: 'en',
    theme: 'system',
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24h'
  });

  const [notifications, setNotifications] = useState({
    transactions: true,
    security: true,
    marketing: false,
    updates: true,
    priceAlerts: true
  });

  const [privacy, setPrivacy] = useState({
    shareData: false,
    analytics: true,
    crashReports: true
  });

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const profileData = await ProfileService.getProfile(user.id);
          if (profileData) {
            setProfile({
              full_name: profileData.full_name || '',
              email: profileData.email || '',
              phone: profileData.phone || ''
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive'
        });
      }
    };

    loadUserProfile();
  }, []);

  const handleProfileUpdate = async () => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return;
    }

    try {
      await ProfileService.updateProfile(userId, {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone
      });

      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    }
  };

  const handleExportData = () => {
    // In real app, this would export user data
    const exportData = {
      profile,
      preferences,
      notifications,
      privacy,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cryppal-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      setPreferences({
        currency: 'INR',
        language: 'en',
        theme: 'system',
        dateFormat: 'dd/mm/yyyy',
        timeFormat: '24h'
      });
      setNotifications({
        transactions: true,
        security: true,
        marketing: false,
        updates: true,
        priceAlerts: true
      });
      setPrivacy({
        shareData: false,
        analytics: true,
        crashReports: true
      });
      alert('Settings reset to default');
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
          <Button onClick={handleProfileUpdate}>
            Update Profile
          </Button>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            App Preferences
          </CardTitle>
          <CardDescription>
            Customize your app experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select value={preferences.currency} onValueChange={(value) => setPreferences({ ...preferences, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={preferences.language} onValueChange={(value) => setPreferences({ ...preferences, language: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                  <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                  <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={preferences.theme} onValueChange={(value) => setPreferences({ ...preferences, theme: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Control what notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Transaction Notifications</h4>
                <p className="text-sm text-muted-foreground">Get notified about payments and transfers</p>
              </div>
              <Switch 
                checked={notifications.transactions} 
                onCheckedChange={(checked) => setNotifications({ ...notifications, transactions: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Security Alerts</h4>
                <p className="text-sm text-muted-foreground">Important security notifications</p>
              </div>
              <Switch 
                checked={notifications.security} 
                onCheckedChange={(checked) => setNotifications({ ...notifications, security: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Price Alerts</h4>
                <p className="text-sm text-muted-foreground">ETH price changes and market updates</p>
              </div>
              <Switch 
                checked={notifications.priceAlerts} 
                onCheckedChange={(checked) => setNotifications({ ...notifications, priceAlerts: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">App Updates</h4>
                <p className="text-sm text-muted-foreground">Feature updates and announcements</p>
              </div>
              <Switch 
                checked={notifications.updates} 
                onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Marketing Communications</h4>
                <p className="text-sm text-muted-foreground">Promotional offers and news</p>
              </div>
              <Switch 
                checked={notifications.marketing} 
                onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Data</CardTitle>
          <CardDescription>
            Control how your data is used and shared
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Share Usage Data</h4>
                <p className="text-sm text-muted-foreground">Help improve the app by sharing anonymous usage data</p>
              </div>
              <Switch 
                checked={privacy.shareData} 
                onCheckedChange={(checked) => setPrivacy({ ...privacy, shareData: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Analytics</h4>
                <p className="text-sm text-muted-foreground">Allow analytics to improve your experience</p>
              </div>
              <Switch 
                checked={privacy.analytics} 
                onCheckedChange={(checked) => setPrivacy({ ...privacy, analytics: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Crash Reports</h4>
                <p className="text-sm text-muted-foreground">Automatically send crash reports to help fix bugs</p>
              </div>
              <Switch 
                checked={privacy.crashReports} 
                onCheckedChange={(checked) => setPrivacy({ ...privacy, crashReports: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or reset your data and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleExportData} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export My Data
            </Button>
            <Button variant="outline" onClick={handleResetSettings} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Settings
            </Button>
          </div>
          
          <Alert>
            <AlertDescription>
              <strong>Export:</strong> Download all your settings and preferences as a JSON file.
              <br />
              <strong>Reset:</strong> Restore all settings to their default values.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions - use with caution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="destructive">
              <Trash2 className="h-4 w-4" />
              <AlertDescription>
                Deleting your account will permanently remove all your data. This action cannot be undone.
              </AlertDescription>
            </Alert>
            <Button variant="destructive" disabled>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
