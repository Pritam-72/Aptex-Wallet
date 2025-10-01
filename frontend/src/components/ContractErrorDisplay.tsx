/**
 * Contract Error Display Component
 * Displays user-friendly error messages for smart contract errors
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { parseContractError, ContractError } from '@/utils/errorHandler';

interface ContractErrorDisplayProps {
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ContractErrorDisplay: React.FC<ContractErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
}) => {
  if (!error) return null;

  const errorDetails = parseContractError(error);
  if (!errorDetails) return null;

  const getIcon = () => {
    switch (errorDetails.severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVariant = (): 'default' | 'destructive' => {
    return errorDetails.severity === 'error' ? 'destructive' : 'default';
  };

  const getAlertClass = () => {
    switch (errorDetails.severity) {
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-700/30 text-yellow-300';
      case 'info':
        return 'bg-blue-900/20 border-blue-700/30 text-blue-300';
      default:
        return '';
    }
  };

  return (
    <Alert variant={getVariant()} className={`${getAlertClass()} ${className}`}>
      {getIcon()}
      <div className="flex-1">
        <AlertTitle className="flex items-center justify-between">
          <span>{errorDetails.title}</span>
          {errorDetails.code > 0 && (
            <span className="text-xs font-mono opacity-70">
              Error Code: {errorDetails.code}
            </span>
          )}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{errorDetails.message}</p>
          
          {errorDetails.suggestion && (
            <p className="text-sm opacity-90 mt-2">
              <strong>💡 Suggestion:</strong> {errorDetails.suggestion}
            </p>
          )}

          {(onRetry || onDismiss || errorDetails.action) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  variant={errorDetails.severity === 'error' ? 'destructive' : 'outline'}
                  className="text-xs"
                >
                  {errorDetails.action || 'Try Again'}
                </Button>
              )}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};

/**
 * Inline error message component (smaller, for forms)
 */
interface InlineErrorProps {
  error: unknown;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  const errorDetails = parseContractError(error);
  if (!errorDetails) return null;

  return (
    <div className={`text-sm text-destructive flex items-start gap-2 ${className}`}>
      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium">{errorDetails.title}</p>
        <p className="text-xs opacity-90 mt-0.5">{errorDetails.message}</p>
      </div>
    </div>
  );
};


