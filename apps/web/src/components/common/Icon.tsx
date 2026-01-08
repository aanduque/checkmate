import React from 'react';

export interface IconProps {
  name: string;
  className?: string;
  size?: 'small' | 'default' | 'large';
  onClick?: () => void;
}

/**
 * Icon component wrapper for Ionicons
 * Uses the ion-icon web component which is initialized in main.tsx
 */
export function Icon({ name, className = '', size = 'default', onClick }: IconProps) {
  const sizeClass = size === 'small' ? 'text-base'
    : size === 'large' ? 'text-2xl'
    : 'text-xl';

  return (
    <ion-icon
      name={name}
      class={`${sizeClass} ${className}`}
      onClick={onClick}
    />
  );
}
