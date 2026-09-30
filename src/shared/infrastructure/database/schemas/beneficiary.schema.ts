import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const beneficiaryStatus = pgEnum(
  'beneficiary_status', [
  "ACTIVE",
  "REMOVE"
]
)

export const beneficiaries = pgTable('beneficiaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountNumber: varchar('acount_number', { length: 20 }).notNull().unique(),
  nickName: varchar('nick_name').notNull(),
  status: beneficiaryStatus('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
},
  (table) => ({
    ownnerIdIdx: index('owner_user_id_idx').on(table.ownerUserId),
    accountNumberIdx: index('account_number_idx').on(table.accountNumber)
  }),
)

export type BeneficiaryDB = typeof beneficiaries.$inferSelect;
export type NewBeneficiaryDB = typeof beneficiaries.$inferInsert;
