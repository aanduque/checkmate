import React from 'react';
import { Switch, Route, usePath } from 'crossroad';
import { useStore } from 'statux';
import { Navbar } from './components/layout/Navbar';
import { Dock } from './components/layout/Dock';
import { Drawer } from './components/layout/Drawer';
import { FAB } from './components/layout/FAB';
import { ActiveSessionBanner } from './components/layout/ActiveSessionBanner';
import { FocusView } from './components/views/FocusView';
import { TasksView } from './components/views/TasksView';
import { StatsView } from './components/views/StatsView';
import { SettingsView } from './components/views/SettingsView';
import { CreateTaskModal } from './components/modals/CreateTaskModal';

export function App() {
  const [path] = usePath();
  const [ui, setUi] = useStore<typeof import('./store').initialState.ui>('ui');

  const handleOpenCreateTask = () => {
    setUi((prev: typeof ui) => ({
      ...prev,
      modals: { ...prev.modals, createTask: true }
    }));
  };

  const handleCloseCreateTask = () => {
    setUi((prev: typeof ui) => ({
      ...prev,
      modals: { ...prev.modals, createTask: false }
    }));
  };

  const handleTaskCreated = () => {
    setUi((prev: typeof ui) => ({
      ...prev,
      refreshKey: prev.refreshKey + 1,
      modals: { ...prev.modals, createTask: false }
    }));
  };

  // Determine current view for Dock highlighting based on path
  const currentView = path === '/tasks' ? 'tasks'
    : path === '/stats' ? 'stats'
    : path === '/settings' ? 'settings'
    : 'focus';

  return (
    <div className="drawer drawer-end">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main Content */}
      <div className="drawer-content flex flex-col min-h-screen bg-base-200">
        <Navbar />

        {/* Global Active Session Banner */}
        <ActiveSessionBanner />

        {/* Page Content */}
        <main className="flex-1 pb-20">
          <Switch redirect="/focus">
            <Route path="/focus" component={FocusView} />
            <Route path="/tasks" component={TasksView} />
            <Route path="/stats" component={StatsView} />
            <Route path="/settings" component={SettingsView} />
          </Switch>
        </main>

        <FAB onClick={handleOpenCreateTask} />
        <Dock currentView={currentView} />
      </div>

      {/* Drawer Sidebar */}
      <Drawer />

      {/* Modals */}
      <CreateTaskModal
        isOpen={ui.modals.createTask}
        onClose={handleCloseCreateTask}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
