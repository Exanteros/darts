import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, loading, loadingText, disabled, className, variant, size, asChild, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn(className, loading && 'cursor-not-allowed')}
        variant={variant}
        size={size}
        asChild={asChild}
        {...props}
      >
        <>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading && loadingText ? loadingText : children}
        </>
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
