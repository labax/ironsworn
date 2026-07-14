import { PROJECT_ORIGINAL_PROVENANCE } from '@app/domain/content';

export const ONBOARDING_COPY_PROVENANCE = {
  ...PROJECT_ORIGINAL_PROVENANCE,
  sourceId: 'project-original-onboarding-welcome-copy',
  title: 'Project-original onboarding welcome copy',
  manifestId: 'project-original-onboarding-welcome-copy',
} as const;

export const ONBOARDING_WELCOME_COPY = {
  title: 'Welcome to your campaign workspace',
  scope:
    'Use this unofficial companion to keep a local character sheet, progress tracks, vows, rolls, oracles, and journal notes close at hand while you play.',
  disclaimer:
    'This is an unofficial, project-original companion for tabletop play. It is not published, endorsed, or approved by the Ironsworn creators or rightsholders.',
  localData:
    'Your campaign data is stored in this browser on this device. You can review and edit it later from the workspace tools.',
  checklist: [
    'Create or restore a character.',
    'Add vows, tracks, and notes as play begins.',
    'Use the workspace tools at your own pace.',
  ],
} as const;
