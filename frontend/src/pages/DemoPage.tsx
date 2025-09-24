import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Store, Users, ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DemoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CrypPal Wallet Integration Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of digital payments with our fully integrated Aptos wallet system. 
            Secure, fast, and user-friendly cryptocurrency transactions for both users and merchants.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
            <CardHeader>
              <Shield className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Secure Wallet</CardTitle>
              <CardDescription>
                Military-grade encryption with password protection and secure key storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 256-bit AES encryption</li>
                <li>• Secure mnemonic generation</li>
                <li>• Private key import support</li>
                <li>• Local encrypted storage</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:border-green-200 transition-colors">
            <CardHeader>
              <Zap className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Gas Optimization</CardTitle>
              <CardDescription>
                Ultra-low gas fees with intelligent transaction priority management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 90% gas savings vs standard</li>
                <li>• Multiple priority levels</li>
                <li>• EIP-1559 optimization</li>
                <li>• Real-time fee estimation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:border-purple-200 transition-colors">
            <CardHeader>
              <Globe className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Network Support</CardTitle>
              <CardDescription>
                Multi-network support with seamless switching between testnets and mainnet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Aptos Mainnet</li>
                <li>• Sepolia Testnet</li>
                <li>• Network auto-detection</li>
                <li>• Custom RPC support</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Demo Dashboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* User Dashboard */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Enhanced User Dashboard</CardTitle>
                  <CardDescription className="text-blue-100">
                    Complete wallet management for everyday users
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Balance</div>
                    <div className="font-semibold">0.2500 APT</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">Transactions</div>
                    <div className="font-semibold">24 Total</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Key Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Wallet creation & import</li>
                    <li>• Send/receive APT with QR codes</li>
                    <li>• Transaction history with Excel export</li>
                    <li>• Portfolio tracking & analytics</li>
                    <li>• Security settings management</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={() => navigate('/enhanced-user-dashboard')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Try User Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Merchant Dashboard */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Enhanced Merchant Dashboard</CardTitle>
                  <CardDescription className="text-green-100">
                    Professional payment management for businesses
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">Revenue</div>
                    <div className="font-semibold">1.25 APT</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Customers</div>
                    <div className="font-semibold">145 Active</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Key Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• QR code payment generation</li>
                    <li>• Real-time payment tracking</li>
                    <li>• Revenue analytics & insights</li>
                    <li>• Customer management</li>
                    <li>• Transaction reporting & export</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Try Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Implementation */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Technical Implementation
            </CardTitle>
            <CardDescription>
              Built with modern web technologies and blockchain integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">TS</span>
                </div>
                <h4 className="font-medium">TypeScript</h4>
                <p className="text-sm text-gray-600">Type-safe development</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-cyan-600 font-bold">⚛️</span>
                </div>
                <h4 className="font-medium">React 18</h4>
                <p className="text-sm text-gray-600">Modern UI framework</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">Ξ</span>
                </div>
                <h4 className="font-medium">Aptos SDK</h4>
                <p className="text-sm text-gray-600">Aptos interaction</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-slate-600 font-bold">UI</span>
                </div>
                <h4 className="font-medium">Shadcn/UI</h4>
                <p className="text-sm text-gray-600">Beautiful components</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Ready to experience the future of digital payments?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  1
                </div>
                <h4 className="font-medium mb-2">Choose Your Role</h4>
                <p className="text-sm text-gray-600">
                  Select between User Dashboard for personal use or Merchant Dashboard for business
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  2
                </div>
                <h4 className="font-medium mb-2">Set Up Wallet</h4>
                <p className="text-sm text-gray-600">
                  Create a new wallet or import existing one with secure encryption
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  3
                </div>
                <h4 className="font-medium mb-2">Start Transacting</h4>
                <p className="text-sm text-gray-600">
                  Send payments, generate QR codes, and manage your crypto with ease
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
              <Button 
                onClick={() => navigate('/enhanced-user-dashboard')}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Wallet className="h-5 w-5 mr-2" />
                Try User Dashboard
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Wallet className="h-5 w-5 mr-2" />
                Try Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoPage;
