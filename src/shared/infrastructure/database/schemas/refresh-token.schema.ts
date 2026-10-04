import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  familyId: uuid('family_id').notNull(), // same across a session's whole rotation chain
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(), // sha256 hex = 64 chars
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
},
  (table) => ({
    familyIdIdx: index('refresh_tokens_family_id_idx').on(table.familyId),
  }),
);

export type RefreshTokenDB = typeof refreshTokens.$inferSelect;
export type NewRefreshTokenDB = typeof refreshTokens.$inferInsert;
