import {
  isChallengeRank,
  isProgressTrackType,
  type ChallengeRank,
  type ProgressTrackType,
} from './progress-track';

import {
  rulesFailure,
  rulesSuccess,
  type RulesResult,
  type ValidationError,
} from '@app/rules/validation';

export interface ProgressTrackClassification {
  readonly type: ProgressTrackType;
  readonly rank: ChallengeRank;
}

export const validateProgressTrackClassification = (input: {
  readonly type: unknown;
  readonly rank: unknown;
}): RulesResult<ProgressTrackClassification> => {
  const errors: ValidationError[] = [];
  const type = input.type;
  const rank = input.rank;

  if (!isProgressTrackType(type)) {
    errors.push({
      code: 'unsupported_type',
      field: 'type',
      message: 'Choose a supported track type.',
    });
  }

  if (!isChallengeRank(rank)) {
    errors.push({ code: 'unsupported_rank', field: 'rank', message: 'Choose a supported rank.' });
  }

  if (errors.length > 0) return rulesFailure(errors);
  return rulesSuccess({ type: type as ProgressTrackType, rank: rank as ChallengeRank });
};
