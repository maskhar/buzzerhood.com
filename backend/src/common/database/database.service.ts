import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Kysely, PostgresDialect, sql, type Transaction } from 'kysely';
import { Pool } from 'pg';
import { APP_CONFIGURATION } from '../config/configuration.module.js';
import type { AppConfiguration } from '../config/configuration.js';
import type { Database } from './database.types.js';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly db: Kysely<Database>;
  private readonly pool: Pool;

  constructor(@Inject(APP_CONFIGURATION) config: AppConfiguration) {
    this.pool = new Pool({
      connectionString: config.database.url,
      min: config.database.poolMin,
      max: config.database.poolMax,
      connectionTimeoutMillis: config.database.connectionTimeoutMs,
      query_timeout: config.database.queryTimeoutMs,
      application_name: 'buzzerhood_backend'
    });
    this.db = new Kysely<Database>({ dialect: new PostgresDialect({ pool: this.pool }) });
  }

  async ready(): Promise<void> { await sql`select 1`.execute(this.db); }

  async withUserContext<T>(userId: string, callback: (transaction: Transaction<Database>) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(async (transaction) => {
      await sql`select set_config('app.user_id', ${userId}, true)`.execute(transaction);
      return callback(transaction);
    });
  }

  async onApplicationShutdown(): Promise<void> { await this.db.destroy(); }
}
