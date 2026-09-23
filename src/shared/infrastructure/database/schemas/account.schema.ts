import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  bigint,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const accountTypeEnum = pgEnum('account_type', ['SAVINGS', 'CURRENT']);

export const accountStatusEnum = pgEnum('account_status', [
  'ACTIVE',
  'FROZEN',
  'CLOSED',
]);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    accountNumber: varchar('account_number', { length: 20 }).notNull().unique(),
    accountType: accountTypeEnum('account_type').notNull(),
    balance: bigint('balance', { mode: 'number' }).notNull().default(0),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    status: accountStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('accounts_user_id_idx').on(table.userId),
    statusIdx: index('accounts_status_idx').on(table.status),
  }),
);

export type AccountDB = typeof accounts.$inferSelect;
export type NewAccountDB = typeof accounts.$inferInsert;
