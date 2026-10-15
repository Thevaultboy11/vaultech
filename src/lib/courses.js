import { TODAY } from './dates';

export const TOPIC_STATUSES = ['not_started', 'studied', 'practiced', 'mastered'];
export const STATUS_LABEL = {
  not_started: 'Not started',
  studied: 'Studied',
  practiced: 'Practiced',
  mastered: 'Mastered',
};

/**
 * Baseline gap = topics already taught in class that you haven't touched,
 * minus topics not yet taught that you've already covered.
 * gap > 0 → behind, 0 → on baseline, < 0 → ahead.
 */
export function computeGap(course, today = TODAY) {
  const taught = course.topics.filter((t) => t.classDate <= today);
  const behind = taught.filter((t) => t.status === 'not_started');
  const ahead = course.topics.filter((t) => t.classDate > today && t.status !== 'not_started');
  const minutes = behind.reduce((s, t) => s + t.estMin, 0);
  return {
    ...course,
    gapCount: behind.length - ahead.length,
    behindCount: behind.length,
    aheadCount: ahead.length,
    hoursToCatchUp: Math.round((minutes / 60) * 10) / 10,
    coverage: taught.length ? (taught.length - behind.length) / taught.length : 1,
  };
}

export function gapLabel(gap) {
  if (gap > 0) return `${gap} behind`;
  if (gap < 0) return `${-gap} ahead`;
  return 'On baseline';
}
