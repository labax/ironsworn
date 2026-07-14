import { ACTIVE_CHARACTER_STORAGE_KEY } from '@app/domain/character/active-character-persistence.service';
import { ONBOARDING_STATUS_STORAGE_KEY } from '@app/domain/onboarding/onboarding-state.service';
import { ROLL_HISTORY_STORAGE_KEY } from '@app/domain/rolls/roll-history.persistence';
import { APPLICATION_STATE_STORAGE_KEY } from '@app/domain/services/application-autosave.service';
import { CAMPAIGN_WORKSPACE_STORAGE_KEY } from '@app/domain/services/campaign-workspace-persistence.service';

export interface ApplicationStorageKeyRegistration {
  readonly key: string;
  readonly owner: 'application-state' | 'character' | 'workspace' | 'roll-history' | 'onboarding';
  readonly status: 'current' | 'legacy';
  readonly description: string;
}

export const APPLICATION_OWNED_STORAGE_KEYS: readonly ApplicationStorageKeyRegistration[] = [
  {
    key: APPLICATION_STATE_STORAGE_KEY,
    owner: 'application-state',
    status: 'current',
    description: 'Unified autosave snapshot for active character, workspace, and roll history.',
  },
  {
    key: ACTIVE_CHARACTER_STORAGE_KEY,
    owner: 'character',
    status: 'current',
    description: 'Supported active character persistence record.',
  },
  {
    key: CAMPAIGN_WORKSPACE_STORAGE_KEY,
    owner: 'workspace',
    status: 'current',
    description: 'Supported campaign workspace persistence record.',
  },
  {
    key: ROLL_HISTORY_STORAGE_KEY,
    owner: 'roll-history',
    status: 'current',
    description: 'Supported roll history persistence record.',
  },
  {
    key: ONBOARDING_STATUS_STORAGE_KEY,
    owner: 'onboarding',
    status: 'current',
    description: 'Supported first-run onboarding status record.',
  },
] as const;

export const APPLICATION_OWNED_STORAGE_KEY_VALUES = APPLICATION_OWNED_STORAGE_KEYS.map(
  (entry) => entry.key,
);
