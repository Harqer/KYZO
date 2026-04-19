/**
 * AuthButton - Atomic Component
 * Basic authentication button atom following Atomic Design principles
 * Can't be broken down further without ceasing to be functional
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, User, LogIn, LogOut } from 'lucide-react';

interface AuthButtonProps {
  variant: 'login' | 'logout' | 'authenticated';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  variant,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  size = 'md',
  fullWidth = false,
}) => {
  const getIcon = () => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    
    switch (variant) {
      case 'login':
        return <LogIn className="w-4 h-4" />;
      case 'logout':
        return <LogOut className="w-4 h-4" />;
      case 'authenticated':
        return <User className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getText = () => {
    if (loading) return 'Processing...';
    
    switch (variant) {
      case 'login':
        return 'Sign In';
      case 'logout':
        return 'Sign Out';
      case 'authenticated':
        return 'Account';
      default:
        return 'Button';
    }
  };

  const getVariant = () => {
    switch (variant) {
      case 'login':
        return 'default';
      case 'logout':
        return 'outline';
      case 'authenticated':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Button
      variant={getVariant()}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {getIcon()}
      <span className="ml-2">{getText()}</span>
    </Button>
  );
};

export default AuthButton;
