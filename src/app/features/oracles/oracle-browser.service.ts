import { Injectable } from '@angular/core';

import {
  BUNDLED_ORACLE_TABLES,
  filterReleaseEligibleOracleTables,
  findOracleTableById,
  groupOracleTablesByCategory,
  type BrowsableOracleTable,
  type OracleCategoryGroup,
} from '@domain/oracles';
import type { EntityId } from '@domain/shared';

export interface OracleBrowserSnapshot {
  readonly tables: readonly BrowsableOracleTable[];
  readonly groups: readonly OracleCategoryGroup[];
}

@Injectable({ providedIn: 'root' })
export class OracleBrowserService {
  async loadApprovedTables(): Promise<OracleBrowserSnapshot> {
    const tables = filterReleaseEligibleOracleTables(BUNDLED_ORACLE_TABLES);
    return { tables, groups: groupOracleTablesByCategory(tables) };
  }

  findApprovedTable(id: EntityId): BrowsableOracleTable | undefined {
    return findOracleTableById(BUNDLED_ORACLE_TABLES, id);
  }
}
