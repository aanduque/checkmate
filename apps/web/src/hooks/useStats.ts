/**
 * Statistics hook
 * Provides daily and weekly stats data
 */

import { useCallback, useState, useEffect } from 'react';
import { DailyStatsDTO, WeeklyStatsDTO, TagDTO } from '../services/rpcClient';
import { mockDailyStats, mockWeeklyStats, mockTags } from '../mocks/mockData';
import { useSelector } from 'statux';

// Flag to use mock data
const USE_MOCKS = true;

export function useStats() {
  const [dailyStats, setDailyStats] = useState<DailyStatsDTO | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tags = useSelector<TagDTO[]>('tags');

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_MOCKS) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        setDailyStats(mockDailyStats);
        setWeeklyStats(mockWeeklyStats);
      } else {
        // TODO: Call RPC when backend ready
        // const daily = await statsApi.getDaily();
        // const weekly = await statsApi.getWeekly();
        // setDailyStats(daily);
        // setWeeklyStats(weekly);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Format duration (seconds to human-readable)
  const formatDuration = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }, []);

  // Calculate yesterday's stats for comparison
  const getYesterdayComparison = useCallback(() => {
    if (!weeklyStats?.dailyActivity || weeklyStats.dailyActivity.length < 2) {
      return null;
    }
    const yesterday = weeklyStats.dailyActivity[weeklyStats.dailyActivity.length - 2];
    return yesterday;
  }, [weeklyStats]);

  // Get last week's points for comparison
  const getLastWeekPoints = useCallback(() => {
    // Mock: assume 80% of this week
    return weeklyStats ? Math.floor(weeklyStats.pointsCompleted * 0.8) : 0;
  }, [weeklyStats]);

  // Get points by tag
  const getPointsByTag = useCallback(() => {
    return weeklyStats?.pointsByTag || {};
  }, [weeklyStats]);

  // Get top performing tag
  const getTopTag = useCallback(() => {
    const pointsByTag = getPointsByTag();
    let topTagId: string | null = null;
    let maxPoints = 0;

    for (const [tagId, points] of Object.entries(pointsByTag)) {
      if (points > maxPoints) {
        maxPoints = points;
        topTagId = tagId;
      }
    }

    if (!topTagId) return null;
    return tags.find(t => t.id === topTagId) || null;
  }, [getPointsByTag, tags]);

  // Calculate focus quality percentage
  const getFocusQualityPercent = useCallback(() => {
    if (!dailyStats?.focusQuality) return 0;
    return Math.round(dailyStats.focusQuality.averageScore * 100);
  }, [dailyStats]);

  // Get average session duration
  const getAverageSessionDuration = useCallback(() => {
    if (!dailyStats || dailyStats.sessionsCount === 0) return 0;
    return Math.round(dailyStats.focusTimeSeconds / dailyStats.sessionsCount);
  }, [dailyStats]);

  return {
    dailyStats,
    weeklyStats,
    loading,
    error,
    loadStats,
    formatDuration,
    getYesterdayComparison,
    getLastWeekPoints,
    getPointsByTag,
    getTopTag,
    getFocusQualityPercent,
    getAverageSessionDuration,
    tags
  };
}
