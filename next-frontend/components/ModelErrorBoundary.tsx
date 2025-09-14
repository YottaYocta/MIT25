'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ModelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ModelErrorBoundary: Error caught, switching to error state:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ModelErrorBoundary: Model loading error details:', error);
    console.error('🚨 ModelErrorBoundary: Error info:', errorInfo);
    console.error('🚨 ModelErrorBoundary: Component stack:', errorInfo.componentStack);
    
    // Log detailed error information for debugging
    if (error.message.includes('fetch')) {
      console.error('🌐 ModelErrorBoundary: Network error - Model file could not be fetched');
    } else if (error.message.includes('parse') || error.message.includes('invalid')) {
      console.error('🔧 ModelErrorBoundary: Parse error - Model file format is invalid or corrupted');
    } else if (error.message.includes('404')) {
      console.error('🔍 ModelErrorBoundary: File not found - Model file does not exist');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.error('🔐 ModelErrorBoundary: Authentication error - No permission to access model file');
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color="#ff6b6b" 
            transparent 
            opacity={0.7}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
      );
    }

    return this.props.children;
  }
}
