import { describe, expect, it } from 'vitest';

import {
  clampMomentum,
  clampProgressTicks,
  createDefaultCharacter,
  createDefaultJournalEntry,
  createDefaultProgressTrack,
  createDefaultVow,
  isCharacter,
  isProgressTrack,
  isValidMomentum,
  isValidProgressTicks,
  isValidStats,
  isValidStatusTracks,
} from './index';

const timestamp = '2026-01-02T03:04:05.000Z';

describe('domain default helpers', () => {
  it('creates deterministic character defaults', () => {
    const character = createDefaultCharacter({
      id: 'character-1',
      createdAt: timestamp,
      name: 'Project Test Character',
      campaignId: 'campaign-1',
    });

    expect(character).toMatchObject({
      id: 'character-1',
      createdAt: timestamp,
      updatedAt: timestamp,
      schemaVersion: 1,
      recordStatus: 'active',
      name: 'Project Test Character',
      campaignId: 'campaign-1',
      statusTracks: { health: 5, spirit: 5, supply: 5 },
      momentum: { current: 2, max: 10, reset: 2, hasOverride: false },
      experience: { earned: 0, spent: 0 },
    });
    expect(isCharacter(character)).toBe(true);
    expect(isValidStats(character.stats)).toBe(true);
    expect(isValidStatusTracks(character.statusTracks)).toBe(true);
    expect(isValidMomentum(character.momentum)).toBe(true);
  });

  it('creates deterministic progress track and vow defaults', () => {
    const progress = createDefaultProgressTrack({
      id: 'progress-1',
      createdAt: timestamp,
      title: 'Project-original test progress',
      type: 'vow',
      rank: 'dangerous',
      characterId: 'character-1',
    });
    const vow = createDefaultVow({
      id: 'vow-1',
      createdAt: timestamp,
      title: 'Project-original test vow',
      rank: 'dangerous',
      progressTrackId: progress.id,
    });

    expect(progress.ticks).toBe(0);
    expect(progress.status).toBe('active');
    expect(isProgressTrack(progress)).toBe(true);
    expect(isValidProgressTicks(progress.ticks)).toBe(true);
    expect(vow).toMatchObject({
      id: 'vow-1',
      title: 'Project-original test vow',
      type: 'normal',
      status: 'active',
      progressTrackId: 'progress-1',
      milestones: [],
    });
  });

  it('creates deterministic journal entries and clamps numeric helpers', () => {
    const entry = createDefaultJournalEntry({
      id: 'journal-1',
      createdAt: timestamp,
      title: 'Project-original session note',
      links: { characterId: 'character-1' },
    });

    expect(entry).toMatchObject({
      id: 'journal-1',
      title: 'Project-original session note',
      type: 'session_note',
      body: '',
      links: { characterId: 'character-1' },
      tags: [],
    });
    expect(clampProgressTicks(99)).toBe(40);
    expect(clampMomentum({ current: 99, max: 10, reset: 2, hasOverride: true }).current).toBe(10);
  });
});
