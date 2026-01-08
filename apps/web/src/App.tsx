import React, { useState, useCallback } from 'react';
import { Dock } from './components/layout/Dock';
import { FAB } from './components/layout/FAB';
import { FocusView } from './components/views/FocusView';
import { TasksView } from './components/views/TasksView';
import { StatsView } from './components/views/StatsView';
import { SettingsView } from './components/views/SettingsView';
import { CreateTaskModal } from './components/modals/CreateTaskModal';

type View = 'focus' | 'tasks' | 'stats' | 'settings';

export function App() {
  const [currentView, setCurrentView] = useState<View>('focus');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTaskCreated = useCallback(() => {
    // Trigger refresh of views
    setRefreshKey(k => k + 1);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'focus':
        return <FocusView key={refreshKey} />;
      case 'tasks':
        return <TasksView key={refreshKey} />;
      case 'stats':
        return <StatsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <FocusView key={refreshKey} />;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        {renderView()}
      </main>

      <FAB onClick={() => setShowCreateTask(true)} />

      <Dock currentView={currentView} onViewChange={setCurrentView} />

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
