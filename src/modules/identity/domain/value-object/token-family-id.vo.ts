import { UniqueId } from '../../../../shared/domain/unique-id.vo';

/**
 * Identifies a rotation chain (a "session"). Every refresh token issued from the
 * same login shares one family id, so reuse detection can revoke the whole chain.
 */
export class TokenFamilyId extends UniqueId { }