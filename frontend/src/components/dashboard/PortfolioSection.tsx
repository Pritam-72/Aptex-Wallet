import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export const PortfolioSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="cosmic-glow bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Portfolio Coming Soon</h3>
            <p className="text-muted-foreground">Track your crypto portfolio performance and analytics.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};