import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitContracts } from '@lit-protocol/contracts-sdk';

export const FN = {
  'connectToLitNodeClient': 'connectToLitNodeClient',
  'connectToLitContracts': 'connectToLitContracts',
  'getLitNodeClient': 'getLitNodeClient',
  'getLitContracts': 'getLitContracts',
  'mintPKP': 'mintPKP',
  'getPkps': 'getPkps',
  'fundPKP': 'fundPKP',
} as const;

export type BulkieSupportedFunctions = keyof typeof FN;

export type FunctionReturnTypes = {
  [FN.connectToLitNodeClient]: LitNodeClient;
  [FN.connectToLitContracts]: LitContracts;
  [FN.getLitNodeClient]: LitNodeClient;
  [FN.getLitContracts]: LitContracts;
  [FN.mintPKP]: {
    tokenId: {
      hex: `0x${string}`;
      decimal: string;
    };
    publicKey: string;
    ethAddress: `0x${string}`;
    tx: {
      hash: string;
      explorer: `https://${string}/tx/${string}`;
    };
  };
  [FN.getPkps]: {
    tokenId: {
      hex: `0x${string}`;
      decimal: string;
    },
    publicKey: string;
    ethAddress: `0x${string}`;
  }
}