import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/Components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 * 
 * Requirement 7.5: Error handling for consultation workflow
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error details
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // Update state with error info
        this.setState({
            error,
            errorInfo,
        });

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Something went wrong
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    An unexpected error occurred in the application
                                </p>
                            </div>
                        </div>

                        {this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h3 className="text-sm font-semibold text-red-900 mb-2">
                                    Error Details:
                                </h3>
                                <p className="text-sm text-red-800 font-mono">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <summary className="text-sm font-semibold text-gray-900 cursor-pointer">
                                    Stack Trace (Development Only)
                                </summary>
                                <pre className="mt-3 text-xs text-gray-700 overflow-auto max-h-64">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={this.handleReset}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </Button>
                            <Button
                                onClick={this.handleGoHome}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Go to Home
                            </Button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                If this problem persists, please contact your system administrator
                                or IT support team.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
