import React, { useState, useEffect } from 'react';
import { statsApi, WeeklyStatsDTO } from '../../services/rpcClient';

export function StatsView() {
  const [stats, setStats] = useState<WeeklyStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await statsApi.getWeekly();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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
        <button className="btn btn-primary mt-4" onClick={loadStats}>
          Retry
        </button>
      </div>
    );
  }

  const dailyActivity = stats?.dailyActivity || [];
  const maxPoints = Math.max(...dailyActivity.map(d => d.pointsCompleted), 1);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Statistics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat bg-base-200 rounded-box">
          <div className="stat-title">Points</div>
          <div className="stat-value text-primary">{stats?.pointsCompleted || 0}</div>
          <div className="stat-desc">This week</div>
        </div>

        <div className="stat bg-base-200 rounded-box">
          <div className="stat-title">Tasks</div>
          <div className="stat-value text-success">{stats?.tasksCompleted || 0}</div>
          <div className="stat-desc">Completed</div>
        </div>

        <div className="stat bg-base-200 rounded-box">
          <div className="stat-title">Focus Time</div>
          <div className="stat-value text-info text-2xl">
            {formatTime(stats?.focusTimeSeconds || 0)}
          </div>
          <div className="stat-desc">{stats?.sessionsCount || 0} sessions</div>
        </div>

        <div className="stat bg-base-200 rounded-box">
          <div className="stat-title">Streak</div>
          <div className="stat-value text-warning">{stats?.currentStreak || 0}</div>
          <div className="stat-desc">Days in a row</div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Weekly Activity</h3>
        <div className="card bg-base-200">
          <div className="card-body">
            {dailyActivity.length > 0 ? (
              <div className="flex justify-between items-end h-32">
                {dailyActivity.map((day) => {
                  const date = new Date(day.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const height = maxPoints > 0 ? (day.pointsCompleted / maxPoints) * 100 : 0;

                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                      <div className="tooltip" data-tip={`${day.pointsCompleted} pts`}>
                        <div
                          className="bg-primary rounded-t-sm w-8 min-h-[4px] transition-all"
                          style={{ height: `${Math.max(height, 4)}px` }}
                        />
                      </div>
                      <span className="text-xs text-base-content/70">{dayName}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/50">
                No activity data yet. Complete some tasks to see your progress!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tag Performance */}
      {stats?.pointsByTag && Object.keys(stats.pointsByTag).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Points by Tag</h3>
          <div className="space-y-2">
            {Object.entries(stats.pointsByTag).map(([tagName, points]) => {
              const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning'];
              const colorIndex = tagName.charCodeAt(0) % colors.length;
              const color = colors[colorIndex];

              return (
                <div key={tagName} className="card bg-base-200">
                  <div className="card-body p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">{tagName}</span>
                      <span className="text-sm">{points} pts</span>
                    </div>
                    <progress
                      className={`progress progress-${color}`}
                      value={points}
                      max={stats.pointsCompleted || points}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats?.tasksCompleted === 0 && (
        <div className="mt-8 text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-base-content/70">
            Start completing tasks to see your statistics here!
          </p>
        </div>
      )}
    </div>
  );
}
