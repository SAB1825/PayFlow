
import {
  pgTable,
  pgEnum,
  uuid,
  boolean,
  varchar,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const notificationTypeEnum = pgEnum('notification_type', [
  'TRANSFER_RECEIVED', 'TRANSFER_SENT', 'TRANSFER_FAILED',
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: varchar('message', { length: 500 }).notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
}));


export type NotificationDB = typeof notifications.$inferSelect;
