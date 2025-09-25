import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, QrCode, Copy, LogOut } from 'lucide-react';
import { type WalletAccount } from '@/utils/walletUtils';

interface SidebarFooterProps {
  currentAccount: WalletAccount | null;
  accountList: WalletAccount[];
  balance: string;
  sidebarOpen: boolean;
  onSwitchAccount: (index: number) => void;
  onShowReceiveQR: () => void;
  onCopyAddress: (address: string) => void;
  onLogout: () => void;
}

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  currentAccount,
  accountList,
  balance,
  sidebarOpen,
  onSwitchAccount,
  onShowReceiveQR,
  onCopyAddress,
  onLogout
}) => {
  return (
    <div className="pt-6 space-y-4">
      {currentAccount ? (
        <motion.div
          className={`space-y-4 ${!sidebarOpen ? 'hidden' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Current Wallet Display */}
          <div className="p-3 bg-card/20 rounded-lg border border-border/30">
            <div className="text-xs text-muted-foreground mb-2">Current Account</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 w-full h-auto p-0 justify-start text-left mb-3 hover:bg-transparent">
                  <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {currentAccount?.accountIndex !== undefined ? `Account ${currentAccount.accountIndex + 1}` : '...'}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400">Connected</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[250px]">
                {accountList.map((account) => (
                  <DropdownMenuItem
                    key={account.accountIndex}
                    onClick={() => onSwitchAccount(account.accountIndex)}
                    disabled={account.accountIndex === currentAccount?.accountIndex}
                  >
                    <div className="flex flex-col">
                      <span>Account {account.accountIndex + 1}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatAddress(account.address)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-2">
              <div className="text-sm font-mono flex-1 text-foreground">
                {currentAccount?.address && formatAddress(currentAccount.address)}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowReceiveQR}
                  className="h-7 w-7 p-1 hover:bg-muted/50"
                  title="Show QR Code"
                >
                  <QrCode className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyAddress(currentAccount?.address || '')}
                  className="h-7 w-7 p-1 hover:bg-muted/50"
                  title="Copy Address"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className={`space-y-4 ${!sidebarOpen ? 'hidden' : ''}`}>
          {/* Current Wallet Display */}
          <div className="p-3 bg-card/20 rounded-lg border border-border/30">
            <div className="text-xs text-muted-foreground mb-2">Current Account</div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Main Wallet</div>
                <div className="text-xs text-muted-foreground">Not connected</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed state: Show minimal connection status */}
      {!sidebarOpen && (
        <div className="flex flex-col items-center space-y-3">
          {currentAccount ? (
            <div className="flex flex-col items-center space-y-2">
              {/* Connected wallet indicator */}
              <div className="relative">
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center" title={`Account ${currentAccount.accountIndex + 1} - Connected\nBalance: ${balance}`}>
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse border-2 border-background"></div>
              </div>
              
              {/* Quick actions */}
              <div className="flex flex-col items-center space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowReceiveQR}
                  className="h-7 w-7 p-1 hover:bg-muted/50 rounded-lg"
                  title="Show QR Code"
                >
                  <QrCode className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              {/* Current wallet indicator when collapsed */}
              <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center" title="Main Wallet - Not connected">
                <Wallet className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Actions */}
      <div className="pt-4 border-t border-border/30 space-y-3">
        {sidebarOpen && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <span>Press ⌘B to toggle sidebar</span>
          </div>
        )}
        <Button
          variant="ghost"
          size={sidebarOpen ? "sm" : "sm"}
          onClick={onLogout}
          className={`${
            sidebarOpen 
              ? 'w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start' 
              : 'h-8 w-8 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 mx-auto'
          }`}
          title="Logout"
        >
          <LogOut className={`h-4 w-4 ${sidebarOpen ? 'mr-2' : ''}`} />
          {sidebarOpen && 'Logout'}
        </Button>
      </div>
    </div>
  );
};