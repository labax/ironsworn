import { describe, expect, it } from 'vitest';
import { createFixedRandomProvider } from '../testing';
import {
  addProgressByRank,
  boxesToTicks,
  correctProgressTicks,
  classifyProgressRoll,
  progressRankIncrementTicks,
  progressScoreFromState,
  progressScoreFromTicks,
  removeProgressByRank,
  resolveProgressRoll,
  ticksToBoxes,
  PROGRESS_RANK_TICK_INCREMENTS,
} from './progress-rolls';

const expectFailureCode = (
  result: { readonly ok: boolean; readonly errors?: readonly { readonly code: string }[] },
  code: string,
) => {
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors?.map((error) => error.code)).toContain(code);
};

describe('progress roll helpers', () => {
  it.each(Object.entries(PROGRESS_RANK_TICK_INCREMENTS))(
    'returns deterministic progress increment ticks for %s',
    (rank, increment) => {
      const result = progressRankIncrementTicks(rank);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe(increment);
    },
  );

  it('returns a typed error for unsupported ranks', () => {
    expectFailureCode(progressRankIncrementTicks('unsupported'), 'unsupported_rank');
  });

  it.each([
    ['troublesome', 0, 12],
    ['dangerous', 0, 8],
    ['formidable', 0, 4],
    ['extreme', 0, 2],
    ['epic', 0, 1],
  ] as const)('marks %s progress by its rank increment', (rank, ticks, expectedTicks) => {
    const result = addProgressByRank({ rank, ticks });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ticks).toBe(expectedTicks);
    expect(result.value.progressScore).toBe(Math.floor(expectedTicks / 4));
  });

  it.each([
    ['troublesome', 12, 0],
    ['dangerous', 8, 0],
    ['formidable', 4, 0],
    ['extreme', 2, 0],
    ['epic', 1, 0],
  ] as const)('removes %s progress by its rank increment', (rank, ticks, expectedTicks) => {
    const result = removeProgressByRank({ rank, ticks });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ticks).toBe(expectedTicks);
  });

  it.each([
    ['mark over maximum', () => addProgressByRank({ rank: 'troublesome', ticks: 36 })],
    ['remove below minimum', () => removeProgressByRank({ rank: 'dangerous', ticks: 4 })],
    ['normal correction below minimum', () => correctProgressTicks(-1)],
    ['normal correction over maximum', () => correctProgressTicks(41)],
  ] as const)('rejects invalid normal progress for %s', (_label, makeResult) => {
    expectFailureCode(makeResult(), 'out_of_range');
  });

  it.each([
    [0, 0],
    [1, 0],
    [3, 0],
    [4, 1],
    [5, 1],
    [39, 9],
    [40, 10],
  ])('converts %i ticks to %i progress boxes', (ticks, boxes) => {
    const result = ticksToBoxes(ticks);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(boxes);
  });

  it.each([
    [0, 0],
    [1, 4],
    [9, 36],
    [10, 40],
  ])('converts %i boxes to %i ticks', (boxes, ticks) => {
    const result = boxesToTicks(boxes);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(ticks);
  });

  it.each([
    [0, 0],
    [3, 0],
    [4, 1],
    [22, 5],
    [40, 10],
  ])('converts %i ticks to bounded progress score %i', (ticks, score) => {
    const result = progressScoreFromTicks(ticks);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(score);
  });

  it('converts progress states from either ticks or boxes', () => {
    expect(progressScoreFromState({ ticks: 7 })).toEqual({
      ok: true,
      value: { ticks: 7, boxes: 1, progressScore: 1 },
    });
    expect(progressScoreFromState({ boxes: 6 })).toEqual({
      ok: true,
      value: { ticks: 24, boxes: 6, progressScore: 6 },
    });
  });

  it.each([
    ['negative ticks', () => progressScoreFromTicks(-1), 'out_of_range'],
    ['ticks over maximum', () => progressScoreFromTicks(41), 'out_of_range'],
    ['negative boxes', () => boxesToTicks(-1), 'out_of_range'],
    ['boxes over maximum', () => boxesToTicks(11), 'out_of_range'],
    ['non-integer ticks', () => progressScoreFromTicks(1.5), 'not_integer'],
    ['non-integer boxes', () => boxesToTicks(1.5), 'not_integer'],
    ['non-numeric ticks', () => progressScoreFromTicks(Number.NaN), 'not_numeric'],
    ['non-numeric boxes', () => boxesToTicks('4'), 'not_numeric'],
  ] as const)('returns typed errors for %s', (_label, makeResult, code) => {
    expectFailureCode(makeResult(), code);
  });

  it.each([
    ['missing progress state', null, 'malformed_progress_state'],
    ['no supported value', {}, 'unsupported_conversion'],
    ['ambiguous state', { ticks: 4, boxes: 1 }, 'unsupported_conversion'],
    ['malformed tick state', { ticks: Number.POSITIVE_INFINITY }, 'not_numeric'],
  ] as const)('returns typed errors for %s', (_label, state, code) => {
    expectFailureCode(progressScoreFromState(state), code);
  });

  it('allows explicit manual correction conversion while keeping bounded score output', () => {
    expectFailureCode(progressScoreFromTicks(44), 'out_of_range');

    expect(progressScoreFromTicks(44, { mode: 'manual_correction' })).toEqual({
      ok: true,
      value: 10,
    });
    expect(progressScoreFromTicks(-4, { mode: 'manual_correction' })).toEqual({
      ok: true,
      value: 0,
    });
    expect(progressScoreFromState({ boxes: 12 }, { mode: 'manual_correction' })).toEqual({
      ok: true,
      value: { ticks: 48, boxes: 12, progressScore: 10 },
    });
  });
});

describe('progress rolls', () => {
  it('classifies progress results with tie handling', () => {
    expect(classifyProgressRoll(8, [2, 7])).toBe('strong_hit');
    expect(classifyProgressRoll(5, [2, 7])).toBe('weak_hit');
    expect(classifyProgressRoll(5, [5, 7])).toBe('miss');
  });

  it.each([
    ['strong_hit', 8, [2, 7]],
    ['weak_hit', 5, [2, 7]],
    ['miss', 5, [5, 7]],
  ] as const)(
    'resolves %s with strict progress comparison',
    (outcome, progressScore, challengeDice) => {
      const result = resolveProgressRoll({
        trackId: 'track-1',
        progressScore,
        challengeDice,
        rolledAt: '2026-07-11T00:00:00.000Z',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toMatchObject({
        type: 'progress',
        trackId: 'track-1',
        progressScore,
        challengeDice,
        outcome,
        rolledAt: '2026-07-11T00:00:00.000Z',
        source: 'manual',
      });
      expect(Object.isFrozen(result.value)).toBe(true);
    },
  );

  it('detects challenge matches and keeps raw dice', () => {
    const result = resolveProgressRoll({
      trackId: 'track-match',
      progressScore: 9,
      challengeDice: [6, 6],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.isMatch).toBe(true);
    expect(result.value.challengeResults).toEqual([true, true]);
  });

  it.each([0, 10])('accepts progress score boundary %i', (progressScore) => {
    const result = resolveProgressRoll({
      trackId: 'track-boundary',
      progressScore,
      challengeDice: [1, 10],
    });

    expect(result.ok).toBe(true);
  });

  it('uses deterministic injectable randomness for generated challenge dice', () => {
    const result = resolveProgressRoll({
      trackId: 'track-random',
      progressScore: 6,
      randomProvider: createFixedRandomProvider([0.2, 0.9]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.challengeDice).toEqual([3, 10]);
    expect(result.value.outcome).toBe('weak_hit');
    expect(result.value.source).toBe('generated');
  });

  it.each([
    ['missing track ID', { trackId: '', progressScore: 5, challengeDice: [1, 2] }, 'required'],
    [
      'non-integer progress',
      { trackId: 'track', progressScore: 1.5, challengeDice: [1, 2] },
      'not_integer',
    ],
    [
      'progress over maximum',
      { trackId: 'track', progressScore: 11, challengeDice: [1, 2] },
      'out_of_range',
    ],
    [
      'malformed challenge die',
      { trackId: 'track', progressScore: 5, challengeDice: [0, 2] },
      'out_of_range',
    ],
  ] as const)('returns safe errors for %s', (_label, input, code) => {
    expectFailureCode(resolveProgressRoll(input), code);
  });
});
