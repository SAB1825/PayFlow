import { uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { users } from './user.schema';
import { accounts } from './account.schema';
import { bigint } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { varchar } from 'drizzle-orm/pg-core';

export const transferStatusEnum = pgEnum('transfer_status', [
  'PENDING',
  'SUCCESS',
  'FAILED',
]);

export const transfers = pgTable('transfers', {
  id: uuid('id').defaultRandom().primaryKey(),
  initiatedBy: uuid('initiated_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  fromAccId: uuid('from_acc_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'restrict' }),
  toAccId: uuid('to_acc_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'restrict' }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('INR'),
  status: transferStatusEnum('status').notNull().default('PENDING'),
  failureReason: varchar('failure_reason', { length: 500 }),
  idempotencyKey: varchar('idempotency_key', { length: 100 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TransferDB = typeof transfers.$inferSelect;
export type NewTransferDB = typeof transfers.$inferInsert;
