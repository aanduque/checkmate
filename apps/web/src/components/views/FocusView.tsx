import React, { useState, useEffect } from 'react';
import { taskApi, sessionApi, FocusTaskDTO } from '../../services/rpcClient';
import { SessionTimer } from '../focus/SessionTimer';
import { SkipTaskModal } from '../modals/SkipTaskModal';
import { EndSessionModal } from '../modals/EndSessionModal';

export function FocusView() {
  const [focusTask, setFocusTask] = useState<FocusTaskDTO | null>(null);
  const [upNext, setUpNext] = useState<FocusTaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipType, setSkipType] = useState<'for_now' | 'for_day'>('for_now');
  const [endSessionModalOpen, setEndSessionModalOpen] = useState(false);

  useEffect(() => {
    loadFocusData();
  }, []);

  const loadFocusData = async () => {
    try {
      setLoading(true);
      // For now, use a placeholder sprint ID
      const data = await taskApi.getFocus('current');
      setFocusTask(data.focusTask);
      setUpNext(data.upNext);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!focusTask) return;
    try {
      await sessionApi.start(focusTask.id, 25);
      loadFocusData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    }
  };

  const handleSkipClick = (type: 'for_now' | 'for_day') => {
    setSkipType(type);
    setSkipModalOpen(true);
  };

  const handleComplete = async () => {
    if (!focusTask) return;
    try {
      await taskApi.complete(focusTask.id);
      loadFocusData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete');
    }
  };

  const handleEndSessionClick = () => {
    setEndSessionModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="alert alert-warning">
          <span>{error}</span>
        </div>
        <button className="btn btn-primary mt-4" onClick={loadFocusData}>
          Retry
        </button>
      </div>
    );
  }

  if (!focusTask) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-center">All done!</h2>
        <p className="text-center text-base-content/70 mt-2">
          No tasks in the current sprint. Add some tasks to get started.
        </p>
      </div>
    );
  }

  const hasActiveSession = focusTask.activeSession;

  return (
    <div className="p-4">
      {/* Active Session Timer */}
      {hasActiveSession ? (
        <SessionTimer
          startedAt={focusTask.activeSession!.startedAt}
          durationMinutes={focusTask.activeSession!.durationMinutes}
          onEnd={handleEndSessionClick}
        />
      ) : (
        /* Current Focus Task */
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">{focusTask.title}</h2>

            <div className="flex gap-2 flex-wrap mt-2">
              {Object.entries(focusTask.tagPoints).map(([tag, points]) => (
                <span key={tag} className="badge badge-primary">
                  {tag}: {points}
                </span>
              ))}
            </div>

            <div className="text-lg font-semibold mt-2">
              {focusTask.totalPoints} points
            </div>

            {/* Actions */}
            <div className="card-actions justify-center mt-4">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleStartSession}
              >
                Start Session
              </button>
            </div>

            <div className="flex justify-center gap-4 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleSkipClick('for_now')}
              >
                Skip for now
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleSkipClick('for_day')}
              >
                Skip for day
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={handleComplete}
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Title During Session */}
      {hasActiveSession && (
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold">{focusTask.title}</h3>
          <div className="flex gap-2 flex-wrap justify-center mt-2">
            {Object.entries(focusTask.tagPoints).map(([tag, points]) => (
              <span key={tag} className="badge badge-outline">
                {tag}: {points}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Up Next */}
      {upNext.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Up Next</h3>
          <div className="space-y-2">
            {upNext.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="card bg-base-100 shadow-sm"
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-center">
                    <span>{task.title}</span>
                    <span className="badge">{task.totalPoints} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skip Modal */}
      <SkipTaskModal
        isOpen={skipModalOpen}
        onClose={() => setSkipModalOpen(false)}
        onSkipped={loadFocusData}
        taskId={focusTask.id}
        taskTitle={focusTask.title}
        skipType={skipType}
      />

      {/* End Session Modal */}
      {hasActiveSession && (
        <EndSessionModal
          isOpen={endSessionModalOpen}
          onClose={() => setEndSessionModalOpen(false)}
          onEnded={loadFocusData}
          taskId={focusTask.id}
          sessionId={focusTask.activeSession!.id}
          taskTitle={focusTask.title}
        />
      )}
    </div>
  );
}
