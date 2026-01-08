import React from 'react';

interface FABProps {
  onClick: () => void;
  icon?: string;
}

export function FAB({ onClick, icon = '+' }: FABProps) {
  return (
    <button
      className="btn btn-circle btn-primary btn-lg fixed right-4 bottom-24 shadow-lg z-10"
      onClick={onClick}
    >
      <span className="text-2xl">{icon}</span>
    </button>
  );
}
