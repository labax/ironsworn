import {
  isChallengeRank,
  isProgressTrackType,
  type ChallengeRank,
  type ProgressTrack,
  type ProgressTrackType,
} from './progress-track';

import { correctProgressTicks, type ProgressValidationOptions } from '@app/rules/progress-rolls';
import {
  rulesFailure,
  rulesSuccess,
  type RulesResult,
  type ValidationError,
} from '@app/rules/validation';

export type ProgressTrackValidationField = 'title' | 'type' | 'rank' | 'ticks' | 'progressMode';
export type ProgressTrackProgressMode = 'standard' | 'manual_override';

export interface ProgressTrackClassification {
  readonly type: ProgressTrackType;
  readonly rank: ChallengeRank;
}

export interface ProgressTrackDetailsInput {
  readonly title: unknown;
  readonly type: unknown;
  readonly rank: unknown;
  readonly notes?: unknown;
}

export interface ValidProgressTrackDetails extends ProgressTrackClassification {
  readonly title: string;
  readonly notes?: string;
}

export interface ProgressTicksInput {
  readonly ticks: unknown;
  readonly mode?: ProgressTrackProgressMode;
}

export interface ValidProgressTicks {
  readonly ticks: number;
  readonly mode: ProgressTrackProgressMode;
}

const fieldError = (
  code: string,
  field: ProgressTrackValidationField,
  message: string,
): ValidationError => ({ code, field, message });

export const progressModeOptions = (mode?: ProgressTrackProgressMode): ProgressValidationOptions =>
  mode === 'manual_override' ? { mode: 'manual_correction' } : { mode: 'normal' };

export const validateProgressTrackClassification = (input: {
  readonly type: unknown;
  readonly rank: unknown;
}): RulesResult<ProgressTrackClassification> => {
  const errors: ValidationError[] = [];
  const type = input.type;
  const rank = input.rank;

  if (!isProgressTrackType(type)) {
    errors.push(fieldError('unsupported_type', 'type', 'Choose a supported track type.'));
  }

  if (!isChallengeRank(rank)) {
    errors.push(fieldError('unsupported_rank', 'rank', 'Choose a supported rank.'));
  }

  if (errors.length > 0) return rulesFailure(errors);
  return rulesSuccess({ type: type as ProgressTrackType, rank: rank as ChallengeRank });
};

export const validateProgressTrackDetails = (
  input: ProgressTrackDetailsInput,
): RulesResult<ValidProgressTrackDetails> => {
  const classification = validateProgressTrackClassification(input);
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const errors: ValidationError[] = classification.ok ? [] : [...classification.errors];

  if (!title) errors.push(fieldError('required', 'title', 'Enter a track name.'));
  if (typeof input.title !== 'string') {
    errors.push(fieldError('invalid_type', 'title', 'Enter a track name.'));
  }

  if (errors.length > 0 || !classification.ok) return rulesFailure(errors);
  return rulesSuccess({
    title,
    type: classification.value.type,
    rank: classification.value.rank,
    notes: typeof input.notes === 'string' ? input.notes.trim() || undefined : undefined,
  });
};

export const validateProgressTrackTicks = (
  input: ProgressTicksInput,
): RulesResult<ValidProgressTicks> => {
  const mode = input.mode ?? 'standard';
  if (mode !== 'standard' && mode !== 'manual_override') {
    return rulesFailure([
      fieldError('unsupported_mode', 'progressMode', 'Choose standard or manual override mode.'),
    ]);
  }

  const progress = correctProgressTicks(input.ticks, progressModeOptions(mode));
  if (!progress.ok) return rulesFailure(progress.errors);
  return rulesSuccess({ ticks: progress.value.ticks, mode });
};

export const validateProgressTrackForCommit = (
  track: ProgressTrack,
): RulesResult<ProgressTrack> => {
  const details = validateProgressTrackDetails(track);
  const ticks = validateProgressTrackTicks({ ticks: track.ticks, mode: track.progressMode });
  const errors = [...(details.ok ? [] : details.errors), ...(ticks.ok ? [] : ticks.errors)];
  if (errors.length > 0 || !details.ok || !ticks.ok) return rulesFailure(errors);
  return rulesSuccess({
    ...track,
    title: details.value.title,
    type: details.value.type,
    rank: details.value.rank,
    ticks: ticks.value.ticks,
    progressMode: ticks.value.mode,
    notes: details.value.notes,
  });
};
