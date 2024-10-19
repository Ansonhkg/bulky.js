export const REPO = {
  'wrapped-keys/generate-private-key': 'wrapped-keys/generate-private-key',
} as const;

export type REPO_TYPES = keyof typeof REPO | `Qm${string}`;

export type REPO_VALUES = (typeof REPO)[keyof typeof REPO];

export interface RepoParams {
  // Custom IPFS CID
  [key: string]: any;

  // Repos
  'wrapped-keys/generate-private-key': {
    chain: 'evm' | 'solana';
    memo: string;
  },
  // Add other repo types here...
}
