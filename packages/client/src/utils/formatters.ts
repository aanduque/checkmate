export function describeRRule(rruleStr: string | null): string {
  if (!rruleStr) return '';

  const descriptions: Record<string, string> = {
    'FREQ=DAILY': 'Every day',
    'FREQ=WEEKLY': 'Every week',
    'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR': 'Weekdays',
    'FREQ=WEEKLY;BYDAY=MO,WE,FR': 'Mon, Wed, Fri',
    'FREQ=WEEKLY;BYDAY=TU,TH': 'Tue, Thu',
    'FREQ=MONTHLY': 'Every month',
  };

  return descriptions[rruleStr] || rruleStr;
}

export function getHealthColor(health: string): string {
  switch (health) {
    case 'on_track':
      return 'text-on-track';
    case 'at_risk':
      return 'text-at-risk';
    case 'off_track':
      return 'text-off-track';
    default:
      return 'text-gray-500';
  }
}

export function getHealthBgColor(health: string): string {
  switch (health) {
    case 'on_track':
      return 'bg-on-track/20';
    case 'at_risk':
      return 'bg-at-risk/20';
    case 'off_track':
      return 'bg-off-track/20';
    default:
      return 'bg-gray-100';
  }
}

export function formatHealthLabel(health: string): string {
  return health.replace('_', ' ');
}
