import { describe, expect, it } from 'vitest';
import {
  boxesToTicks,
  classifyProgressRoll,
  progressRankIncrementTicks,
  progressScoreFromState,
  progressScoreFromTicks,
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

  it('resolves typed progress roll input', () => {
    const result = resolveProgressRoll({ progressScore: 7, challengeDice: [3, 7] });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.outcome).toBe('weak_hit');
    expect(result.value.isMatch).toBe(false);
  });
});
