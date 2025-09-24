import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export interface SidebarLinkProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  shortcut?: string;
  isAction?: boolean;
}

interface EnhancedSidebarLinkProps {
  link: SidebarLinkProps;
  isCollapsed: boolean;
}

export const EnhancedSidebarLink: React.FC<EnhancedSidebarLinkProps> = ({ 
  link, 
  isCollapsed 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (link.onClick) {
      link.onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center w-full rounded-lg text-left
        relative overflow-hidden transition-all duration-200
        ${isCollapsed ? 'gap-0 px-2 py-3 justify-center' : 'gap-5 px-6 py-4'}
        ${link.isActive
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
        }
        ${link.isAction ? 'border border-dashed border-border/50' : ''}
      `}
      title={isCollapsed ? link.label : undefined}
    >
      {/* Active indicator */}
      {link.isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
      )}

      {/* Background hover effect */}
      <div className="absolute inset-0 bg-muted/20 rounded-lg opacity-0 hover:opacity-100" />

      {/* Icon */}
      <div className={`relative z-10 flex items-center justify-center ${
        link.isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}>
        {link.icon}
      </div>

      {/* Label - hidden when collapsed */}
      {!isCollapsed && (
        <>
          <span className="relative z-10 text-base font-medium flex-1">
            {link.label}
          </span>

          {/* Keyboard shortcut hint */}
          {link.shortcut && (
            <span className="relative z-10 text-xl text-muted-foreground/80 font-mono">
              {link.shortcut}
            </span>
          )}

          {/* Action indicator */}
          {link.isAction && (
            <div className="relative z-10">
              <Plus className="h-3 w-3 text-muted-foreground/50" />
            </div>
          )}
        </>
      )}
    </button>
  );
};