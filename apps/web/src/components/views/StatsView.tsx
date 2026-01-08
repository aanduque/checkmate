import React from 'react';
import { useStats } from '../../hooks/useStats';

export function StatsView() {
  const {
    dailyStats,
    weeklyStats,
    loading,
    error,
    loadStats,
    formatDuration,
    getTopTag,
    getFocusQualityPercent,
    tags
  } = useStats();

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

  const dailyActivity = weeklyStats?.dailyActivity || [];
  const maxPoints = Math.max(...dailyActivity.map(d => d.pointsCompleted), 1);
  const topTag = getTopTag();
  const focusQualityPercent = getFocusQualityPercent();

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      {/* Stats Grid - Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Tasks Completed */}
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              <span>Tasks</span>
            </div>
            <p className="text-3xl font-bold text-success">
              {dailyStats?.tasksCompleted || 0}
            </p>
            <p className="text-xs opacity-60">today</p>
          </div>
        </div>

        {/* Points Completed */}
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
              <ion-icon name="star-outline"></ion-icon>
              <span>Points</span>
            </div>
            <p className="text-3xl font-bold text-primary">
              {dailyStats?.pointsCompleted || 0}
            </p>
            <p className="text-xs opacity-60">today</p>
          </div>
        </div>

        {/* Focus Time */}
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
              <ion-icon name="timer-outline"></ion-icon>
              <span>Focus</span>
            </div>
            <p className="text-3xl font-bold text-info">
              {formatDuration(dailyStats?.focusTimeSeconds || 0)}
            </p>
            <p className="text-xs opacity-60">{dailyStats?.sessionsCount || 0} sessions</p>
          </div>
        </div>

        {/* Streak */}
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
              <ion-icon name="flame-outline"></ion-icon>
              <span>Streak</span>
            </div>
            <p className="text-3xl font-bold text-warning">
              {dailyStats?.currentStreak || 0}
            </p>
            <p className="text-xs opacity-60">days</p>
          </div>
        </div>
      </div>

      {/* Weekly Summary Card */}
      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body">
          <h2 className="card-title text-base">
            <ion-icon name="calendar-outline"></ion-icon>
            This Week
          </h2>
          <div className="stats stats-vertical md:stats-horizontal bg-transparent">
            <div className="stat px-2">
              <div className="stat-title text-xs">Points</div>
              <div className="stat-value text-lg text-primary">
                {weeklyStats?.pointsCompleted || 0}
              </div>
            </div>
            <div className="stat px-2">
              <div className="stat-title text-xs">Tasks</div>
              <div className="stat-value text-lg text-success">
                {weeklyStats?.tasksCompleted || 0}
              </div>
            </div>
            <div className="stat px-2">
              <div className="stat-title text-xs">Focus</div>
              <div className="stat-value text-lg text-info">
                {formatDuration(weeklyStats?.focusTimeSeconds || 0)}
              </div>
            </div>
            {topTag && (
              <div className="stat px-2">
                <div className="stat-title text-xs">Top Tag</div>
                <div className="stat-value text-lg flex items-center gap-1" style={{ color: topTag.color }}>
                  {topTag.icon} {topTag.name}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Activity Pattern */}
      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body">
          <h2 className="card-title text-base">
            <ion-icon name="bar-chart-outline"></ion-icon>
            Weekly Activity
          </h2>
          <div className="flex items-end justify-between gap-1 h-24">
            {dailyActivity.map((day) => {
              const height = maxPoints > 0
                ? Math.max(20, Math.min(100, (day.pointsCompleted / maxPoints) * 100))
                : 4;
              const today = isToday(day.date);

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-base-200 rounded-t relative"
                    style={{
                      height: `${height}%`,
                      minHeight: '4px',
                      backgroundColor: today
                        ? 'oklch(var(--p))'
                        : day.pointsCompleted > 0
                          ? 'oklch(var(--s))'
                          : undefined
                    }}
                  />
                  <span
                    className={`text-xs opacity-70 ${today ? 'font-bold' : ''}`}
                  >
                    {getDayLabel(day.date)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-center opacity-50 mt-2">Tasks completed per day</div>
        </div>
      </div>

      {/* Focus Quality Card */}
      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body">
          <h2 className="card-title text-base">
            <ion-icon name="pulse-outline"></ion-icon>
            Focus Quality
          </h2>
          {dailyStats?.focusQuality && dailyStats.sessionsCount > 0 ? (
            <div className="flex items-center gap-6">
              <div
                className="radial-progress text-success"
                style={{
                  '--value': focusQualityPercent,
                  '--size': '5rem'
                } as React.CSSProperties}
                role="progressbar"
              >
                <span className="text-sm font-bold">{focusQualityPercent}%</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ion-icon name="happy-outline" class="text-success"></ion-icon>
                    Good Focus
                  </span>
                  <span>{dailyStats.focusQuality.focusedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ion-icon name="remove-outline" class="text-warning"></ion-icon>
                    Neutral
                  </span>
                  <span>{dailyStats.focusQuality.neutralCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ion-icon name="sad-outline" class="text-error"></ion-icon>
                    Struggled
                  </span>
                  <span>{dailyStats.focusQuality.distractedCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 opacity-50">
              <ion-icon name="hourglass-outline" class="text-2xl mb-2"></ion-icon>
              <p className="text-sm">No focus sessions this week yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Tag Performance */}
      {weeklyStats?.pointsByTag && Object.keys(weeklyStats.pointsByTag).length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base">
              <ion-icon name="pricetags-outline"></ion-icon>
              Points by Tag
            </h2>
            <div className="space-y-3">
              {Object.entries(weeklyStats.pointsByTag).map(([tagId, points]) => {
                const tag = tags.find(t => t.id === tagId);
                if (!tag) return null;
                const percentage = weeklyStats.pointsCompleted > 0
                  ? (points / weeklyStats.pointsCompleted) * 100
                  : 0;

                return (
                  <div key={tagId}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="flex items-center gap-2">
                        <span style={{ color: tag.color }}>{tag.icon}</span>
                        <span className="font-medium">{tag.name}</span>
                      </span>
                      <span className="text-sm opacity-70">{points} pts</span>
                    </div>
                    <progress
                      className="progress"
                      style={{ '--progress-value-color': tag.color } as React.CSSProperties}
                      value={percentage}
                      max={100}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
