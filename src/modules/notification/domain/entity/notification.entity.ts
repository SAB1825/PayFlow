import { AggregateRoot } from "@nestjs/cqrs";
import { UserId } from "../../../identity/domain/value-object/user-id.vo";
import { NotificationId } from "../value-object/notification-id.vo";

export enum NotificationType {
  TransferReceived = 'TRANSFER_RECEIVED',
  TransferSent = 'TRANSFER_SENT',
  TransferFailed = 'TRANSFER_FAILED',
}

interface NotificationProps {
  id: NotificationId;
  userId: UserId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export class Notification extends AggregateRoot {
  private _id: NotificationId;
  private _userId: UserId;
  private _type: NotificationType;
  private _title: string;
  private _message: string;
  private _isRead: boolean;
  private _createdAt: Date;

  constructor(props: NotificationProps) {
    super();
    this._id = props.id;
    this._userId = props.userId;
    this._type = props.type;
    this._title = props.title;
    this._message = props.message;
    this._isRead = props.isRead;
    this._createdAt = props.createdAt;
  }

  static create(userId: UserId, type: NotificationType, title: string, message: string): Notification {
    return new Notification({
      id: NotificationId.create(),
      userId,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date(),
    });
  }

  markRead(): void {
    this._isRead = true;
  }

  get id() { return this._id; }
  get userId() { return this._userId; }
  get type() { return this._type; }
  get title() { return this._title; }
  get message() { return this._message; }
  get isRead() { return this._isRead; }
  get createdAt() { return this._createdAt; }
}
