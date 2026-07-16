import * as React from 'react';
import { ErrorState } from './ErrorState';

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  label?: string;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
}

export class WidgetErrorBoundary extends React.Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  state: WidgetErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Safe development logging only — never logs request payloads or tokens.
    console.error(`[widget-error]${this.props.label ? ` ${this.props.label}` : ''}`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="This widget couldn't load"
          message="Other parts of the page are unaffected."
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
