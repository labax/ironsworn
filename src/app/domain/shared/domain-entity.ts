export type EntityId = string;
export type ISODateString = string;

export type RecordStatus = 'active' | 'archived' | 'deleted';

export interface Timestamped {
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

export interface Versioned {
  readonly schemaVersion: number;
}

export interface DomainEntity extends Timestamped, Versioned {
  readonly id: EntityId;
  readonly recordStatus: RecordStatus;
}

export interface EntityFactoryOptions {
  readonly id: EntityId;
  readonly createdAt: ISODateString;
  readonly updatedAt?: ISODateString;
}

export const CURRENT_DOMAIN_SCHEMA_VERSION = 1;

export const createDomainEntity = (options: EntityFactoryOptions): DomainEntity => ({
  id: options.id,
  createdAt: options.createdAt,
  updatedAt: options.updatedAt ?? options.createdAt,
  schemaVersion: CURRENT_DOMAIN_SCHEMA_VERSION,
  recordStatus: 'active',
});
