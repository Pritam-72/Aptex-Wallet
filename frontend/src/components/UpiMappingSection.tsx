import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { 
  addUpiMapping, 
  getUserUpiMappings, 
  removeUpiMapping, 
  isValidUpiId,
  type UpiMapping 
} from '@/utils/upiStorage';

export const UpiMappingSection: React.FC = () => {
  const [upiMappings, setUpiMappings] = useState<UpiMapping[]>([]);
  const [newUpiId, setNewUpiId] = useState('');
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Load UPI mappings on component mount
  useEffect(() => {
    loadUpiMappings();
  }, []);

  const loadUpiMappings = () => {
    try {
      const mappings = getUserUpiMappings();
      setUpiMappings(mappings);
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

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            UPI Integration
          </CardTitle>
          <CardDescription className="text-gray-400">
            Link your UPI IDs to your wallet for easy transactions. Others can send you money using your UPI ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-950 border-red-800 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add New UPI Mapping */}
          <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium">Add New UPI ID</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upiId" className="text-gray-300">UPI ID</Label>
                <Input
                  id="upiId"
                  type="text"
                  placeholder="yourname@paytm"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                />
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
              disabled={isLoading || !newUpiId.trim()}
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
          </div>

          {/* Existing UPI Mappings */}
          <div className="space-y-3">
            <h3 className="text-white font-medium">Your UPI Mappings</h3>
            
            {upiMappings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No UPI mappings found</p>
                <p className="text-sm mt-1">Add your first UPI ID to get started</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {upiMappings.map((mapping, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-white font-medium">{mapping.upiId}</span>
                      </div>
                      {mapping.name && (
                        <p className="text-sm text-gray-400 mt-1">{mapping.name}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Added on {new Date(mapping.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => handleRemoveMapping(mapping.upiId)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-950/50 border border-blue-800 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">How it works:</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Map your UPI IDs to your current wallet address</li>
              <li>• Others can send you crypto by entering your UPI ID</li>
              <li>• UPI QR codes will automatically resolve to your wallet</li>
              <li>• You can have multiple UPI IDs mapped to the same wallet</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};