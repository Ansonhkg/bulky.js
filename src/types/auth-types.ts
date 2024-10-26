import { AuthSig } from '@lit-protocol/types';
import { z } from 'zod';
import { IPFSCIDv0 } from './common-types';

/**
 * @example
 * const obj = ['a', 'b', 'c']
 * ObjectMapFromArray(obj) // { a: 'a', b: 'b', c: 'c' }
 */
export const ObjectMapFromArray = <T extends readonly string[]>(arr: T) => {
  return arr.reduce(
    (acc, scope) => ({ ...acc, [scope]: scope }),
    {} as { [K in T[number]]: K }
  );
};

// ----- AUTH METHOD SCOPES
export const AUTH_METHOD_SCOPES_VALUES = [
  'no_permission',
  'sign_anything',
  'eip_191_personal_sign'
] as const;

export const AUTH_METHOD_SCOPES = ObjectMapFromArray(AUTH_METHOD_SCOPES_VALUES);
export const AUTH_METHOD_SCOPES_SCHEMA = z.enum(AUTH_METHOD_SCOPES_VALUES);
export type AuthMethodScopes = z.infer<typeof AUTH_METHOD_SCOPES_SCHEMA>;

// ----- AUTH RESOURCE TYPES
export const AUTH_RESOURCE_TYPES_VALUES = [
  'pkp-signing',
  'lit-action-execution',
  'rate-limit-increase-auth',
  'access-control-condition-signing',
  'access-control-condition-decryption',
] as const;

export const AUTH_RESOURCE_TYPES = ObjectMapFromArray(AUTH_RESOURCE_TYPES_VALUES);
export const AUTH_RESOURCE_TYPES_SCHEMA = z.enum(AUTH_RESOURCE_TYPES_VALUES);
export type AuthResourceTypes = z.infer<typeof AUTH_RESOURCE_TYPES_SCHEMA>;

// -----ACCESS TOKEN TYPES
export const ACCESS_TOKEN_TYPES_VALUES = [
  'custom_auth',
  'native_auth',
  'eoa'
] as const;

export const ACCESS_TOKEN_TYPES = ObjectMapFromArray(ACCESS_TOKEN_TYPES_VALUES);
export const ACCESS_TOKEN_TYPES_SCHEMA = z.enum(ACCESS_TOKEN_TYPES_VALUES);
export type AccessTokenTypes = z.infer<typeof ACCESS_TOKEN_TYPES_SCHEMA>;