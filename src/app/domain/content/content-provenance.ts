import type { EntityId } from '../shared';

export type ContentSourceCategory =
  | 'official'
  | 'srd_derived'
  | 'project_original'
  | 'user_authored'
  | 'custom'
  | 'unknown'
  | 'restricted';

export interface ContentProvenance {
  readonly category: ContentSourceCategory;
  readonly sourceId?: EntityId;
  readonly title?: string;
  readonly license?: string;
  readonly attribution?: string;
  readonly reviewedForUse: boolean;
}

export const PROJECT_ORIGINAL_PROVENANCE: ContentProvenance = {
  category: 'project_original',
  title: 'Ironsworn Digital Companion project-original content',
  reviewedForUse: true,
};
