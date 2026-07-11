import type { ChallengeRank } from '@domain/progress';
import type { ProgressRollDice, RollOutcome } from '@domain/rolls';
import { rollChallengeDice, validateChallengeDie } from '../dice';
import { detectChallengeMatch } from '../action-rolls';
import { rulesFailure, rulesSuccess, type RulesResult, type ValidationError } from '../validation';

export type ProgressRollOutcome = Extract<RollOutcome, 'strong_hit' | 'weak_hit' | 'miss'>;

export interface ProgressRollInput {
  readonly progressScore: number;
  readonly challengeDice?: readonly [number, number];
}

export interface ProgressRollResult extends ProgressRollDice {
  readonly outcome: ProgressRollOutcome;
  readonly challengeResults: readonly [boolean, boolean];
  readonly isMatch: boolean;
  readonly trace: readonly string[];
}

export interface ProgressState {
  readonly ticks?: number;
  readonly boxes?: number;
}

export interface ProgressValidationOptions {
  readonly mode?: 'normal' | 'manual_correction';
}

export interface ProgressScoreResult {
  readonly ticks: number;
  readonly boxes: number;
  readonly progressScore: number;
}

export const PROGRESS_TICKS_PER_BOX = 4;
export const MIN_PROGRESS_TICKS = 0;
export const MAX_PROGRESS_TICKS = 40;
export const MIN_PROGRESS_BOXES = 0;
export const MAX_PROGRESS_BOXES = 10;
export const MIN_PROGRESS_SCORE = 0;
export const MAX_PROGRESS_SCORE = 10;

export const PROGRESS_RANK_TICK_INCREMENTS = {
  troublesome: 12,
  dangerous: 8,
  formidable: 4,
  extreme: 2,
  epic: 1,
} as const satisfies Record<ChallengeRank, number>;

const supportedProgressRanks = Object.keys(PROGRESS_RANK_TICK_INCREMENTS) as ChallengeRank[];

const isSupportedProgressRank = (rank: unknown): rank is ChallengeRank =>
  typeof rank === 'string' && supportedProgressRanks.includes(rank as ChallengeRank);

const validationMode = (options?: ProgressValidationOptions): 'normal' | 'manual_correction' =>
  options?.mode ?? 'normal';

const invalidNumberError = (field: string): ValidationError => ({
  code: 'not_numeric',
  field,
  message: `${field} must be a finite number.`,
});

const notIntegerError = (field: string): ValidationError => ({
  code: 'not_integer',
  field,
  message: `${field} must be an integer.`,
});

const outOfRangeError = (
  field: string,
  min: number,
  max: number,
  actual: number,
): ValidationError => ({
  code: 'out_of_range',
  field,
  message: `${field} must be an integer from ${min} to ${max}; received ${actual}.`,
});

const validateWholeNumber = (field: string, value: unknown): ValidationError[] => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return [invalidNumberError(field)];
  if (!Number.isInteger(value)) return [notIntegerError(field)];
  return [];
};

const validateNormalRange = (
  field: string,
  value: number,
  min: number,
  max: number,
  options?: ProgressValidationOptions,
): ValidationError[] => {
  if (validationMode(options) === 'manual_correction') return [];
  if (value < min || value > max) return [outOfRangeError(field, min, max, value)];
  return [];
};

const boundedProgressScore = (ticks: number): number =>
  Math.min(
    MAX_PROGRESS_SCORE,
    Math.max(MIN_PROGRESS_SCORE, Math.floor(ticks / PROGRESS_TICKS_PER_BOX)),
  );

export const progressRankIncrementTicks = (rank: unknown): RulesResult<number> => {
  if (!isSupportedProgressRank(rank)) {
    return rulesFailure([
      {
        code: 'unsupported_rank',
        field: 'rank',
        message: 'rank is not supported for progress increments.',
      },
    ]);
  }
  return rulesSuccess(PROGRESS_RANK_TICK_INCREMENTS[rank]);
};

export const boxesToTicks = (
  boxes: unknown,
  options?: ProgressValidationOptions,
): RulesResult<number> => {
  const numericErrors = validateWholeNumber('boxes', boxes);
  if (numericErrors.length > 0) return rulesFailure(numericErrors);

  const boxCount = boxes as number;
  const rangeErrors = validateNormalRange(
    'boxes',
    boxCount,
    MIN_PROGRESS_BOXES,
    MAX_PROGRESS_BOXES,
    options,
  );
  if (rangeErrors.length > 0) return rulesFailure(rangeErrors);
  return rulesSuccess(boxCount * PROGRESS_TICKS_PER_BOX);
};

export const ticksToBoxes = (
  ticks: unknown,
  options?: ProgressValidationOptions,
): RulesResult<number> => {
  const numericErrors = validateWholeNumber('ticks', ticks);
  if (numericErrors.length > 0) return rulesFailure(numericErrors);

  const tickCount = ticks as number;
  const rangeErrors = validateNormalRange(
    'ticks',
    tickCount,
    MIN_PROGRESS_TICKS,
    MAX_PROGRESS_TICKS,
    options,
  );
  if (rangeErrors.length > 0) return rulesFailure(rangeErrors);
  return rulesSuccess(Math.floor(tickCount / PROGRESS_TICKS_PER_BOX));
};

export const progressScoreFromTicks = (
  ticks: unknown,
  options?: ProgressValidationOptions,
): RulesResult<number> => {
  const boxes = ticksToBoxes(ticks, options);
  if (!boxes.ok) return boxes;
  return rulesSuccess(boundedProgressScore(ticks as number));
};

export const progressScoreFromState = (
  state: unknown,
  options?: ProgressValidationOptions,
): RulesResult<ProgressScoreResult> => {
  if (typeof state !== 'object' || state === null) {
    return rulesFailure([
      {
        code: 'malformed_progress_state',
        field: 'progress',
        message: 'progress state is malformed.',
      },
    ]);
  }

  const progressState = state as ProgressState;
  const hasTicks = progressState.ticks !== undefined;
  const hasBoxes = progressState.boxes !== undefined;
  if (hasTicks === hasBoxes) {
    return rulesFailure([
      {
        code: 'unsupported_conversion',
        field: 'progress',
        message: 'progress state must provide exactly one of ticks or boxes.',
      },
    ]);
  }

  const tickResult = hasTicks
    ? rulesSuccess(progressState.ticks as number)
    : boxesToTicks(progressState.boxes, options);
  if (!tickResult.ok) return tickResult;

  const scoreResult = progressScoreFromTicks(tickResult.value, options);
  if (!scoreResult.ok) return scoreResult;

  return rulesSuccess({
    ticks: tickResult.value,
    boxes: Math.floor(tickResult.value / PROGRESS_TICKS_PER_BOX),
    progressScore: scoreResult.value,
  });
};

export const classifyProgressRoll = (
  progressScore: number,
  challengeDice: readonly [number, number],
): ProgressRollOutcome => {
  const hits = challengeDice.filter((challengeDie) => progressScore > challengeDie).length;
  if (hits === 2) return 'strong_hit';
  if (hits === 1) return 'weak_hit';
  return 'miss';
};

export const resolveProgressRoll = (input: ProgressRollInput): RulesResult<ProgressRollResult> => {
  const challengeDice = input.challengeDice ?? rollChallengeDice();
  const errors: ValidationError[] = challengeDice.flatMap((die, index) => {
    const result = validateChallengeDie(die, `challengeDice.${index}`);
    return result.ok ? [] : result.errors;
  });

  if (
    !Number.isInteger(input.progressScore) ||
    input.progressScore < MIN_PROGRESS_SCORE ||
    input.progressScore > MAX_PROGRESS_SCORE
  ) {
    errors.push({
      code: 'out_of_range',
      field: 'progressScore',
      message: `progressScore must be an integer from ${MIN_PROGRESS_SCORE} to ${MAX_PROGRESS_SCORE}.`,
    });
  }
  if (errors.length > 0) return rulesFailure(errors);

  const outcome = classifyProgressRoll(input.progressScore, challengeDice);
  return rulesSuccess({
    progressScore: input.progressScore,
    challengeDice,
    outcome,
    challengeResults: [
      input.progressScore > challengeDice[0],
      input.progressScore > challengeDice[1],
    ],
    isMatch: detectChallengeMatch(challengeDice),
    trace: ['progress score compares directly to challenge dice'],
  });
};
