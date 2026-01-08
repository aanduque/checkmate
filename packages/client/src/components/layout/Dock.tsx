import React from 'react';
import { useUrl } from 'crossroad';
import { useStore } from 'statux';

export function Dock() {
  const [url, setUrl] = useUrl();
  const [, setCreateTaskModal] = useStore('ui.modals.createTask');

  const currentPath = url || '/focus';

  const navItems = [
    { path: '/focus', icon: 'radio-button-on-outline', label: 'Focus' },
    { path: '/tasks', icon: 'clipboard-outline', label: 'Tasks' },
    { path: '/stats', icon: 'stats-chart-outline', label: 'Stats' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 safe-area-pb">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => setUrl(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                currentPath === item.path
                  ? 'text-primary bg-primary/10'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              <ion-icon name={item.icon} class="text-xl"></ion-icon>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setCreateTaskModal(true)}
        className="btn btn-primary btn-circle btn-lg absolute -top-6 right-4 shadow-lg"
      >
        <ion-icon name="add-outline" class="text-2xl"></ion-icon>
      </button>
    </div>
  );
}
