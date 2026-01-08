import { useEffect, useState } from 'react';
import { api } from '../../services/rpcClient';

interface Stats {
  totalCompleted: number;
  totalCancelled: number;
  totalPoints: number;
  tagBreakdown: Array<{
    tagId: string;
    tagName: string;
    tagColor: string;
    completedTasks: number;
    totalPoints: number;
  }>;
  weeklyActivity: Array<{
    date: string;
    completed: number;
    points: number;
  }>;
  focusQuality: {
    totalSessions: number;
    averageDuration: number;
    focusLevelBreakdown: {
      deep: number;
      moderate: number;
      shallow: number;
      distracted: number;
    };
  };
}

export function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const result = await api.stats.get({ period });
        setStats(result.stats);
      } catch (e) {
        console.error('Failed to load stats:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [period]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <ion-icon name="alert-circle-outline" class="text-4xl text-error mb-2"></ion-icon>
        <p>Failed to load statistics</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Period Selector */}
      <div className="flex justify-center mb-6">
        <div className="join">
          <button
            className={`join-item btn btn-sm ${period === 'week' ? 'btn-active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            This Week
          </button>
          <button
            className={`join-item btn btn-sm ${period === 'month' ? 'btn-active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            This Month
          </button>
          <button
            className={`join-item btn btn-sm ${period === 'all' ? 'btn-active' : ''}`}
            onClick={() => setPeriod('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-base-100 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-success">{stats.totalCompleted}</p>
          <p className="text-sm text-base-content/60">Tasks Completed</p>
        </div>
        <div className="bg-base-100 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-primary">{stats.totalPoints}</p>
          <p className="text-sm text-base-content/60">Points Earned</p>
        </div>
        <div className="bg-base-100 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-info">{stats.focusQuality.totalSessions}</p>
          <p className="text-sm text-base-content/60">Focus Sessions</p>
        </div>
        <div className="bg-base-100 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-secondary">
            {formatDuration(stats.focusQuality.averageDuration)}
          </p>
          <p className="text-sm text-base-content/60">Avg Session</p>
        </div>
      </div>

      {/* Tag Performance */}
      <div className="bg-base-100 rounded-lg p-4 mb-6">
        <h3 className="font-bold mb-4">Tag Performance</h3>
        <div className="space-y-3">
          {stats.tagBreakdown.map((tag) => {
            const maxPoints = Math.max(...stats.tagBreakdown.map((t) => t.totalPoints), 1);
            const percentage = (tag.totalPoints / maxPoints) * 100;

            return (
              <div key={tag.tagId} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.tagColor }}
                ></div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{tag.tagName}</span>
                    <span className="text-base-content/60">
                      {tag.completedTasks} tasks · {tag.totalPoints} pts
                    </span>
                  </div>
                  <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: tag.tagColor,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
          {stats.tagBreakdown.length === 0 && (
            <p className="text-center text-base-content/60 py-4">No tag data yet</p>
          )}
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-base-100 rounded-lg p-4 mb-6">
        <h3 className="font-bold mb-4">Activity</h3>
        <div className="flex items-end gap-1 h-32">
          {stats.weeklyActivity.map((day) => {
            const maxCompleted = Math.max(...stats.weeklyActivity.map((d) => d.completed), 1);
            const height = (day.completed / maxCompleted) * 100;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-base-content/60">{day.completed}</div>
                <div
                  className="w-full bg-primary rounded-t transition-all"
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${day.date}: ${day.completed} tasks, ${day.points} pts`}
                ></div>
                <div className="text-xs text-base-content/40">
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })[0]}
                </div>
              </div>
            );
          })}
          {stats.weeklyActivity.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-base-content/60">
              No activity data yet
            </div>
          )}
        </div>
      </div>

      {/* Focus Quality */}
      <div className="bg-base-100 rounded-lg p-4">
        <h3 className="font-bold mb-4">Focus Quality</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {stats.focusQuality.focusLevelBreakdown.deep}
            </p>
            <p className="text-sm text-base-content/60">Deep Focus</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-info">
              {stats.focusQuality.focusLevelBreakdown.moderate}
            </p>
            <p className="text-sm text-base-content/60">Moderate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">
              {stats.focusQuality.focusLevelBreakdown.shallow}
            </p>
            <p className="text-sm text-base-content/60">Shallow</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-error">
              {stats.focusQuality.focusLevelBreakdown.distracted}
            </p>
            <p className="text-sm text-base-content/60">Distracted</p>
          </div>
        </div>
      </div>
    </div>
  );
}
