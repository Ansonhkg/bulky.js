import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { SessionSigsMap } from '@lit-protocol/types';

export const FN = {
  // connections
  'connectToLitNodeClient': 'connectToLitNodeClient',
  'connectToLitContracts': 'connectToLitContracts',

  // setters
  'mintPKP': 'mintPKP',
  'mintCreditsToken': 'mintCreditsToken',
  'grantAuthMethodToUsePKP': 'grantAuthMethodToUsePKP',

  // getters
  'getPkps': 'getPkps',
  'getLoginToken': 'getLoginToken',
  'grantIPFSCIDtoUsePKP': 'grantIPFSCIDtoUsePKP',
  'executeJs': 'executeJs'
} as const;

export const STEP = {
  // connections
  [FN.connectToLitContracts]: `${FN.connectToLitContracts} (to connect to Lit Contracts)`,

  // setters
  [FN.mintPKP]: `${FN.mintPKP} - (to mint a PKP)`,
  [FN.mintCreditsToken]: `${FN.mintCreditsToken} - (to mint a Credits Token to pay for usage of the Lit Network)`,

  // granting PKP permissions to do something
  [FN.grantAuthMethodToUsePKP]: `${FN.grantAuthMethodToUsePKP} - (to grant an auth method to use the PKP)`,
  [FN.grantIPFSCIDtoUsePKP]: `${FN.grantIPFSCIDtoUsePKP} - (to grant an IPFS CID to use the PKP)`,

  // getters
  [FN.getPkps]: `${FN.getPkps} - (to get all PKPs)`,
  [FN.getLoginToken]: `${FN.getLoginToken} - (to get a login token. Previously known as 'SessionSigs')`,

  // actions
  [FN.executeJs]: `${FN.executeJs} - (to execute a JS code in the Lit Nodes withint a trusted execution environment (TEE) )`
} as const;

export const UNAVAILABLE_STEP = {
  'mint-pkp-tip-1': 'You can fund the PKP if you want so that you can use it later to send transactions.'
} as const;

export type STEP_VALUES = (((typeof STEP)[keyof typeof STEP]) | ((typeof UNAVAILABLE_STEP)[keyof typeof UNAVAILABLE_STEP]))[];

export type BulkieSupportedFunctions = keyof typeof FN;

export type FunctionReturnTypes = {
  [FN.connectToLitNodeClient]: LitNodeClient;
  [FN.connectToLitContracts]: LitContracts;
  [FN.mintPKP]: {
    tokenId: PKPTokenId;
    publicKey: string;
    ethAddress: HexAddress;
    tx: TX;
  };
  [FN.mintCreditsToken]: {
    capacityTokenId: string;
  },
  [FN.getPkps]: {
    tokenId: PKPTokenId,
    publicKey: string;
    ethAddress: HexAddress;
  },
  [FN.grantAuthMethodToUsePKP]: {
    tx: TX;
  },
  [FN.getLoginToken]: SessionSigsMap,
  [FN.grantIPFSCIDtoUsePKP]: {
    tx: TX;
  },
  [FN.executeJs]: null,
}

interface TX {
  hash: string;
  explorer: `https://${string}/tx/${string}`;
}

export type HexAddress = `0x${string}`;
interface PKPTokenId {
  hex: HexAddress;
  decimal: string;
}

export type IPFSCIDv0 = `Qm${string}`;

export type AuthMethodScopes = ('no_permission' | 'sign_anything' | 'eip_191_personal_sign')[];


