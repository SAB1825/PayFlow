import { TransferCompletedHandler } from "./transfer-notification.handler";
import { TransferFailedHandler } from "./transfer-failed-notification.handler";

export const EventHandlers = [
  TransferCompletedHandler,
  TransferFailedHandler,
];
