export interface FrameData {
  timestamp: number;
  activeZones: boolean[];
  activeCount: number;
}

const COMMENTS: [number, string][] = [
  [95, "Beyonce called, she's worried"],
  [80, 'Not bad for someone half asleep'],
  [60, 'The vibes were there... barely'],
  [40, 'Your bed is judging you right now'],
  [20, 'Was that dancing or a cry for help?'],
  [0, "We've seen better movement from a statue"],
];

export function getComment(score: number): string {
  for (const [threshold, comment] of COMMENTS) {
    if (score >= threshold) return comment;
  }
  return COMMENTS[COMMENTS.length - 1][1];
}

export function calculateScore(frames: FrameData[]): {
  score: number;
  comment: string;
} {
  if (frames.length === 0) {
    return { score: 0, comment: getComment(0) };
  }

  const MIN_ACTIVE = 3;

  const activeFrames = frames.filter((f) => f.activeCount >= MIN_ACTIVE).length;
  const activeRatio = activeFrames / frames.length;

  const avgZones =
    frames.reduce((sum, f) => sum + f.activeCount, 0) / frames.length / 9;

  const counts = frames.map((f) => f.activeCount);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance =
    counts.reduce((sum, c) => sum + (c - mean) ** 2, 0) / counts.length;
  const stddev = Math.sqrt(variance);
  const consistency = mean > 0 ? Math.max(0, Math.min(1, 1 - stddev / mean)) : 0;

  const raw = 0.4 * activeRatio * 100 + 0.3 * avgZones * 100 + 0.3 * consistency * 100;
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  return { score, comment: getComment(score) };
}
