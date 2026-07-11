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
  it('resolves a vow progress roll with stable vow and track snapshots without mutating state', () => {
    const vow = vowFixture({
      id: 'vow-roll',
      title: 'Swear a test vow',
      progressTrackId: 'track-roll',
    });
    const unrelated = vowFixture({
      id: 'vow-other',
      title: 'Unrelated',
      progressTrackId: undefined,
    });
    const track = {
      ...createDefaultProgressTrack({
        id: 'track-roll',
        createdAt: '2026-07-02T00:00:00.000Z',
        title: 'Track the vow',
        type: 'vow',
        rank: 'formidable',
      }),
      ticks: 24,
    };
    service.setVows([vow, unrelated]);
    service.setProgressTracks([track]);

    const result = service.resolveProgressRollForVow({
      vowId: 'vow-roll',
      challengeDice: [4, 4],
      rolledAt: '2026-07-11T00:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      type: 'progress',
      vowId: 'vow-roll',
      vowTitle: 'Swear a test vow',
      trackId: 'track-roll',
      progressTrackId: 'track-roll',
      trackTitle: 'Track the vow',
      trackType: 'vow',
      progressScore: 6,
      challengeDice: [4, 4],
      outcome: 'strong_hit',
      isMatch: true,
      rolledAt: '2026-07-11T00:00:00.000Z',
      source: 'manual',
    });
    expect(service.vows().find((candidate) => candidate.id === 'vow-roll')).toEqual(vow);
    expect(service.vows().find((candidate) => candidate.id === 'vow-other')).toEqual(unrelated);
    expect(service.progressTracks()[0]).toEqual(track);
  });

  it.each([
    ['strong_hit', 8, [2, 7]],
    ['weak_hit', 5, [2, 7]],
    ['miss', 5, [5, 7]],
    ['strong_hit', 9, [6, 6]],
  ] as const)('resolves deterministic vow progress roll outcome %s', (outcome, score, dice) => {
    const vow = vowFixture({ id: `vow-${outcome}`, progressTrackId: `track-${outcome}` });
    const track = {
      ...createDefaultProgressTrack({
        id: `track-${outcome}`,
        createdAt: '2026-07-02T00:00:00.000Z',
        title: 'Mechanics-only fixture',
        type: 'vow',
        rank: 'dangerous',
      }),
      ticks: score * 4,
    };
    service.setVows([vow]);
    service.setProgressTracks([track]);

    const result = service.resolveProgressRollForVow({ vowId: vow.id, challengeDice: dice });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.outcome).toBe(outcome);
    expect(result.value.challengeDice).toEqual(dice);
    expect(result.value.isMatch).toBe(dice[0] === dice[1]);
  });

  it('rejects missing broken and malformed vow progress links without mutating state', () => {
    const missing = vowFixture({ id: 'vow-missing-link', progressTrackId: undefined });
    const broken = vowFixture({ id: 'vow-broken-link', progressTrackId: 'track-missing' });
    const malformed = vowFixture({ id: 'vow-malformed-link', progressTrackId: 'track-malformed' });
    const track = {
      ...createDefaultProgressTrack({
        id: 'track-malformed',
        createdAt: '2026-07-02T00:00:00.000Z',
        title: 'Malformed',
        type: 'vow',
        rank: 'dangerous',
      }),
      ticks: Number.NaN,
    };
    service.setVows([missing, broken, malformed]);
    service.setProgressTracks([track]);

    expect(service.resolveProgressRollForVow({ vowId: missing.id })).toMatchObject({
      ok: false,
      errors: [{ code: 'missing_link' }],
    });
    expect(service.resolveProgressRollForVow({ vowId: broken.id })).toMatchObject({
      ok: false,
      errors: [{ code: 'broken_link' }],
    });
    expect(service.resolveProgressRollForVow({ vowId: malformed.id })).toMatchObject({
      ok: false,
      errors: [{ code: 'not_numeric' }],
    });
    expect(service.vows()).toEqual(expect.arrayContaining([missing, broken, malformed]));
    expect(service.progressTracks()[0]).toEqual(track);
  });
});

describe('CampaignWorkspaceService progress track archive restore delete actions', () => {
  let service: CampaignWorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CampaignWorkspaceService);
    service.clearVows();
    service.clearProgressTracks();
  });

  it('archives and restores only the selected progress track while preserving identity and fields', () => {
    const selected = createDefaultProgressTrack({
      id: 'track-archive',
      createdAt: '2026-07-01T00:00:00.000Z',
      title: 'User-authored track',
      type: 'journey',
      rank: 'formidable',
      notes: 'Keep these notes.',
    });
    const complete = {
      ...selected,
      ticks: 16,
      events: [{ id: 'event-1', createdAt: '2026-07-02T00:00:00.000Z', ticksDelta: 8 }],
    };
    const unrelated = createDefaultProgressTrack({
      id: 'track-unrelated',
      createdAt: '2026-07-03T00:00:00.000Z',
      title: 'Unrelated track',
      type: 'custom',
      rank: 'dangerous',
    });
    service.setProgressTracks([complete, unrelated]);

    const archived = service.archiveProgressTrack('track-archive');

    expect(archived.ok).toBe(true);
    const archivedTrack = service.progressTracks().find((track) => track.id === 'track-archive');
    expect(archivedTrack).toMatchObject({
      id: complete.id,
      status: 'archived',
      title: complete.title,
      type: complete.type,
      rank: complete.rank,
      ticks: complete.ticks,
      notes: complete.notes,
      createdAt: complete.createdAt,
    });
    expect(archivedTrack?.events).toEqual(complete.events);
    expect(service.progressTracks().find((track) => track.id === 'track-unrelated')).toEqual(
      unrelated,
    );

    const restored = service.restoreProgressTrack('track-archive');

    expect(restored.ok).toBe(true);
    const restoredTrack = service.progressTracks().find((track) => track.id === 'track-archive');
    expect(restoredTrack).toMatchObject({
      id: complete.id,
      status: 'active',
      ticks: complete.ticks,
    });
    expect(restoredTrack?.events).toEqual(complete.events);
  });

  it('previews warnings and deletes only the selected track without cascading linked vows', () => {
    const selected = createDefaultProgressTrack({
      id: 'track-delete',
      createdAt: '2026-07-01T00:00:00.000Z',
      title: 'Delete candidate',
      type: 'vow',
      rank: 'dangerous',
      notes: 'Player note.',
    });
    const unrelated = createDefaultProgressTrack({
      id: 'track-keep',
      createdAt: '2026-07-02T00:00:00.000Z',
      title: 'Keep candidate',
      type: 'custom',
      rank: 'troublesome',
    });
    const vow = vowFixture({ id: 'vow-linked', progressTrackId: selected.id });
    service.setVows([vow]);
    service.setProgressTracks([{ ...selected, ticks: 12 }, unrelated]);

    const preview = service.previewDeleteProgressTrack(selected.id);

    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    expect(preview.warnings.map((warning) => warning.code)).toEqual([
      'linked_vow',
      'has_progress',
      'has_notes',
    ]);

    const deleted = service.deleteProgressTrack(selected.id);

    expect(deleted.ok).toBe(true);
    expect(service.progressTracks()).toEqual([unrelated]);
    expect(service.vows()).toEqual([vow]);
  });

  it('fails stale progress track archive, restore, preview, and delete requests safely', () => {
    const beforeTracks = service.progressTracks();
    const beforeVows = service.vows();

    expect(service.archiveProgressTrack('missing-track')).toMatchObject({ ok: false });
    expect(service.restoreProgressTrack('missing-track')).toMatchObject({ ok: false });
    expect(service.previewDeleteProgressTrack('missing-track')).toMatchObject({ ok: false });
    expect(service.deleteProgressTrack('missing-track')).toMatchObject({ ok: false });
    expect(service.progressTracks()).toEqual(beforeTracks);
    expect(service.vows()).toEqual(beforeVows);
  });
});
