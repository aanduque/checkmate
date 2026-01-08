import { useEffect } from 'react';
import Router, { Switch, Route } from 'crossroad';
import Store, { useStore } from 'statux';
import { initialState } from './store';
import { Header } from './components/layout/Header';
import { Dock } from './components/layout/Dock';
import { Drawer } from './components/layout/Drawer';
import { FocusView } from './components/views/FocusView';
import { TasksView } from './components/views/TasksView';
import { StatsView } from './components/views/StatsView';
import { SessionBanner } from './components/layout/SessionBanner';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { TaskDetailModal } from './components/modals/TaskDetailModal';
import { SkipForDayModal } from './components/modals/SkipForDayModal';
import { CompleteSessionModal } from './components/modals/CompleteSessionModal';
import { TagsModal } from './components/modals/TagsModal';
import { RoutinesModal } from './components/modals/RoutinesModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ImportModal } from './components/modals/ImportModal';
import { api } from './services/rpcClient';

function AppContent() {
  const [, setTasks] = useStore('tasks');
  const [, setTags] = useStore('tags');
  const [, setSprints] = useStore('sprints');
  const [, setRoutines] = useStore('routines');
  const [, setLoading] = useStore('ui.loading');

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tasksResult, tagsResult, sprintsResult, routinesResult] =
          await Promise.all([
            api.tasks.getAll(),
            api.tags.getAll(),
            api.sprints.getAll(),
            api.routines.getAll(),
          ]);

        setTasks(tasksResult.tasks);
        setTags(tagsResult.tags);
        setSprints(sprintsResult.sprints);
        setRoutines(routinesResult.routines);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [setTasks, setTags, setSprints, setRoutines, setLoading]);

  return (
    <Router>
      <div className="drawer drawer-end">
        <input id="main-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-content flex flex-col min-h-screen bg-base-200">
          <Header />
          <SessionBanner />

          <main className="flex-1 pb-20">
            <Switch redirect="/focus">
              <Route path="/focus" component={FocusView} />
              <Route path="/tasks" component={TasksView} />
              <Route path="/stats" component={StatsView} />
            </Switch>
          </main>

          <Dock />
        </div>

        <Drawer />
      </div>

      {/* Modals */}
      <CreateTaskModal />
      <TaskDetailModal />
      <SkipForDayModal />
      <CompleteSessionModal />
      <TagsModal />
      <RoutinesModal />
      <SettingsModal />
      <ImportModal />
    </Router>
  );
}

export function App() {
  return (
    <Store state={initialState}>
      <AppContent />
    </Store>
  );
}
