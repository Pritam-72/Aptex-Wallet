import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  QrCode,
  Search,
  Users,
  Copy,
  ExternalLink,
  Download,
  Upload
} from 'lucide-react';
import { 
  addUpiMapping, 
  getUserUpiMappings, 
  removeUpiMapping, 
  isValidUpiId,
  searchUpiMappings,
  parseUpiQr,
  getUpiDirectoryStats,
  getAllUpiMappings,
  upiIdExists,
  type UpiMapping 
} from '@/utils/upiStorage';

export const UpiDashboard: React.FC = () => {
  const [upiMappings, setUpiMappings] = useState<UpiMapping[]>([]);
  const [filteredMappings, setFilteredMappings] = useState<UpiMapping[]>([]);
  const [newUpiId, setNewUpiId] = useState('');
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalMappings: 0,
    validMappings: 0,
    recentlyAdded: 0,
    globalMappings: 0,
    uniqueWallets: 0,
    totalLookups: 0
  });
  const [showGlobalView, setShowGlobalView] = useState(false);
  const { toast } = useToast();

  // Load UPI mappings on component mount
  useEffect(() => {
    loadUpiMappings();
  }, []);

  // Reload data when view changes
  useEffect(() => {
    loadUpiMappings();
  }, [showGlobalView]);

  // Filter mappings based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMappings(upiMappings);
    } else {
      const filtered = searchUpiMappings(searchQuery);
      setFilteredMappings(filtered);
    }
  }, [searchQuery, upiMappings]);

  const loadUpiMappings = () => {
    try {
      const mappings = getUserUpiMappings(showGlobalView);
      setUpiMappings(mappings);
      setFilteredMappings(mappings);
      
      // Get global directory statistics
      const directoryStats = getUpiDirectoryStats();
      
      // Calculate local stats
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentCount = mappings.filter(m => new Date(m.createdAt) > oneWeekAgo).length;
      
      setStats({
        totalMappings: mappings.length,
        validMappings: mappings.filter(m => isValidUpiId(m.upiId)).length,
        recentlyAdded: recentCount,
        globalMappings: directoryStats.totalMappings,
        uniqueWallets: directoryStats.uniqueWallets,
        totalLookups: directoryStats.totalLookups
      });
    } catch (error) {
      console.error('Error loading UPI mappings:', error);
      toast({
        title: "Error",
        description: "Failed to load UPI mappings",
        variant: "destructive",
      });
    }
  };

  const getCurrentWalletAddress = (): string | null => {
    try {
      const walletData = localStorage.getItem('cryptal_wallet');
      if (walletData) {
        const parsedWalletData = JSON.parse(walletData);
        const currentIndex = parsedWalletData.currentAccountIndex || 0;
        const currentAccount = parsedWalletData.accounts?.[currentIndex];
        return currentAccount?.address || null;
      }
    } catch (error) {
      console.error('Error getting current wallet address:', error);
    }
    return null;
  };

  const handleAddMapping = async () => {
    if (!newUpiId.trim()) {
      setError('Please enter a UPI ID');
      return;
    }

    if (!isValidUpiId(newUpiId.trim())) {
      setError('Please enter a valid UPI ID (e.g., user@paytm)');
      return;
    }

    const currentAddress = getCurrentWalletAddress();
    if (!currentAddress) {
      setError('No active wallet found. Please connect your wallet first.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await addUpiMapping(newUpiId.trim(), currentAddress, newName.trim() || undefined);
      
      toast({
        title: "UPI Mapping Added",
        description: `Successfully mapped ${newUpiId} to your wallet`,
      });

      // Reset form and reload mappings
      setNewUpiId('');
      setNewName('');
      loadUpiMappings();
    } catch (error: any) {
      setError(error.message || 'Failed to add UPI mapping');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMapping = (upiId: string) => {
    try {
      const success = removeUpiMapping(upiId);
      if (success) {
        toast({
          title: "UPI Mapping Removed",
          description: `Successfully removed ${upiId} mapping`,
        });
        loadUpiMappings();
      } else {
        toast({
          title: "Error",
          description: "Failed to remove UPI mapping",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove UPI mapping",
        variant: "destructive",
      });
    }
  };

  const handleCopyUpiId = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    toast({
      title: "Copied",
      description: `UPI ID ${upiId} copied to clipboard`,
    });
  };

  const handleExportMappings = () => {
    const data = JSON.stringify(upiMappings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'upi-mappings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "UPI mappings exported successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">UPI Management</h1>
          <p className="text-gray-400 mt-1">
            Manage your UPI ID mappings and payment handles
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportMappings}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setShowGlobalView(false)}
          variant={!showGlobalView ? "default" : "outline"}
          className={!showGlobalView ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"}
        >
          My UPI IDs
        </Button>
        <Button
          onClick={() => setShowGlobalView(true)}
          variant={showGlobalView ? "default" : "outline"}
          className={showGlobalView ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"}
        >
          Global Directory
        </Button>
        <Badge variant="secondary" className="bg-gray-800 text-gray-300">
          {showGlobalView ? `${stats.globalMappings} total` : `${stats.totalMappings} yours`}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{showGlobalView ? stats.globalMappings : stats.totalMappings}</p>
                <p className="text-sm text-gray-400">{showGlobalView ? 'Global UPI IDs' : 'Your UPI IDs'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.uniqueWallets}</p>
                <p className="text-sm text-gray-400">Unique Wallets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Search className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalLookups}</p>
                <p className="text-sm text-gray-400">Total Lookups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Plus className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.recentlyAdded}</p>
                <p className="text-sm text-gray-400">{showGlobalView ? 'Global Recent' : 'Added This Week'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Directory Info */}
      {showGlobalView && (
        <Card className="bg-blue-950/50 border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-blue-300 font-medium">Global UPI Directory</h3>
                <p className="text-sm text-blue-200">Shared UPI ID mappings across all wallets</p>
              </div>
            </div>
            <p className="text-sm text-blue-200">
              This directory shows all UPI IDs that have been mapped to wallet addresses by any user. 
              When someone sends money using a UPI ID, the system looks up the corresponding wallet address here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add New UPI Mapping - Only show in personal view */}
      {!showGlobalView && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New UPI ID
            </CardTitle>
            <CardDescription className="text-gray-400">
              Link a new UPI ID to your current wallet address
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-950 border-red-800 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="upiId" className="text-gray-300">UPI ID *</Label>
              <Input
                id="upiId"
                type="text"
                placeholder="yourname@paytm"
                value={newUpiId}
                onChange={(e) => setNewUpiId(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              />
              {newUpiId && (
                <div className="text-xs">
                  {isValidUpiId(newUpiId) ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Valid UPI ID format
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Invalid format (e.g., user@paytm)
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Display Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <Button
            onClick={handleAddMapping}
            disabled={isLoading || !newUpiId.trim() || !isValidUpiId(newUpiId.trim())}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </div>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add UPI Mapping
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Search and Filter */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search UPI IDs or names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <Badge variant="secondary" className="bg-gray-800 text-gray-300">
              {filteredMappings.length} result{filteredMappings.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* UPI Mappings List */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Your UPI Mappings
          </CardTitle>
          <CardDescription className="text-gray-400">
            All UPI IDs linked to your wallet address
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMappings.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery ? (
                <div className="text-gray-400">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No UPI mappings found for "{searchQuery}"</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="text-gray-400">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No UPI mappings found</p>
                  <p className="text-sm mt-1">Add your first UPI ID to get started</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMappings.map((mapping, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-white font-medium truncate">{mapping.upiId}</span>
                      <Button
                        onClick={() => handleCopyUpiId(mapping.upiId)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {mapping.name && (
                      <p className="text-sm text-gray-400 mb-1">{mapping.name}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Added {new Date(mapping.createdAt).toLocaleDateString()}</span>
                      {mapping.lastUsed && (
                        <span>Last used {new Date(mapping.lastUsed).toLocaleDateString()}</span>
                      )}
                      <span className="font-mono">
                        {mapping.publicKey.slice(0, 6)}...{mapping.publicKey.slice(-4)}
                      </span>
                      {showGlobalView && mapping.walletName && (
                        <span className="text-blue-400">({mapping.walletName})</span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleRemoveMapping(mapping.upiId)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/50 ml-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-950/50 border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-300">How UPI Integration Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-blue-200 font-medium mb-2">For Receiving Payments:</h4>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Add your UPI IDs to create mappings</li>
                <li>• Share your UPI ID instead of wallet address</li>
                <li>• Others can send crypto using your UPI ID</li>
                <li>• Works with UPI QR code scanning</li>
              </ul>
            </div>
            <div>
              <h4 className="text-blue-200 font-medium mb-2">For Sending Payments:</h4>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Enter recipient's UPI ID in send form</li>
                <li>• Scan their UPI QR codes directly</li>
                <li>• System resolves UPI ID to wallet address</li>
                <li>• Transaction completes normally</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};