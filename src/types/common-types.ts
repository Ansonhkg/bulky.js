import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { AuthSig, SessionSigsMap } from '@lit-protocol/types';
import { PKG, PKG_VALUES, PkgReturnTypes, PkgSteps } from '../plugins/plugins';
import { ObjectMapFromArray } from './utils';

// ----- BULKIE FUNCTIONS
export const NATIVE_FN_VALUES = [
  'connectToLitNodeClient',
  'connectToLitContracts',
  'mintPKP',
  'mintCreditsNFT',
  'createCreditsDelegationToken',
  'createAccessToken',
  'grantAuthMethodToUsePKP',
  'grantIPFSCIDtoUsePKP',
  'getPkps',
  'toExecuteJs',
  'toPkpSign',
] as const;

export const NATIVE_FNS = ObjectMapFromArray(NATIVE_FN_VALUES);

// ----- FUNCTIONS
export const FN = ObjectMapFromArray([
  ...NATIVE_FN_VALUES,
  ...PKG_VALUES,
]);

// ----- DEPENDENCIES MAP
export type DependenciesMap = Record<keyof typeof FN, (keyof typeof FN)[]>;

export const DEPENDENCIES_MAP: DependenciesMap = {
  ['connectToLitNodeClient']: [],
  ['connectToLitContracts']: ['connectToLitNodeClient'],
  ['mintPKP']: ['connectToLitContracts'],
  ['mintCreditsNFT']: ['connectToLitContracts'],
  ['createCreditsDelegationToken']: ['connectToLitNodeClient', 'mintCreditsNFT'],
  ['createAccessToken']: ['connectToLitNodeClient'],
  ['grantAuthMethodToUsePKP']: ['connectToLitNodeClient'],
  ['grantIPFSCIDtoUsePKP']: ['connectToLitNodeClient'],
  ['getPkps']: ['connectToLitNodeClient'],
  ['toExecuteJs']: ['connectToLitNodeClient'],
  ['toPkpSign']: ['connectToLitNodeClient'],
  ['wrapped-keys/generate-private-key']: ['connectToLitNodeClient'],
  ['orbisdb/key-management/read']: ['connectToLitNodeClient'],
  ['orbisdb/key-management/register']: ['connectToLitNodeClient'],
  ['orbisdb/key-management/use']: ['connectToLitNodeClient'],
} as const;

export const STEP = {
  // connections
  [FN.connectToLitContracts]: `${FN.connectToLitContracts} (to connect to Lit Contracts)`,

  // miting
  [FN.mintPKP]: `${FN.mintPKP} - (to mint a PKP)`,
  [FN.mintCreditsNFT]: `${FN.mintCreditsNFT} - (to mint a Credits Token to pay for usage of the Lit Network)`,

  // granting PKP permissions to do something
  [FN.grantAuthMethodToUsePKP]: `${FN.grantAuthMethodToUsePKP} - (to grant an auth method to use the PKP)`,
  [FN.grantIPFSCIDtoUsePKP]: `${FN.grantIPFSCIDtoUsePKP} - (to grant an IPFS CID to use the PKP)`,

  // creating tokens
  [FN.createAccessToken]: `${FN.createAccessToken} - (You can use this token to access to Lit Network. Note that you will also need credits to use the Network)`,
  [FN.createCreditsDelegationToken]: `${FN.createCreditsDelegationToken} - (to create a Credits Delegation Token so that your users can use the credits token you minted subject to the addresses you specify)`,

  // getters
  [FN.getPkps]: `${FN.getPkps} - (to get all PKPs)`,

  // actions
  [FN.toExecuteJs]: `${FN.toExecuteJs} - (to execute a JS code in the Lit Nodes withint a trusted execution environment (TEE) )`,
  [FN.toPkpSign]: `${FN.toPkpSign} - (to sign a message with the PKP)`,
  ...PkgSteps,
} as const;

export const UNAVAILABLE_STEP = {
  'mint-pkp-tip-1': 'You can fund the PKP if you want so that you can use it later to send transactions.'
} as const;

export type STEP_VALUES = (((typeof STEP)[keyof typeof STEP]) | ((typeof UNAVAILABLE_STEP)[keyof typeof UNAVAILABLE_STEP]))[];

export type BulkieSupportedFunctions = keyof typeof FN | `Qm${string}`;

export type FunctionReturnTypes = {
  [FN.connectToLitNodeClient]: LitNodeClient;
  [FN.connectToLitContracts]: LitContracts;
  [FN.mintPKP]: {
    tokenId: PKPTokenId;
    publicKey: HexAddress;
    ethAddress: HexAddress;
    tx: TX;
  };
  [FN.mintCreditsNFT]: string,
  [FN.getPkps]: {
    tokenId: PKPTokenId,
    publicKey: string;
    ethAddress: HexAddress;
  }[],
  [FN.grantAuthMethodToUsePKP]: {
    tx: TX;
  },
  [FN.grantIPFSCIDtoUsePKP]: {
    tx: TX;
  },

  // Tokens creation
  [FN.createCreditsDelegationToken]: AuthSig,
  [FN.createAccessToken]: SessionSigsMap,

  // Actions
  [FN.toExecuteJs]: null,
  [FN.toPkpSign]: {
    signature: string;
  },
  [key: `Qm${string}`]: any;
} & PkgReturnTypes

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

export type OutputHandler = {
  outputId?: string;
}

export type BrowserCache = {
  cache?: boolean;
}