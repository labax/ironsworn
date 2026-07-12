import { Injectable, Optional } from '@angular/core';

import {
  BUNDLED_ORACLE_TABLES,
  filterReleaseEligibleOracleTables,
  findOracleTableById,
  groupOracleTablesByCategory,
  type BrowsableOracleTable,
  type OracleCategoryGroup,
} from '@domain/oracles';
import { CampaignWorkspaceService } from '@domain/services/campaign-workspace.service';
import type { EntityId } from '@domain/shared';

export interface OracleBrowserSnapshot {
  readonly tables: readonly BrowsableOracleTable[];
  readonly groups: readonly OracleCategoryGroup[];
}

@Injectable({ providedIn: 'root' })
export class OracleBrowserService {
  constructor(@Optional() private readonly workspace?: CampaignWorkspaceService) {}

  async loadApprovedTables(): Promise<OracleBrowserSnapshot> {
    return this.loadTables();
  }

  async loadTables(): Promise<OracleBrowserSnapshot> {
    const bundled = filterReleaseEligibleOracleTables(BUNDLED_ORACLE_TABLES);
    const custom = (this.workspace?.customOracleTables() ?? []).map(
      (table): BrowsableOracleTable => ({ ...table }),
    );
    const tables = [...bundled, ...custom];
    return { tables, groups: groupOracleTablesByCategory(tables) };
  }

  findApprovedTable(id: EntityId): BrowsableOracleTable | undefined {
    return this.findTable(id);
  }

  findTable(id: EntityId): BrowsableOracleTable | undefined {
    return (
      findOracleTableById(BUNDLED_ORACLE_TABLES, id) ??
      this.workspace?.customOracleTables().find((table) => table.id === id)
    );
  }
}
