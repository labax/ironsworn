import { TestBed } from '@angular/core/testing';

import { createDefaultProgressTrack } from '@app/domain/progress';
import { createDefaultVow, type Vow } from '@app/domain/vows';

import { CampaignWorkspaceService } from './campaign-workspace.service';

const vowFixture = (overrides: Partial<Vow> = {}): Vow => ({
  ...createDefaultVow({
    id: 'vow-selected',
    createdAt: '2026-07-01T00:00:00.000Z',
    title: 'Hold the bridge watch',
    rank: 'dangerous',
    description: 'User-authored setup.',
    notes: 'Keep the signal fire ready.',
    progressTrackId: 'track-linked',
  }),
  milestones: [
    {
      id: 'milestone-one',
      title: 'Found a safe ford',
      createdAt: '2026-07-02T00:00:00.000Z',
      notes: 'Short player note.',
      progressEventId: 'event-one',
    },
  ],
  outcome: {
    resolvedAt: '2026-07-03T00:00:00.000Z',
    summary: 'Player-written outcome.',
    rollId: 'roll-one',
  },
  ...overrides,
});

describe('CampaignWorkspaceService vow rank and status actions', () => {
  let service: CampaignWorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CampaignWorkspaceService);
    service.clearVows();
    service.clearProgressTracks();
  });

  it.each(['troublesome', 'dangerous', 'formidable', 'extreme', 'epic'] as const)(
    'updates only the selected vow rank to %s and preserves linked data',
    (rank) => {
      const selected = vowFixture();
      const unrelated = vowFixture({ id: 'vow-unrelated', title: 'Unrelated promise' });
      const track = createDefaultProgressTrack({
        id: 'track-linked',
        createdAt: '2026-07-01T00:00:00.000Z',
        title: 'Linked track',
        type: 'vow',
        rank: 'dangerous',
      });
      service.setVows([selected, unrelated]);
      service.setProgressTracks([{ ...track, ticks: 12 }]);

      const result = service.updateVowRank({ vowId: selected.id, rank });

      expect(result.ok).toBe(true);
      const saved = service.vows().find((vow) => vow.id === selected.id);
      expect(saved).toMatchObject({
        id: selected.id,
        rank,
        status: selected.status,
        description: selected.description,
        notes: selected.notes,
        progressTrackId: selected.progressTrackId,
        outcome: selected.outcome,
      });
      expect(saved?.milestones).toEqual(selected.milestones);
      expect(service.vows().find((vow) => vow.id === unrelated.id)).toEqual(unrelated);
      expect(service.progressTracks()[0].ticks).toBe(12);
    },
  );

  it.each(['active', 'fulfilled', 'forsaken', 'archived'] as const)(
    'updates only the selected vow status to %s and preserves linked data',
    (status) => {
      const selected = vowFixture({ status: 'active' });
      const unrelated = vowFixture({ id: 'vow-unrelated', title: 'Unrelated promise' });
      service.setVows([selected, unrelated]);

      const result = service.updateVowStatus({ vowId: selected.id, status });

      expect(result.ok).toBe(true);
      const saved = service.vows().find((vow) => vow.id === selected.id);
      expect(saved).toMatchObject({
        id: selected.id,
        status,
        rank: selected.rank,
        description: selected.description,
        notes: selected.notes,
        progressTrackId: selected.progressTrackId,
        outcome: selected.outcome,
      });
      expect(saved?.milestones).toEqual(selected.milestones);
      expect(service.vows().find((vow) => vow.id === unrelated.id)).toEqual(unrelated);
    },
  );

  it('rejects invalid enum values safely without mutating vows', () => {
    const selected = vowFixture();
    service.setVows([selected]);

    const rankResult = service.updateVowRank({ vowId: selected.id, rank: 'minor' });
    const statusResult = service.updateVowStatus({ vowId: selected.id, status: 'pending' });

    expect(rankResult).toMatchObject({ ok: false, errors: [{ code: 'unsupported_rank' }] });
    expect(statusResult).toMatchObject({ ok: false, errors: [{ code: 'unsupported_status' }] });
    expect(service.vows()[0]).toEqual(selected);
  });
});
