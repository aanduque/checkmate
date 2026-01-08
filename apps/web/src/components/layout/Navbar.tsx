import React from 'react';
import { useStore, useSelector } from 'statux';
import type { RoutineDTO, AppState } from '../../store';

export function Navbar() {
  const routines = useSelector<RoutineDTO[]>('routines');
  const manualRoutineId = useSelector<string | null>('ui.manualRoutineId');

  // Determine active routine (simplified until backend provides proper routine determination)
  const activeRoutine = manualRoutineId === '__planning__'
    ? { id: '__planning__', name: 'Planning', icon: '📋', color: '#6366f1' }
    : manualRoutineId
      ? routines.find(r => r.id === manualRoutineId)
      : routines.length > 0 ? routines[0] : null;

  const handleThemeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const theme = event.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('checkmate_theme', theme);
  };

  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.getAttribute('data-theme') === 'dark'
    : false;

  return (
    <div className="navbar bg-base-100 shadow-sm sticky top-0 z-10">
      <div className="navbar-start gap-2">
        <ion-icon name="checkbox-outline" class="text-2xl text-primary"></ion-icon>
        <span className="font-bold text-lg">Check Mate</span>
      </div>

      <div className="navbar-center">
        {activeRoutine && (
          <div
            className="badge gap-1"
            style={{
              backgroundColor: `${activeRoutine.color}20`,
              color: activeRoutine.color
            }}
          >
            <span>{activeRoutine.icon}</span>
            <span className="hidden sm:inline">{activeRoutine.name}</span>
          </div>
        )}
      </div>

      <div className="navbar-end gap-1">
        {/* Theme Toggle */}
        <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm">
          <input
            type="checkbox"
            className="theme-controller"
            onChange={handleThemeToggle}
            defaultChecked={isDarkMode}
          />
          <ion-icon name="sunny-outline" class="swap-off text-xl"></ion-icon>
          <ion-icon name="moon-outline" class="swap-on text-xl"></ion-icon>
        </label>

        {/* Drawer Toggle */}
        <label htmlFor="main-drawer" className="btn btn-ghost btn-circle btn-sm">
          <ion-icon name="menu-outline" class="text-xl"></ion-icon>
        </label>
      </div>
    </div>
  );
}

// Note: ion-icon type declaration is in components/common/Icon.tsx
