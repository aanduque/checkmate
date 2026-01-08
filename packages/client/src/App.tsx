import React, { useState } from 'react';
import { Dock } from './components/layout/Dock';
import { FocusView } from './components/views/FocusView';
import { TasksView } from './components/views/TasksView';
import { StatsView } from './components/views/StatsView';

type View = 'focus' | 'tasks' | 'stats';

export function App() {
  const [currentView, setCurrentView] = useState<View>('focus');

  const renderView = () => {
    switch (currentView) {
      case 'focus':
        return <FocusView />;
      case 'tasks':
        return <TasksView />;
      case 'stats':
        return <StatsView />;
      default:
        return <FocusView />;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        {renderView()}
      </main>
      <Dock currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}
