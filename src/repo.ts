/**
 * To add a new pkg, add it to the PKG object and create a param object 
 */

import { HexAddress } from "./types";

export const PKG = {
  'wrapped-keys/generate-private-key': 'wrapped-keys/generate-private-key',
} as const;

export type PKG_TYPES = keyof typeof PKG | `Qm${string}`;

export type PKG_VALUES = (typeof PKG)[keyof typeof PKG];

export interface PkgParams {
  // Custom IPFS CID
  [key: string]: any;

  // Repos
  'wrapped-keys/generate-private-key': {
    chain: 'evm' | 'solana';
    memo: string;
  },
  // Add other repo types here...
}

export type PkgReturnTypes = {
  ['wrapped-keys/generate-private-key']: {
    pkpAddress: HexAddress;
    generatedPublicKey: string;
    id: string;
  }
}

export const PkgFns = {
  'wrapped-keys/generate-private-key': 'wrapped-keys/generate-private-key',
}

export const PkgSteps = {
  [PkgFns['wrapped-keys/generate-private-key']]: `${PkgFns['wrapped-keys/generate-private-key']} - (to generate a private key for a given chain)`,
}