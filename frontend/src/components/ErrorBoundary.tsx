/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error messages
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full cosmic-glow border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-destructive">
                    Oops! Something went wrong
                  </CardTitle>
                  <CardDescription>
                    An unexpected error occurred in the application
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
                </AlertDescription>
              </Alert>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 p-4 bg-muted/50 rounded-md border border-border">
                  <summary className="cursor-pointer font-medium text-sm mb-2">
                    Technical Details (Development Only)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-64 mt-2">
                    {this.state.error?.stack}
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-md">
                <p className="text-sm text-blue-300">
                  <strong>💡 What you can do:</strong>
                </p>
                <ul className="text-sm text-blue-300/80 mt-2 space-y-1 list-disc list-inside">
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache</li>
                  <li>Check your internet connection</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
