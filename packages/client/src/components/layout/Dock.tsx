import React from 'react';

type View = 'focus' | 'tasks' | 'stats';

interface DockProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function Dock({ currentView, onViewChange }: DockProps) {
  const items = [
    { id: 'focus' as View, icon: '🎯', label: 'Focus' },
    { id: 'tasks' as View, icon: '📋', label: 'Tasks' },
    { id: 'stats' as View, icon: '📊', label: 'Stats' }
  ];

  return (
    <nav className="btm-nav btm-nav-md bg-base-200 border-t border-base-300">
      {items.map(item => (
        <button
          key={item.id}
          className={`${currentView === item.id ? 'active text-primary' : ''}`}
          onClick={() => onViewChange(item.id)}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="btm-nav-label text-xs">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
