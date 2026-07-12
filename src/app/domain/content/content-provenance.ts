import type { EntityId } from '../shared';

export type ContentSourceCategory =
  | 'official'
  | 'srd_derived'
  | 'project_original'
  | 'user_authored'
  | 'custom'
  | 'unknown'
  | 'restricted';

export type ContentReleaseStatus = 'allowed' | 'review-required' | 'blocked';
export type ContentReviewStatus = 'unreviewed' | 'reviewed' | 'needs-legal-review' | 'rejected';

export interface ContentProvenance {
  readonly category: ContentSourceCategory;
  readonly sourceId?: EntityId;
  readonly title?: string;
  readonly license?: string;
  readonly attribution?: string;
  readonly reviewedForUse: boolean;
  readonly releaseStatus?: ContentReleaseStatus;
  readonly reviewStatus?: ContentReviewStatus;
  readonly manifestId?: EntityId;
}

export const PROJECT_ORIGINAL_PROVENANCE: ContentProvenance = {
  category: 'project_original',
  title: 'Ironsworn Digital Companion project-original content',
  reviewedForUse: true,
  releaseStatus: 'allowed',
  reviewStatus: 'reviewed',
};

export const isReleaseEligibleProvenance = (provenance?: ContentProvenance): boolean =>
  provenance?.reviewedForUse === true &&
  provenance.releaseStatus === 'allowed' &&
  provenance.reviewStatus === 'reviewed' &&
  provenance.category !== 'unknown' &&
  provenance.category !== 'restricted';

export const provenanceStateLabel = (provenance: ContentProvenance): string => {
  if (isReleaseEligibleProvenance(provenance)) return 'Reviewed for release';
  if (provenance.releaseStatus === 'blocked') return 'Blocked from release';
  if (provenance.reviewStatus === 'unreviewed') return 'Awaiting review';
  return 'Not release eligible';
};
