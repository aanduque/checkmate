import React from 'react';

type View = 'focus' | 'tasks' | 'stats' | 'settings';

interface DockProps {
  currentView: View;
}

interface NavItem {
  id: View;
  path: string;
  icon: string;
  label: string;
}

export function Dock({ currentView }: DockProps) {
  const items: NavItem[] = [
    { id: 'focus', path: '/focus', icon: 'radio-button-on-outline', label: 'Focus' },
    { id: 'tasks', path: '/tasks', icon: 'list-outline', label: 'Tasks' },
    { id: 'stats', path: '/stats', icon: 'stats-chart-outline', label: 'Stats' },
    { id: 'settings', path: '/settings', icon: 'settings-outline', label: 'Settings' }
  ];

  return (
    <nav className="btm-nav btm-nav-md bg-base-100 border-t border-base-300">
      {items.map(item => (
        <a
          key={item.id}
          href={item.path}
          className={currentView === item.id ? 'active text-primary' : ''}
        >
          <ion-icon name={item.icon} class="text-xl"></ion-icon>
          <span className="btm-nav-label text-xs">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
