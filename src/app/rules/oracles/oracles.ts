import type { ContentProvenance } from '@domain/content';
import type { OracleOdds, OracleResultRange, OracleTableKind } from '@domain/oracles';
import type { OracleRollDice } from '@domain/rolls';
import type { EntityId } from '@domain/shared';
import { rollDie, type RandomNumberProvider } from '../dice';
import { rulesFailure, rulesSuccess, type RulesResult, type ValidationError } from '../validation';

export interface OracleRollInput {
  readonly roll?: number;
  readonly odds?: OracleOdds;
  readonly ranges?: readonly OracleResultRange[];
}

export interface OracleRollResult extends OracleRollDice {
  readonly odds?: OracleOdds;
  readonly matchedRange?: OracleResultRange;
  readonly trace: readonly string[];
}

export interface OracleDieRange {
  readonly min: number;
  readonly max: number;
}

export interface OracleTableEntry {
  readonly id: EntityId;
  readonly range: OracleResultRange;
  readonly text?: string;
  readonly textRef?: EntityId;
  readonly provenance?: ContentProvenance;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface ResolvableOracleTable {
  readonly id: EntityId;
  readonly name: string;
  readonly kind: OracleTableKind;
  readonly rollRange: OracleDieRange;
  readonly entries: readonly OracleTableEntry[];
  readonly provenance: ContentProvenance;
  readonly sourceType?: ContentProvenance['category'];
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface ResolveOracleTableInput {
  readonly table: ResolvableOracleTable;
  readonly fixedRoll?: number;
  readonly randomProvider?: RandomNumberProvider;
  readonly now?: () => Date;
}

export interface ResolvedOracleTableResult {
  readonly id: EntityId;
  readonly tableId: EntityId;
  readonly tableName: string;
  readonly tableKind: OracleTableKind;
  readonly roll: number;
  readonly rollRange: OracleDieRange;
  readonly entryId: EntityId;
  readonly entryRange: OracleResultRange;
  readonly text?: string;
  readonly textRef?: EntityId;
  readonly provenance: ContentProvenance;
  readonly tableProvenance: ContentProvenance;
  readonly timestamp: string;
  readonly sourceType: ContentProvenance['category'];
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

const oracleError = (code: string, message: string, field?: string): ValidationError => ({
  code,
  message,
  field,
});

const hasSafeText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const validateRollRange = (range: OracleDieRange): readonly ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!Number.isInteger(range.min))
    errors.push(
      oracleError(
        'invalid_bounds',
        'Oracle roll minimum must be an integer.',
        'table.rollRange.min',
      ),
    );
  if (!Number.isInteger(range.max))
    errors.push(
      oracleError(
        'invalid_bounds',
        'Oracle roll maximum must be an integer.',
        'table.rollRange.max',
      ),
    );
  if (Number.isInteger(range.min) && Number.isInteger(range.max) && range.min > range.max)
    errors.push(
      oracleError(
        'impossible_range',
        'Oracle roll range minimum cannot exceed maximum.',
        'table.rollRange',
      ),
    );
  return errors;
};

const validateEntry = (entry: OracleTableEntry, index: number): readonly ValidationError[] => {
  const field = `table.entries.${index}`;
  const errors: ValidationError[] = [];
  if (!hasSafeText(entry.id))
    errors.push(
      oracleError('malformed_entry', 'Oracle entry must have a stable id.', `${field}.id`),
    );
  if (!Number.isInteger(entry.range?.min) || !Number.isInteger(entry.range?.max))
    errors.push(
      oracleError(
        'malformed_entry',
        'Oracle entry range bounds must be integers.',
        `${field}.range`,
      ),
    );
  else if (entry.range.min > entry.range.max)
    errors.push(
      oracleError(
        'impossible_range',
        'Oracle entry range minimum cannot exceed maximum.',
        `${field}.range`,
      ),
    );
  if (!hasSafeText(entry.text) && !hasSafeText(entry.textRef))
    errors.push(
      oracleError(
        'malformed_entry',
        'Oracle entry must provide text or a stable text reference.',
        field,
      ),
    );
  return errors;
};

export const validateOracleTableShape = (
  table: ResolvableOracleTable,
): readonly ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!hasSafeText(table.id))
    errors.push(oracleError('malformed_table', 'Oracle table must have a stable id.', 'table.id'));
  if (!hasSafeText(table.name))
    errors.push(oracleError('malformed_table', 'Oracle table must have a name.', 'table.name'));
  if (!table.provenance)
    errors.push(
      oracleError('missing_provenance', 'Oracle table provenance is required.', 'table.provenance'),
    );
  errors.push(...validateRollRange(table.rollRange));
  if (!Array.isArray(table.entries) || table.entries.length === 0)
    errors.push(
      oracleError('empty_table', 'Oracle table must contain at least one entry.', 'table.entries'),
    );
  else table.entries.forEach((entry, index) => errors.push(...validateEntry(entry, index)));
  return errors;
};

export const validateOracleTableCoverage = (
  table: ResolvableOracleTable,
): readonly ValidationError[] => {
  const errors: ValidationError[] = [];
  table.entries.forEach((entry, index) => {
    const previous = table.entries[index - 1];
    if (
      previous &&
      (entry.range.min < previous.range.min || entry.range.max < previous.range.max)
    ) {
      errors.push(
        oracleError(
          'invalid_order',
          'Oracle entry ranges must stay in ascending order.',
          `table.entries.${index}.range`,
        ),
      );
    }
  });
  const ranges = table.entries
    .map((entry) => entry.range)
    .sort((a, b) => a.min - b.min || a.max - b.max);
  let expected = table.rollRange.min;
  for (const range of ranges) {
    if (range.min < table.rollRange.min || range.max > table.rollRange.max)
      errors.push(
        oracleError(
          'invalid_bounds',
          'Oracle entry range must stay within the table roll range.',
          'table.entries',
        ),
      );
    if (range.min > expected)
      errors.push(
        oracleError(
          'gap',
          'Oracle table ranges must cover every roll in the declared range.',
          'table.entries',
        ),
      );
    if (range.min < expected)
      errors.push(oracleError('overlap', 'Oracle table ranges must not overlap.', 'table.entries'));
    expected = Math.max(expected, range.max + 1);
  }
  if (expected <= table.rollRange.max)
    errors.push(
      oracleError(
        'gap',
        'Oracle table ranges must cover every roll in the declared range.',
        'table.entries',
      ),
    );
  return errors;
};

export const findOracleRange = (
  roll: number,
  ranges: readonly OracleResultRange[] = [],
): OracleResultRange | undefined => ranges.find((range) => roll >= range.min && roll <= range.max);

export const resolveOracleRoll = (input: OracleRollInput = {}): RulesResult<OracleRollResult> => {
  const roll = input.roll ?? rollDie(100);
  if (!Number.isInteger(roll) || roll < 1 || roll > 100) {
    return rulesFailure([
      oracleError(
        'out_of_range',
        `oracleRoll must be an integer from 1 to 100; received ${roll}.`,
        'oracleRoll',
      ),
    ]);
  }

  return rulesSuccess({
    roll,
    odds: input.odds,
    matchedRange: findOracleRange(roll, input.ranges),
    trace: ['d100 oracle roll resolved without bundled table text'],
  });
};

export const rollInOracleRange = (range: OracleDieRange, provider?: RandomNumberProvider): number =>
  range.min + rollDie(range.max - range.min + 1, provider) - 1;

export const resolveOracleTableRoll = (
  input: ResolveOracleTableInput,
): RulesResult<ResolvedOracleTableResult> => {
  const tableErrors = validateOracleTableShape(input.table);
  if (tableErrors.length > 0) return rulesFailure(tableErrors);

  const errors = [...validateOracleTableCoverage(input.table)];

  const roll = input.fixedRoll ?? rollInOracleRange(input.table.rollRange, input.randomProvider);
  if (
    !Number.isInteger(roll) ||
    roll < input.table.rollRange.min ||
    roll > input.table.rollRange.max
  ) {
    errors.push(
      oracleError(
        'out_of_range_fixed_roll',
        'Fixed oracle roll is outside the table roll range.',
        'fixedRoll',
      ),
    );
  }

  const matches = input.table.entries.filter(
    (entry) => roll >= entry.range.min && roll <= entry.range.max,
  );
  if (matches.length === 0) {
    errors.push(oracleError('gap', 'No oracle entry matched the rolled value.', 'table.entries'));
  }
  if (matches.length > 1) {
    errors.push(
      oracleError(
        'ambiguous_match',
        'More than one oracle entry matched the rolled value.',
        'table.entries',
      ),
    );
  }
  if (errors.length > 0) return rulesFailure(errors);

  const entry = matches[0]!;
  return rulesSuccess({
    id: `${input.table.id}:${roll}:${entry.id}`,
    tableId: input.table.id,
    tableName: input.table.name,
    tableKind: input.table.kind,
    roll,
    rollRange: { ...input.table.rollRange },
    entryId: entry.id,
    entryRange: { ...entry.range },
    text: entry.text,
    textRef: entry.textRef,
    provenance: entry.provenance ?? input.table.provenance,
    tableProvenance: input.table.provenance,
    timestamp: (input.now ?? (() => new Date()))().toISOString(),
    sourceType: input.table.sourceType ?? input.table.provenance.category,
    metadata: input.table.metadata,
  });
};
