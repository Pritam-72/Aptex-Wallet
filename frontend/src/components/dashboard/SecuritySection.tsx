import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg hover:bg-muted/20 hover:border-primary/20 transition-all duration-200 cosmic-glow">
              <div>
                <div className="font-medium text-foreground">Two-Factor Authentication</div>
                <div className="text-sm text-muted-foreground">Secure your account with 2FA</div>
              </div>
              <Button variant="outline" size="sm" className="border-border hover:bg-muted/50 cosmic-glow">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg hover:bg-muted/20 hover:border-primary/20 transition-all duration-200 cosmic-glow">
              <div>
                <div className="font-medium text-foreground">Backup Recovery Phrase</div>
                <div className="text-sm text-muted-foreground">Safely store your recovery phrase</div>
              </div>
              <Button variant="outline" size="sm" className="border-border hover:bg-muted/50 cosmic-glow">
                Backup
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg hover:bg-muted/20 hover:border-primary/20 transition-all duration-200 cosmic-glow">
              <div>
                <div className="font-medium text-foreground">Change Password</div>
                <div className="text-sm text-muted-foreground">Update your wallet password</div>
              </div>
              <Button variant="outline" size="sm" className="border-border hover:bg-muted/50 cosmic-glow">
                Change
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};