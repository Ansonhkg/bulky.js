import { HexAddress } from "../types";

export type PKG_TYPES = keyof typeof PKG | `Qm${string}`;
export type PKG_VALUES = (typeof PKG)[keyof typeof PKG];

/**
 * 1. Add a new entry to the PKG object
 */
export const PKG = {
  'wrapped-keys/generate-private-key': 'wrapped-keys/generate-private-key',
  'orbisdb/key-management/read': 'orbisdb/key-management/read',
} as const;

/**
 * 2. Add the expected params for the pkg
 */
export interface PkgParams {
  // use for custom IPFS CID
  [key: string]: any;

  // Repos
  'wrapped-keys/generate-private-key': {
    chain: 'evm' | 'solana';
    memo: string;
  },
  'orbisdb/key-management/read': {
    pkpPublicKey: HexAddress;
  },

  // Add other repo types here...
}

/**
 * 3. Add the expected return types for the pkg (this is then merged to the FunctionReturnTypes)
 */
export type PkgReturnTypes = {
  ['wrapped-keys/generate-private-key']: {
    pkpAddress: HexAddress;
    generatedPublicKey: string;
    id: string;
  },
  ['orbisdb/key-management/read']: {
    ciphertext: string;
    dataToEncryptHash: string;
    accs: any[];
    keyType: 'K256';
    address: HexAddress;
  }[],

}

/**
 * 4. (Optional) A description for the step. This is useful if you want to show this message
 * when other actions are run. 
 */
export const PkgSteps = {
  ['wrapped-keys/generate-private-key']: `${'wrapped-keys/generate-private-key'} - (to generate a private key for a given chain)`,
}
