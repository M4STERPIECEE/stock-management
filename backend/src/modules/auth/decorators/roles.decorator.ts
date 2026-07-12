import { SetMetadata } from '@nestjs/common';

/**
 * Available roles in the system.
 *
 * To add a new role:
 * 1. Add it to this enum
 * 2. Add a check in RolesGuard (or extend the logic)
 * 3. Assign roles in the user entity / database
 */
export enum Role {
  ADMIN = 'ADMIN',
  VENDEUR = 'VENDEUR',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
