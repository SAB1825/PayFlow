import { relations } from 'drizzle-orm';
import { users } from './user.schema';
import { accounts } from './account.schema';
import { refreshTokens } from './refresh-token.schema';

export const userRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  refreshTokens: many(refreshTokens),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const refreshTokenRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));
