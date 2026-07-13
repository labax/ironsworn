import type { ContentProvenance } from '../content';
import type { RollHistoryEntry, RollOutcome, RollSource, RollType } from './roll-history-entry';

export type RollHistoryMigrationResult =
  | {
      readonly ok: true;
      readonly entries: readonly RollHistoryEntry[];
      readonly discardedCount: number;
    }
  | { readonly ok: false };

const rollTypes = new Set<RollType>(['action', 'progress', 'oracle']);
const outcomes = new Set<RollOutcome>([
  'strong_hit',
  'weak_hit',
  'miss',
  'oracle_result',
  'yes',
  'no',
]);
const sources = new Set<RollSource>(['generated', 'manual']);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isIsoish = (value: unknown): value is string =>
  isString(value) && !Number.isNaN(Date.parse(value));
const optionalString = (value: unknown): string | undefined =>
  isString(value) ? value : undefined;
const dicePair = (value: unknown): readonly [number, number] | null =>
  Array.isArray(value) && value.length === 2 && isNumber(value[0]) && isNumber(value[1])
    ? ([value[0], value[1]] as const)
    : null;

const provenance = (value: unknown): ContentProvenance | null => {
  if (!isObject(value) || !isString(value['category']) || !isString(value['title'])) return null;
  return { ...(value as unknown as ContentProvenance) };
};

const cloneCommon = (raw: Record<string, unknown>, index: number) => {
  const id = optionalString(raw['id']) ?? `migrated-roll-history-${index + 1}`;
  const createdAt = isIsoish(raw['createdAt']) ? raw['createdAt'] : new Date(0).toISOString();
  const updatedAt = isIsoish(raw['updatedAt']) ? raw['updatedAt'] : createdAt;
  const type = raw['type'];
  const outcome = raw['outcome'];
  if (!rollTypes.has(type as RollType) || !outcomes.has(outcome as RollOutcome)) return null;
  return {
    id,
    createdAt,
    updatedAt,
    schemaVersion: isNumber(raw['schemaVersion']) ? raw['schemaVersion'] : 1,
    recordStatus: optionalString(raw['recordStatus']) ?? 'active',
    type: type as RollType,
    source: sources.has(raw['source'] as RollSource) ? (raw['source'] as RollSource) : 'generated',
    characterId: optionalString(raw['characterId']),
    moveId: optionalString(raw['moveId']),
    progressTrackId: optionalString(raw['progressTrackId']),
    oracleTableId: optionalString(raw['oracleTableId']),
    oracleEntryId: optionalString(raw['oracleEntryId']),
    outcome: outcome as RollOutcome,
    label: optionalString(raw['label']),
    isMatch: typeof raw['isMatch'] === 'boolean' ? raw['isMatch'] : false,
    notes: optionalString(raw['notes']),
  };
};

const migrateEntry = (value: unknown, index: number): RollHistoryEntry | null => {
  if (!isObject(value)) return null;
  const common = cloneCommon(value, index);
  if (!common) return null;

  const entry = { ...common } as Record<string, unknown>;
  if (common.type === 'action') {
    const roll = isObject(value['actionRoll']) ? value['actionRoll'] : value;
    const challengeDice = dicePair(roll['challengeDice']);
    if (!isNumber(roll['actionDie']) || !challengeDice) return null;
    entry['actionRoll'] = {
      actionDie: roll['actionDie'],
      challengeDice,
      statBonus: isNumber(roll['statBonus']) ? roll['statBonus'] : undefined,
      adds: isNumber(roll['adds']) ? roll['adds'] : undefined,
      actionScore: isNumber(roll['actionScore']) ? roll['actionScore'] : undefined,
    };
    const burn = value['momentumBurn'];
    if (isObject(burn)) {
      const canceledDice = Array.isArray(burn['canceledDice'])
        ? burn['canceledDice']
            .filter(isObject)
            .flatMap((die) =>
              (die['position'] === 0 || die['position'] === 1) && isNumber(die['value'])
                ? [{ position: die['position'], value: die['value'] }]
                : [],
            )
        : [];
      if (
        typeof burn['applied'] === 'boolean' &&
        isNumber(burn['momentumUsed']) &&
        isNumber(burn['resetValue']) &&
        outcomes.has(burn['initialOutcome'] as RollOutcome) &&
        outcomes.has(burn['finalOutcome'] as RollOutcome) &&
        typeof burn['originalMatch'] === 'boolean'
      ) {
        entry['momentumBurn'] = {
          applied: burn['applied'],
          canceledDice,
          momentumUsed: burn['momentumUsed'],
          resetValue: burn['resetValue'],
          initialOutcome: burn['initialOutcome'] as 'strong_hit' | 'weak_hit' | 'miss',
          finalOutcome: burn['finalOutcome'] as 'strong_hit' | 'weak_hit' | 'miss',
          originalMatch: burn['originalMatch'],
        };
      }
    }
  } else if (common.type === 'progress') {
    const roll = isObject(value['progressRoll']) ? value['progressRoll'] : value;
    const challengeDice = dicePair(roll['challengeDice']);
    if (!isNumber(roll['progressScore']) || !challengeDice || !isString(roll['trackId']))
      return null;
    entry['progressRoll'] = {
      progressScore: roll['progressScore'],
      challengeDice,
      trackId: roll['trackId'],
      trackType: optionalString(roll['trackType']) ?? 'unknown',
      trackTitle: optionalString(roll['trackTitle']) ?? 'Unknown progress track',
      resolvedAt: isIsoish(roll['resolvedAt']) ? roll['resolvedAt'] : common.createdAt,
      vowId: optionalString(roll['vowId']),
      vowTitle: optionalString(roll['vowTitle']),
    };
  } else {
    const roll = isObject(value['oracleRoll']) ? value['oracleRoll'] : value;
    const entryRange = isObject(roll['entryRange']) ? roll['entryRange'] : null;
    const rollProvenance = provenance(roll['provenance']);
    const tableProvenance = provenance(roll['tableProvenance']);
    if (
      !isNumber(roll['roll']) ||
      !isString(roll['tableId']) ||
      !isString(roll['entryId']) ||
      !entryRange ||
      !isNumber(entryRange['min']) ||
      !isNumber(entryRange['max']) ||
      !rollProvenance ||
      !tableProvenance
    )
      return null;
    entry['oracleRoll'] = {
      roll: roll['roll'],
      tableId: roll['tableId'],
      tableName: optionalString(roll['tableName']) ?? 'Unknown oracle table',
      tableKind: optionalString(roll['tableKind']) ?? 'table',
      entryId: roll['entryId'],
      entryRange: { min: entryRange['min'], max: entryRange['max'] },
      resultText: optionalString(roll['resultText']),
      resultTextRef: optionalString(roll['resultTextRef']),
      resolvedAt: isIsoish(roll['resolvedAt']) ? roll['resolvedAt'] : common.createdAt,
      questionContext: optionalString(roll['questionContext']),
      provenance: rollProvenance,
      tableProvenance,
    };
  }
  return entry as unknown as RollHistoryEntry;
};

export const migrateRollHistoryEntries = (payload: unknown): RollHistoryMigrationResult => {
  const source = Array.isArray(payload)
    ? payload
    : isObject(payload) && Array.isArray(payload['entries'])
      ? payload['entries']
      : null;
  if (!source) return { ok: false };

  const seen = new Set<string>();
  let discardedCount = 0;
  const entries: RollHistoryEntry[] = [];
  source.forEach((candidate, index) => {
    const migrated = migrateEntry(candidate, index);
    if (!migrated || seen.has(migrated.id)) {
      discardedCount += 1;
      return;
    }
    seen.add(migrated.id);
    entries.push(migrated);
  });
  return { ok: true, entries, discardedCount };
};
