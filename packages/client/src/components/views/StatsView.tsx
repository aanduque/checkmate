import React from 'react';

export function StatsView() {
  // Placeholder stats - will be populated from API
  const stats = {
    totalPoints: 42,
    completedTasks: 12,
    sessionsCompleted: 8,
    avgFocusLevel: 'focused',
    streakDays: 5
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Statistics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat bg-base-200 rounded-box">
          <div className="stat-title">Total Points</div>
          <div className="stat-value text-primary">{stats.totalPoints}</div>
          <div className="stat-desc">This week</div>
        </div>

        <div className="stat bg-base-200 rounded-box">
          <div className="stat-title">Tasks Completed</div>
          <div className="stat-value text-success">{stats.completedTasks}</div>
          <div className="stat-desc">This week</div>
        </div>

        <div className="stat bg-base-200 rounded-box">
          <div className="stat-title">Sessions</div>
          <div className="stat-value text-info">{stats.sessionsCompleted}</div>
          <div className="stat-desc">Focus sessions</div>
        </div>

        <div className="stat bg-base-200 rounded-box">
          <div className="stat-title">Streak</div>
          <div className="stat-value text-warning">{stats.streakDays}</div>
          <div className="stat-desc">Days in a row</div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Weekly Activity</h3>
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex justify-between items-end h-32">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div
                    className="bg-primary rounded-t-sm w-8"
                    style={{ height: `${(i + 1) * 12}px` }}
                  />
                  <span className="text-xs text-base-content/70">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tag Performance */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Tag Performance</h3>
        <div className="space-y-2">
          {[
            { name: 'Work', points: 21, capacity: 21, color: 'primary' },
            { name: 'Personal', points: 8, capacity: 13, color: 'secondary' },
            { name: 'Health', points: 5, capacity: 8, color: 'accent' }
          ].map(tag => (
            <div key={tag.name} className="card bg-base-200">
              <div className="card-body p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-sm">
                    {tag.points}/{tag.capacity}
                  </span>
                </div>
                <progress
                  className={`progress progress-${tag.color}`}
                  value={tag.points}
                  max={tag.capacity}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
