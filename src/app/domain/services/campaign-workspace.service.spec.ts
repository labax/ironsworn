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
      createdAt: '2026-07-02T00:00:00.000Z',
      note: 'Short player note.',
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

  it('adds edits and removes typed vow milestones without changing unrelated vow or progress data', () => {
    const selected = vowFixture({ id: 'vow-milestone', progressTrackId: 'track-linked' });
    const unrelated = vowFixture({ id: 'vow-unrelated', title: 'Leave untouched' });
    const track = createDefaultProgressTrack({
      id: 'track-linked',
      createdAt: '2026-07-01T00:00:00.000Z',
      title: 'Linked track',
      type: 'vow',
      rank: 'dangerous',
    });
    service.setVows([selected, unrelated]);
    service.setProgressTracks([{ ...track, ticks: 12 }]);

    const added = service.addVowMilestone({
      vowId: selected.id,
      note: 'A long note. '.repeat(120),
    });

    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.milestone.id).toMatch(/^vow-milestone-/);
    expect(added.milestone.createdAt).toBe(added.milestone.updatedAt);
    const afterAdd = service.vows().find((vow) => vow.id === selected.id);
    expect(afterAdd).toMatchObject({
      id: selected.id,
      rank: selected.rank,
      status: selected.status,
      notes: selected.notes,
      progressTrackId: selected.progressTrackId,
      outcome: selected.outcome,
    });
    expect(service.progressTracks()[0].ticks).toBe(12);

    const edited = service.updateVowMilestone({
      vowId: selected.id,
      milestoneId: added.milestone.id,
      note: 'Edited by the player.',
    });

    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.milestone.id).toBe(added.milestone.id);
    expect(edited.milestone.createdAt).toBe(added.milestone.createdAt);
    expect(edited.milestone.note).toBe('Edited by the player.');
    expect(service.vows().find((vow) => vow.id === unrelated.id)).toEqual(unrelated);

    const removed = service.removeVowMilestone({
      vowId: selected.id,
      milestoneId: added.milestone.id,
    });

    expect(removed.ok).toBe(true);
    expect(service.vows().find((vow) => vow.id === selected.id)?.milestones).toEqual(
      selected.milestones,
    );
    expect(service.progressTracks()[0].ticks).toBe(12);
  });

  it('saves user-authored vow outcome notes with an explicit timestamp and preserves other vow data', () => {
    const selected = vowFixture({ id: 'vow-outcome', status: 'fulfilled' });
    const unrelated = vowFixture({ id: 'vow-unrelated', title: 'Leave untouched' });
    const track = createDefaultProgressTrack({
      id: 'track-linked',
      createdAt: '2026-07-01T00:00:00.000Z',
      title: 'Linked track',
      type: 'vow',
      rank: 'dangerous',
    });
    service.setVows([selected, unrelated]);
    service.setProgressTracks([{ ...track, ticks: 24 }]);

    const result = service.updateVowOutcome({
      vowId: selected.id,
      summary: 'A long player-authored resolution. '.repeat(120),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.outcome.summary).toBe('A long player-authored resolution. '.repeat(120));
    expect(result.outcome.resolvedAt).toMatch(/T/);
    expect(result.outcome.rollId).toBe(selected.outcome?.rollId);
    const saved = service.vows().find((vow) => vow.id === selected.id);
    expect(saved).toMatchObject({
      id: selected.id,
      title: selected.title,
      rank: selected.rank,
      status: selected.status,
      notes: selected.notes,
      progressTrackId: selected.progressTrackId,
      characterId: selected.characterId,
      campaignId: selected.campaignId,
    });
    expect(saved?.outcome?.summary).toBe('A long player-authored resolution. '.repeat(120));
    expect(saved?.outcome?.resolvedAt).toBe(result.outcome.resolvedAt);
    expect(saved?.milestones).toEqual(selected.milestones);
    expect(service.vows().find((vow) => vow.id === unrelated.id)).toEqual(unrelated);
    expect(service.progressTracks()[0].ticks).toBe(24);
  });

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

describe('CampaignWorkspaceService vow progress track links', () => {
  let service: CampaignWorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CampaignWorkspaceService);
    service.clearVows();
    service.clearProgressTracks();
  });

  it('links one existing vow to one existing track and rejects duplicate/conflicting links', () => {
    const vow = vowFixture({ id: 'vow-link', progressTrackId: undefined, notes: 'Keep note.' });
    const other = vowFixture({ id: 'vow-other', progressTrackId: 'track-other' });
    const track = createDefaultProgressTrack({
      id: 'track-link',
      createdAt: '2026-07-02T00:00:00.000Z',
      title: 'User track',
      type: 'vow',
      rank: 'formidable',
    });
    const otherTrack = createDefaultProgressTrack({
      id: 'track-other',
      createdAt: '2026-07-03T00:00:00.000Z',
      title: 'Other track',
      type: 'vow',
      rank: 'dangerous',
    });
    service.setVows([vow, other]);
    service.setProgressTracks([track, otherTrack]);

    const linked = service.linkVowToProgressTrack({ vowId: vow.id, progressTrackId: track.id });
    const duplicate = service.linkVowToProgressTrack({
      vowId: other.id,
      progressTrackId: track.id,
    });
    const conflict = service.linkVowToProgressTrack({
      vowId: vow.id,
      progressTrackId: otherTrack.id,
    });

    expect(linked.ok).toBe(true);
    expect(service.vows().find((candidate) => candidate.id === vow.id)).toMatchObject({
      id: vow.id,
      title: vow.title,
      notes: vow.notes,
      progressTrackId: track.id,
    });
    expect(service.progressTracks().find((candidate) => candidate.id === track.id)).toEqual(track);
    expect(duplicate).toMatchObject({ ok: false, errors: [{ code: 'conflict' }] });
    expect(conflict).toMatchObject({ ok: false, errors: [{ code: 'conflict' }] });
  });

  it('creates a single vow-type track for a vow and unlinks without deleting either record', () => {
    const vow = vowFixture({ id: 'vow-create-link', progressTrackId: undefined });
    service.setVows([vow]);

    const created = service.createProgressTrackForVow({ vowId: vow.id });

    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.track).toMatchObject({
      title: vow.title,
      type: 'vow',
      rank: vow.rank,
      ticks: 0,
    });
    expect(service.progressTracks()).toHaveLength(1);
    expect(service.vows()[0]).toMatchObject({ id: vow.id, progressTrackId: created.track.id });

    const unlinked = service.unlinkVowProgressTrack(vow.id);

    expect(unlinked.ok).toBe(true);
    expect(service.vows()[0].progressTrackId).toBeUndefined();
    expect(service.progressTracks()).toHaveLength(1);
    expect(service.progressTracks()[0]).toMatchObject({ id: created.track.id, title: vow.title });
  });
});
