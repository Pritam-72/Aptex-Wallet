import React from 'react';
import { motion } from 'framer-motion';

interface SidebarHeaderProps {
  sidebarOpen: boolean;
  currentAccount: any;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  sidebarOpen,
  currentAccount
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

    </div>
  );
};