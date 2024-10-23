// The actual Lit Action code is in ./lit-actions/src/la-db.ts
// We need to compile it to a js file and import it here

import {
  KeyReadParams,
  KeyRegisterParams,
  KeyUpdateParams,
  KeyUseParams
} from "../lit-actions/src/la-db"
import { HexAddress } from "../types"
import { code } from '../lit-actions/dist/la-db';

export type KMPublicData = {
  ciphertext: string;
  dataToEncryptHash: string;
  keyType: 'K256';
  accs: any[];
  publicKey: `0x${string}`;
}

export function createKeyRegisterParams(pkpPublicKey: HexAddress): KeyRegisterParams {
  return {
    pkpPublicKey,
    operation: 'register',
  }
}

export function createKeyReadParams(pkpPublicKey: HexAddress): KeyReadParams {
  return {
    pkpPublicKey,
    operation: 'read',
  }
}

// @param address is the address of the encrypted private key
export function createKeyUseParams(
  pkpPublicKey: HexAddress,
  address: HexAddress
): KeyUseParams {
  return {
    pkpPublicKey,
    operation: 'use',
    address,
  }
}

export function createKeyUpdateParams(
  pkpPublicKey: HexAddress,
  streamId: string,
  data: string
): KeyUpdateParams {
  return {
    pkpPublicKey,
    operation: 'update',
    docId: streamId,
    data,
  }
}

export function getKeyManagementLitAction() {
  return code;
}