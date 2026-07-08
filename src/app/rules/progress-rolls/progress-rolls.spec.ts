import { describe, expect, it } from 'vitest';
import { classifyProgressRoll, resolveProgressRoll } from './progress-rolls';

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
