import React from 'react';
import {AlertTriangle, RotateCcw} from 'lucide-react';
import {getFriendlyErrorMessage} from '../lib/firestoreError';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error) {
    console.error('Uncaught application error:', error);
  }

  handleReset = () => {
    this.setState({hasError: false, error: null});
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const friendlyMessage = getFriendlyErrorMessage(
        this.state.error,
        'Đã xảy ra sự cố không mong muốn trong ứng dụng.'
      );
      return (
        <div className="flex min-h-dvh items-center justify-center bg-white p-6">
          <div className="w-full max-w-md border border-[#E5E5E2] bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-[#FEF2F2] text-[#B91C1C]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h1 className="font-display text-3xl font-medium text-[#111110]">
              Có lỗi xảy ra
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#52524E]">{friendlyMessage}</p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sm bg-[#111110] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#1D3B72] transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Tải lại ứng dụng
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
