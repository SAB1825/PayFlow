import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-object/email.vo";
import { UserId } from "../../domain/value-object/user-id.vo";


export const USER_REPOSITORY = Symbol("USEUSER_REPOSITORY");

export interface UserRepositoryPort {
    register(user: User): Promise<void>;
    findById(userId: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
}