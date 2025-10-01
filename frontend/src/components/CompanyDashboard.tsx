import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2,
  CreditCard,
  Gift,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Package
} from "lucide-react";
import { Account } from "@aptos-labs/ts-sdk";
import { CompanyEmiSection } from './CompanyEmiSection';
import { CompanyCouponSection } from './CompanyCouponSection';

interface CompanyDashboardProps {
  companyAddress: string;
  account: Account | null;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ companyAddress, account }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'emi' | 'coupons'>('overview');

  const handleTabChange = (value: string) => {
    if (value === 'overview' || value === 'emi' || value === 'coupons') {
      setActiveTab(value);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Company Dashboard</h1>
            <p className="text-muted-foreground">Manage your EMI agreements and coupon campaigns</p>
          </div>
        </div>
      </div>

      {/* Company Address Info */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Company Address</p>
            <p className="text-sm font-mono text-foreground break-all bg-muted/20 p-3 rounded-lg">
              {companyAddress}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-border/50">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="emi" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            EMI Management
          </TabsTrigger>
          <TabsTrigger 
            value="coupons" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Gift className="h-4 w-4 mr-2" />
            Coupons & NFTs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stats Cards */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <CardHeader className="pb-3">
                <CardDescription className="text-blue-400">Total Revenue</CardDescription>
                <CardTitle className="text-3xl text-blue-400">
                  0.0000 APT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span>From EMI & Sales</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <CardHeader className="pb-3">
                <CardDescription className="text-green-400">Active EMI</CardDescription>
                <CardTitle className="text-3xl text-green-400">
                  0
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-green-400" />
                  <span>Agreements</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <CardHeader className="pb-3">
                <CardDescription className="text-purple-400">Coupon Templates</CardDescription>
                <CardTitle className="text-3xl text-purple-400">
                  0
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4 text-purple-400" />
                  <span>Active Templates</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
              <CardHeader className="pb-3">
                <CardDescription className="text-orange-400">Coupons Minted</CardDescription>
                <CardTitle className="text-3xl text-orange-400">
                  0
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gift className="h-4 w-4 text-orange-400" />
                  <span>Total NFTs</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks for company management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-4"
                  onClick={() => setActiveTab('emi')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Create EMI Agreement</p>
                      <p className="text-xs text-muted-foreground">Set up installment payment plan</p>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-4"
                  onClick={() => setActiveTab('coupons')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Create Coupon Template</p>
                      <p className="text-xs text-muted-foreground">Design new discount offer</p>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-4"
                  onClick={() => setActiveTab('emi')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Collect EMI Payments</p>
                      <p className="text-xs text-muted-foreground">Process due installments</p>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-4"
                  onClick={() => setActiveTab('coupons')}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Mint Coupon to User</p>
                      <p className="text-xs text-muted-foreground">Send discount NFT to customer</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  EMI System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create installment payment agreements for your products or services. Users can enable auto-pay for seamless monthly deductions.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-400 rounded-full" />
                    <span className="text-muted-foreground">Flexible payment terms (1-120 months)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-400 rounded-full" />
                    <span className="text-muted-foreground">Automatic payment collection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-400 rounded-full" />
                    <span className="text-muted-foreground">Real-time payment tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Coupon NFT System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create reusable coupon templates and mint discount NFTs to your customers. Each NFT represents a unique discount offer.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-purple-400 rounded-full" />
                    <span className="text-muted-foreground">Customizable discount templates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-purple-400 rounded-full" />
                    <span className="text-muted-foreground">One-time use NFTs</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-purple-400 rounded-full" />
                    <span className="text-muted-foreground">Expiration date management</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* EMI Management Tab */}
        <TabsContent value="emi" className="mt-6">
          <CompanyEmiSection companyAddress={companyAddress} account={account} />
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="mt-6">
          <CompanyCouponSection companyAddress={companyAddress} account={account} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
