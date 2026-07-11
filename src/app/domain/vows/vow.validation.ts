import { isChallengeRank, type ChallengeRank } from '@app/domain/progress';
import {
  rulesFailure,
  rulesSuccess,
  type RulesResult,
  type ValidationError,
} from '@app/rules/validation';

import { isVowStatus, type VowStatus } from './vow';

export type VowValidationField = 'title' | 'rank' | 'status';

export interface VowDetailsInput {
  readonly title: unknown;
  readonly description?: unknown;
  readonly rank: unknown;
  readonly status: unknown;
  readonly notes?: unknown;
}

export interface ValidVowDetails {
  readonly title: string;
  readonly description?: string;
  readonly rank: ChallengeRank;
  readonly status: VowStatus;
  readonly notes: string;
}

const fieldError = (code: string, field: VowValidationField, message: string): ValidationError => ({
  code,
  field,
  message,
});

export const validateVowDetails = (input: VowDetailsInput): RulesResult<ValidVowDetails> => {
  const errors: ValidationError[] = [];
  const title = typeof input.title === 'string' ? input.title.trim() : '';

  if (!title) errors.push(fieldError('required', 'title', 'Enter a vow title.'));
  if (typeof input.title !== 'string') {
    errors.push(fieldError('invalid_type', 'title', 'Enter a vow title.'));
  }
  if (!isChallengeRank(input.rank)) {
    errors.push(fieldError('unsupported_rank', 'rank', 'Choose a supported rank.'));
  }
  if (!isVowStatus(input.status)) {
    errors.push(fieldError('unsupported_status', 'status', 'Choose a supported status.'));
  }

  if (errors.length > 0) return rulesFailure(errors);
  return rulesSuccess({
    title,
    description: typeof input.description === 'string' ? input.description : undefined,
    rank: input.rank as ChallengeRank,
    status: input.status as VowStatus,
    notes: typeof input.notes === 'string' ? input.notes : '',
  });
};
