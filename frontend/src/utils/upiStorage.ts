interface UpiMapping {
  upiId: string;
  publicKey: string;
  name?: string;
  createdAt: Date;
  walletName?: string; // Optional wallet identifier for display
  lastUsed?: Date; // Track when this mapping was last used
}

interface UpiStorageData {
  mappings: UpiMapping[];
  version: string;
  lastUpdated: Date;
  totalLookups: number; // Track how many times the directory was accessed
}

const UPI_STORAGE_KEY = 'cryptal_global_upi_directory';
const STORAGE_VERSION = '2.0.0'; // Updated version for global storage

// Initialize UPI storage
const initializeUpiStorage = (): UpiStorageData => {
  return {
    mappings: [],
    version: STORAGE_VERSION,
    lastUpdated: new Date(),
    totalLookups: 0
  };
};

// Get UPI storage data with migration support
export const getUpiStorageData = (incrementLookup: boolean = false): UpiStorageData => {
  try {
    // Check for old storage format first
    const oldData = localStorage.getItem('cryptal_upi_mappings');
    const newData = localStorage.getItem(UPI_STORAGE_KEY);
    
    let storageData: UpiStorageData;
    
    if (!newData && oldData) {
      // Migrate from old format
      console.log('Migrating UPI mappings to global directory...');
      const oldMappings = JSON.parse(oldData);
      storageData = {
        mappings: oldMappings.mappings || [],
        version: STORAGE_VERSION,
        lastUpdated: new Date(),
        totalLookups: 1
      };
      
      // Save migrated data and remove old data
      localStorage.setItem(UPI_STORAGE_KEY, JSON.stringify(storageData));
      localStorage.removeItem('cryptal_upi_mappings');
      
      console.log(`Migrated ${storageData.mappings.length} UPI mappings to global directory`);
    } else if (newData) {
      storageData = JSON.parse(newData);
      
      // Ensure all required fields exist (backward compatibility)
      if (!storageData.lastUpdated) storageData.lastUpdated = new Date();
      if (!storageData.totalLookups) storageData.totalLookups = 0;
      if (!storageData.version) storageData.version = STORAGE_VERSION;
      
      // Increment lookup counter if requested
      if (incrementLookup) {
        storageData.totalLookups++;
        localStorage.setItem(UPI_STORAGE_KEY, JSON.stringify(storageData));
      }
    } else {
      // Initialize new storage
      storageData = initializeUpiStorage();
      localStorage.setItem(UPI_STORAGE_KEY, JSON.stringify(storageData));
    }
    
    return storageData;
  } catch (error) {
    console.error('Error reading UPI storage:', error);
    return initializeUpiStorage();
  }
};

// Save UPI storage data
const saveUpiStorageData = (data: UpiStorageData): void => {
  try {
    // Always update the lastUpdated timestamp when saving
    data.lastUpdated = new Date();
    localStorage.setItem(UPI_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving UPI storage:', error);
    throw new Error('Failed to save UPI mapping');
  }
};

// Helper function to get wallet identifier for display
const getWalletIdentifier = (publicKey: string): string => {
  try {
    // Try to get wallet name from local storage
    const walletData = localStorage.getItem('cryptal_wallet');
    if (walletData) {
      const parsedData = JSON.parse(walletData);
      const account = parsedData.accounts?.find((acc: any) => acc.address === publicKey);
      if (account && account.name) {
        return account.name;
      }
    }
    
    // Fallback to shortened address
    return `Wallet ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;
  } catch (error) {
    return `Wallet ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;
  }
};

// Helper function to get current wallet address
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

// Add a new UPI mapping to the global directory
export const addUpiMapping = (upiId: string, publicKey: string, name?: string, walletName?: string): boolean => {
  try {
    const data = getUpiStorageData();
    
    // Check if UPI ID already exists
    const existingMapping = data.mappings.find(mapping => mapping.upiId.toLowerCase() === upiId.toLowerCase());
    if (existingMapping) {
      // If it's the same wallet updating their mapping, allow it
      if (existingMapping.publicKey === publicKey) {
        existingMapping.name = name;
        existingMapping.walletName = walletName;
        existingMapping.lastUsed = new Date();
        saveUpiStorageData(data);
        return true;
      } else {
        throw new Error(`UPI ID ${upiId} is already mapped to another wallet (${existingMapping.publicKey.slice(0, 8)}...)`);
      }
    }
    
    // Validate UPI ID format
    if (!isValidUpiId(upiId)) {
      throw new Error('Invalid UPI ID format');
    }
    
    // Get wallet identifier for display
    const walletIdentifier = walletName || getWalletIdentifier(publicKey);
    
    const newMapping: UpiMapping = {
      upiId: upiId.toLowerCase(),
      publicKey,
      name,
      walletName: walletIdentifier,
      createdAt: new Date(),
      lastUsed: new Date()
    };
    
    data.mappings.push(newMapping);
    saveUpiStorageData(data);
    
    console.log(`Added UPI mapping: ${upiId} → ${publicKey.slice(0, 8)}... to global directory`);
    return true;
  } catch (error) {
    console.error('Error adding UPI mapping:', error);
    throw error;
  }
};

// Get public key by UPI ID from global directory
export const getPublicKeyByUpiId = (upiId: string): string | null => {
  try {
    const data = getUpiStorageData(true); // Increment lookup counter
    const mapping = data.mappings.find(m => m.upiId === upiId.toLowerCase());
    
    if (mapping) {
      // Update lastUsed timestamp for this mapping
      mapping.lastUsed = new Date();
      saveUpiStorageData(data);
      
      console.log(`UPI lookup: ${upiId} → ${mapping.publicKey.slice(0, 8)}... (${mapping.walletName || 'Unknown Wallet'})`);
      return mapping.publicKey;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting public key by UPI ID:', error);
    return null;
  }
};

// Get UPI ID by public key
export const getUpiIdByPublicKey = (publicKey: string): string | null => {
  try {
    const data = getUpiStorageData();
    const mapping = data.mappings.find(m => m.publicKey === publicKey);
    return mapping ? mapping.upiId : null;
  } catch (error) {
    console.error('Error getting UPI ID by public key:', error);
    return null;
  }
};

// Get UPI mappings for current user (or all if showAll is true)
export const getUserUpiMappings = (showAll: boolean = false): UpiMapping[] => {
  try {
    const data = getUpiStorageData();
    
    if (showAll) {
      return data.mappings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    // Get current user's wallet address
    const currentAddress = getCurrentWalletAddress();
    if (!currentAddress) {
      return [];
    }
    
    // Filter mappings for current user
    return data.mappings
      .filter(mapping => mapping.publicKey === currentAddress)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting user UPI mappings:', error);
    return [];
  }
};

// Remove UPI mapping
export const removeUpiMapping = (upiId: string): boolean => {
  try {
    const data = getUpiStorageData();
    const initialLength = data.mappings.length;
    data.mappings = data.mappings.filter(mapping => mapping.upiId !== upiId.toLowerCase());
    
    if (data.mappings.length === initialLength) {
      return false; // No mapping found to remove
    }
    
    saveUpiStorageData(data);
    return true;
  } catch (error) {
    console.error('Error removing UPI mapping:', error);
    return false;
  }
};

// Validate UPI ID format
export const isValidUpiId = (upiId: string): boolean => {
  // Basic UPI ID validation: must contain @ and have valid format
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
};

// Parse UPI QR code data
export const parseUpiQr = (qrData: string): { upiId: string; name?: string; amount?: string } | null => {
  try {
    // Handle UPI QR format: upi://pay?pa=upiid@provider&pn=name&am=amount
    if (qrData.startsWith('upi://pay?')) {
      const url = new URL(qrData);
      const upiId = url.searchParams.get('pa');
      const name = url.searchParams.get('pn');
      const amount = url.searchParams.get('am');
      
      if (upiId && isValidUpiId(upiId)) {
        return {
          upiId,
          name: name ? decodeURIComponent(name) : undefined,
          amount: amount || undefined
        };
      }
    }
    
    // Handle plain UPI ID
    if (isValidUpiId(qrData)) {
      return { upiId: qrData };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing UPI QR:', error);
    return null;
  }
};

// Search UPI mappings
export const searchUpiMappings = (query: string): UpiMapping[] => {
  try {
    const data = getUpiStorageData();
    const lowerQuery = query.toLowerCase();
    
    return data.mappings.filter(mapping => 
      mapping.upiId.toLowerCase().includes(lowerQuery) ||
      (mapping.name && mapping.name.toLowerCase().includes(lowerQuery)) ||
      mapping.publicKey.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching UPI mappings:', error);
    return [];
  }
};

// Get all UPI mappings from global directory (admin/debug function)
export const getAllUpiMappings = (): UpiMapping[] => {
  return getUserUpiMappings(true);
};

// Get directory statistics
export const getUpiDirectoryStats = () => {
  try {
    const data = getUpiStorageData();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentMappings = data.mappings.filter(m => new Date(m.createdAt) > oneWeekAgo);
    const monthlyMappings = data.mappings.filter(m => new Date(m.createdAt) > oneMonthAgo);
    const activeMappings = data.mappings.filter(m => m.lastUsed && new Date(m.lastUsed) > oneWeekAgo);
    
    return {
      totalMappings: data.mappings.length,
      recentMappings: recentMappings.length,
      monthlyMappings: monthlyMappings.length,
      activeMappings: activeMappings.length,
      totalLookups: data.totalLookups,
      lastUpdated: data.lastUpdated,
      uniqueWallets: new Set(data.mappings.map(m => m.publicKey)).size
    };
  } catch (error) {
    console.error('Error getting directory stats:', error);
    return {
      totalMappings: 0,
      recentMappings: 0,
      monthlyMappings: 0,
      activeMappings: 0,
      totalLookups: 0,
      lastUpdated: new Date(),
      uniqueWallets: 0
    };
  }
};

// Check if UPI ID exists in global directory
export const upiIdExists = (upiId: string): boolean => {
  try {
    const data = getUpiStorageData();
    return data.mappings.some(m => m.upiId.toLowerCase() === upiId.toLowerCase());
  } catch (error) {
    console.error('Error checking UPI ID existence:', error);
    return false;
  }
};

// Get mapping details by UPI ID
export const getUpiMappingDetails = (upiId: string): UpiMapping | null => {
  try {
    const data = getUpiStorageData();
    const mapping = data.mappings.find(m => m.upiId.toLowerCase() === upiId.toLowerCase());
    return mapping || null;
  } catch (error) {
    console.error('Error getting UPI mapping details:', error);
    return null;
  }
};

// Clear all UPI mappings (admin function)
export const clearAllUpiMappings = (): boolean => {
  try {
    const data = initializeUpiStorage();
    localStorage.setItem(UPI_STORAGE_KEY, JSON.stringify(data));
    console.log('Cleared all UPI mappings from global directory');
    return true;
  } catch (error) {
    console.error('Error clearing UPI mappings:', error);
    return false;
  }
};

export type { UpiMapping, UpiStorageData };