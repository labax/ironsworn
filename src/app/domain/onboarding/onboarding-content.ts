import { PROJECT_ORIGINAL_PROVENANCE } from '@app/domain/content';

export const ONBOARDING_COPY_PROVENANCE = {
  ...PROJECT_ORIGINAL_PROVENANCE,
  sourceId: 'project-original-onboarding-welcome-copy',
  title: 'Project-original onboarding welcome copy',
  manifestId: 'project-original-onboarding-welcome-copy',
} as const;

export const ONBOARDING_FIRST_VOW_COPY_PROVENANCE = {
  ...PROJECT_ORIGINAL_PROVENANCE,
  sourceId: 'project-original-onboarding-first-vow-copy',
  title: 'Project-original onboarding first vow copy',
  manifestId: 'project-original-onboarding-first-vow-copy',
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

export const ONBOARDING_REVIEW_COPY_PROVENANCE = {
  ...PROJECT_ORIGINAL_PROVENANCE,
  sourceId: 'project-original-onboarding-review-copy',
  title: 'Project-original onboarding review copy',
  manifestId: 'project-original-onboarding-review-copy',
} as const;

export const ONBOARDING_FIRST_VOW_COPY = {
  title: 'Name your first vow',
  helper: 'Start with only the essentials. You can edit the details later from Vows.',
  titleHelp: 'Use your own words for the promise your character is making.',
  rankHelp: 'Choose the scope that fits your table; progress can be handled later.',
  optionalHelp: 'Optional. Add only the context you want to keep now.',
  provenance: ONBOARDING_FIRST_VOW_COPY_PROVENANCE,
} as const;

export const ONBOARDING_EXIT_COPY = {
  title: 'Discard setup draft?',
  message:
    'This leaves saved records in place, but unsaved setup text on this step will be discarded.',
  confirm: 'Discard draft and exit',
  cancel: 'Continue setup',
} as const;

export const ONBOARDING_REVIEW_COPY = {
  title: 'Review and begin play',
  helper:
    'Confirm your character, starting tracks, first vow, and linked progress track before entering the workspace.',
  action: 'Finish setup',
  success: 'Setup saved. Opening your play workspace.',
  provenance: ONBOARDING_REVIEW_COPY_PROVENANCE,
} as const;
