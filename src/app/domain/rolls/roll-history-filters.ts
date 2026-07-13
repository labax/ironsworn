import type { RollHistoryEntry, RollType } from './roll-history-entry';

export interface RollHistoryFilters {
  readonly query?: string;
  readonly types?: readonly RollType[];
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly sessionFrom?: string;
  readonly sessionTo?: string;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const DAY_END_SUFFIX = 'T23:59:59.999';

const searchableFields = (entry: RollHistoryEntry): readonly string[] => [
  entry.label ?? '',
  entry.notes ?? '',
  entry.progressRoll?.trackTitle ?? '',
  entry.progressRoll?.trackType ?? '',
  entry.progressRoll?.vowTitle ?? '',
  entry.oracleRoll?.questionContext ?? '',
  entry.oracleRoll?.tableName ?? '',
  entry.oracleRoll?.tableProvenance.title ?? '',
  entry.oracleRoll?.provenance.title ?? '',
];

const toDateBoundary = (value: string | undefined, endOfDay = false): number | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}${endOfDay ? DAY_END_SUFFIX : 'T00:00:00.000'}`
    : trimmed;
  const time = new Date(normalized).getTime();
  return Number.isNaN(time) ? undefined : time;
};

const entryTime = (entry: RollHistoryEntry): number => {
  const time = new Date(entry.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export const chronologicalRollHistory = (
  entries: readonly RollHistoryEntry[],
): readonly RollHistoryEntry[] =>
  entries.slice().sort((left, right) => {
    const byTime = entryTime(right) - entryTime(left);
    return byTime === 0 ? collator.compare(right.id, left.id) : byTime;
  });

export const filterRollHistory = (
  entries: readonly RollHistoryEntry[],
  filters: RollHistoryFilters,
): readonly RollHistoryEntry[] => {
  const query = filters.query?.trim().toLocaleLowerCase();
  const types = new Set(filters.types ?? []);
  const dateFrom = toDateBoundary(filters.dateFrom);
  const dateTo = toDateBoundary(filters.dateTo, true);

  return chronologicalRollHistory(entries).filter((entry) => {
    if (types.size > 0 && !types.has(entry.type)) return false;

    const time = entryTime(entry);
    if (dateFrom !== undefined && time < dateFrom) return false;
    if (dateTo !== undefined && time > dateTo) return false;

    if (query) {
      const haystack = searchableFields(entry).join(' ').toLocaleLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
};

export const hasActiveRollHistoryFilters = (filters: RollHistoryFilters): boolean =>
  Boolean(
    filters.query?.trim() ||
    filters.dateFrom?.trim() ||
    filters.dateTo?.trim() ||
    filters.sessionFrom?.trim() ||
    filters.sessionTo?.trim() ||
    (filters.types?.length ?? 0) > 0,
  );
