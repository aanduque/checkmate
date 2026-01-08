import React from 'react';

interface FABProps {
  onClick: () => void;
  icon?: string;
}

export function FAB({ onClick, icon = 'add-outline' }: FABProps) {
  return (
    <button
      className="btn btn-circle btn-primary btn-lg fixed right-4 bottom-24 shadow-lg z-10"
      onClick={onClick}
      aria-label="Create new task"
    >
      <ion-icon name={icon} style={{ fontSize: '1.5rem' }}></ion-icon>
    </button>
  );
}
