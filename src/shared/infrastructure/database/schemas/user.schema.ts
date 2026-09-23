import { pgTable, pgEnum, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('user_role', ['ADMIN', 'USER', 'SUPPORT']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('USER'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserDB = typeof users.$inferSelect;
export type NewUserDB = typeof users.$inferInsert;
