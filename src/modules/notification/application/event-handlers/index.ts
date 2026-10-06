import { TransferCompletedHandler } from "./transfer-notification.handler";
import { TransferFailedHandler } from "./transfer-failed-notification.handler";
import { PushNotificationHandler } from "./push-notification.handler";
import { PushNotificationReadHandler } from "./push-notification-read.handler";

export const EventHandlers = [
  TransferCompletedHandler,
  TransferFailedHandler,
  PushNotificationHandler,
  PushNotificationReadHandler,
];
