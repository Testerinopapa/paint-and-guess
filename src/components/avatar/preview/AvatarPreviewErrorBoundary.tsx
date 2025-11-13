import React, { Component, ErrorInfo, ReactNode } from "react";
import { AvatarConfig, createDefaultAvatarConfig } from "@/lib/avatar/config";
import { AvatarPreviewDicebear } from "./AvatarPreviewDicebear";

interface Props {
  children: ReactNode;
  fallbackConfig?: AvatarConfig;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for avatar preview rendering
 * Prevents the entire app from crashing if avatar rendering fails
 */
export class AvatarPreviewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Avatar preview error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback avatar
      const fallback = this.props.fallbackConfig || createDefaultAvatarConfig();
      return (
        <div className="flex flex-col items-center justify-center gap-2">
          <AvatarPreviewDicebear config={fallback} size={200} />
          <p className="text-xs text-muted-foreground text-center">
            Preview unavailable
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

