/**
 * OAuthProviderIcon - Atomic Component
 * Displays OAuth provider icons with appropriate styling
 * Basic visual element that can't be broken down further
 */

import React from 'react';
import { 
  Github, 
  Google, 
  Mail, 
  Building, 
  Key,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type OAuthProvider = 'google' | 'github' | 'microsoft' | 'slack' | 'custom' | 'email';

interface OAuthProviderIconProps {
  provider: OAuthProvider;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'mono';
}

const providerIcons = {
  google: Google,
  github: Github,
  microsoft: Building,
  slack: Zap,
  custom: Key,
  email: Mail,
};

const providerColors = {
  google: 'text-red-500',
  github: 'text-gray-700',
  microsoft: 'text-blue-600',
  slack: 'text-purple-600',
  custom: 'text-gray-600',
  email: 'text-gray-500',
};

const providerNames = {
  google: 'Google',
  github: 'GitHub',
  microsoft: 'Microsoft',
  slack: 'Slack',
  custom: 'Custom',
  email: 'Email',
};

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const OAuthProviderIcon: React.FC<OAuthProviderIconProps> = ({
  provider,
  size = 'md',
  className = '',
  showLabel = false,
  variant = 'default',
}) => {
  const Icon = providerIcons[provider];
  const colorClass = variant === 'mono' ? 'text-current' : providerColors[provider];
  const sizeClass = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className={cn(sizeClass, colorClass)} />
      {showLabel && (
        <span className="text-sm font-medium">{providerNames[provider]}</span>
      )}
    </div>
  );
};

export default OAuthProviderIcon;
