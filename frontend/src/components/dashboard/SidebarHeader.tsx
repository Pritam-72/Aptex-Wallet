import React from 'react';
import { motion } from 'framer-motion';

interface SidebarHeaderProps {
  sidebarOpen: boolean;
  currentAccount: any;
  balance: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  sidebarOpen,
  currentAccount,
  balance
}) => {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden ultra-minimal-scrollbar">
      {/* Logo and Brand */}
      <motion.div
        className={`flex items-center mb-6 px-1 ${
          sidebarOpen ? 'gap-3' : 'justify-center gap-0'
        }`}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <div className="h-10 w-10 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <img src="/logo.png" alt="Aptex Wallet Logo" className="h-5 w-5 object-contain" />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col">
            <span className="font-bold text-xl text-foreground tracking-tight">Aptex wallet</span>
            <span className="text-xs text-muted-foreground/70">Wallet</span>
          </div>
        )}
      </motion.div>

      {/* Quick Stats */}
      {currentAccount && (
        <motion.div
          className={`mb-4 p-3 bg-card/30 rounded-lg border border-border/30 ${
            !sidebarOpen ? 'hidden' : ''
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: sidebarOpen ? 1 : 0, y: sidebarOpen ? 0 : 20 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-xs text-muted-foreground mb-1">Balance</div>
          <div className="text-lg font-bold text-foreground">{balance}</div>
          <div className="text-xs text-green-400">+2.3% today</div>
        </motion.div>
      )}
    </div>
  );
};