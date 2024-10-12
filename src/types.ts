import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitContracts } from '@lit-protocol/contracts-sdk';

export const FN = {
  'connectToLitNodeClient': 'connectToLitNodeClient',
  'connectToLitContracts': 'connectToLitContracts',
  'getLitNodeClient': 'getLitNodeClient',
  'getLitContracts': 'getLitContracts',
  'mintPKP': 'mintPKP',
  'getPkps': 'getPkps',
  'grantAuthMethodToUsePKP': 'grantAuthMethodToUsePKP',
} as const;

export const STEP = {
  [FN.grantAuthMethodToUsePKP]: `${FN.grantAuthMethodToUsePKP} - (to grant an auth method to use the PKP)`,
  [FN.mintPKP]: `${FN.mintPKP} - (to mint a PKP)`,
  [FN.getPkps]: `${FN.getPkps} - (to get all PKPs)`,
  [FN.connectToLitContracts]: `${FN.connectToLitContracts} (to connect to Lit Contracts)`
} as const;

export const UNAVAILABLE_STEP = {
  'grantIPFSCID': `grantIPFSCID - (Not available yet | to grant an IPFS CID to use the PKP)`,
  'mint-pkp-no-immediate-steps': 'No immediate next steps - You can fund the PKP if you want so that you can use it later to send transactions.'
} as const;

export type STEP_VALUES = (((typeof STEP)[keyof typeof STEP]) | ((typeof UNAVAILABLE_STEP)[keyof typeof UNAVAILABLE_STEP]))[];

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
  },
  [FN.grantAuthMethodToUsePKP]: {
    tx: {
      hash: string;
      explorer: `https://${string}/tx/${string}`;
    };
  }
}