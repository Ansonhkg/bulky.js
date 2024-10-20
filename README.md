# Bulkie SDK API Documentation

The Bulkie SDK provides a simplified interface for interacting with the Lit Protocol. It covers basic development flows for various use cases, such as those found in developer guides and hackathon code.

## API Doc

https://bulkiejs.vercel.app/

## Table of Contents

1. [Constructor](#constructor)
2. [Connection Methods](#connection-methods)
3. [Minting Methods](#minting-methods)
4. [Token Creation Methods](#token-creation-methods)
5. [Permission Granting Methods](#permission-granting-methods)
6. [Getter Methods](#getter-methods)
7. [Action Methods](#action-methods)
8. [Utility Methods](#utility-methods)
9. [API Overview](#api-overview)

## API Overview

| Method Name | Description | Parameters | Return Type |
| ----------- | ----------- | ---------- | ----------- |
| `new Bulkie(params)` | Creates a new instance of the Bulkie SDK. | `network`, `debug?`, `litDebug?`, `guides?`, `signer?`, `rpc?` | `Bulkie` |
| `connectToLitNodeClient(params?)` | Connects to the Lit Node Client. | `params.outputId?` | `Promise<this>` |
| `connectToLitContracts(params?)` | Connects to the Lit Contracts. | `params.outputId?` | `Promise<this>` |
| `mintPKP(params?)` | Mints a Programmable Key Pair (PKP). | `selfFund?`, `amountInEth?`, `params.outputId?` | `Promise<this>` |
| `mintCreditsNFT(params)` | Mints a Credits NFT. | `requestsPerKilosecond`, `daysUntilUTCMidnightExpiration`, `params.outputId?` | `Promise<this>` |
| `createCreditsDelegationToken(params)` | Creates a Credits Delegation Token. | `expiry?`, `creditsTokenId`, `delegatees?`, `params.outputId?` | `Promise<this>` |
| `createAccessToken(params)` | Creates an Access Token. | `expiration?`, `pkpPublicKey`, `type`, `resources`, `creditsDelegationToken?`, `params.outputId?` | `Promise<this>` |
| `grantAuthMethodToUsePKP(params)` | Grants an auth method permission to use a PKP. | `pkpTokenId`, `authMethodId`, `authMethodType`, `scopes`, `params.outputId?` | `Promise<this>` |
| `grantIPFSCIDtoUsePKP(params)` | Grants an IPFS CID permission to use a PKP. | `pkpTokenId`, `ipfsCid`, `scopes`, `params.outputId?` | `Promise<this>` |
| `getPkps()` | Retrieves all PKPs associated with the signer's address. | None | `Promise<this>` |
| `use(accessToken)` | Provides methods to use an access token for various actions. | `accessToken` | Object with methods |
| `getOutput(fnName, outputId?)` | Retrieves the output of a specific function. | `fnName`, `outputId?` | `FunctionReturnTypes[T] \| undefined` |
| `getAllOutputs()` | Retrieves all outputs. | None | `Map<BulkieSupportedFunctions, any>` |
| `getTotalExecutionTime()` | Retrieves the total execution time of all operations. | None | `{ ms: number, s: number }` |

## Constructor

```typescript
new Bulkie(params: {
  network: LIT_NETWORKS_KEYS,
  debug?: boolean,
  litDebug?: boolean,
  guides?: boolean,
  signer?: Signer,
  rpc?: string,
})
```

Creates a new instance of the Bulkie SDK.

- `network`: (Required) The Lit network to connect to.
- `debug`: (Optional) Enable debug logging.
- `litDebug`: (Optional) Enable Lit Protocol debug logging.
- `guides`: (Optional) Enable guide messages.
- `signer`: (Optional) Ethereum signer.
- `rpc`: (Optional) Custom RPC URL.

## Connection Methods

### connectToLitNodeClient

```typescript
async connectToLitNodeClient(params?: OutputHandler): Promise<this>
```

Connects to the Lit Node Client.

- `params.outputId`: (Optional) Custom output identifier.

### connectToLitContracts

```typescript
async connectToLitContracts(params?: OutputHandler): Promise<this>
```

Connects to the Lit Contracts.

- `params.outputId`: (Optional) Custom output identifier.

## Minting Methods

### mintPKP

```typescript
async mintPKP(params?: {
  selfFund?: boolean,
  amountInEth?: string
} & OutputHandler): Promise<this>
```

Mints a Programmable Key Pair (PKP).

- `params.selfFund`: (Optional) Whether to self-fund the PKP.
- `params.amountInEth`: (Optional) Amount of ETH to fund the PKP with.
- `params.outputId`: (Optional) Custom output identifier.

### mintCreditsNFT

```typescript
async mintCreditsNFT(params: {
  requestsPerKilosecond: number;
  daysUntilUTCMidnightExpiration: number;
} & OutputHandler): Promise<this>
```

Mints a Credits NFT.

- `params.requestsPerKilosecond`: Number of requests per kilosecond.
- `params.daysUntilUTCMidnightExpiration`: Number of days until expiration.
- `params.outputId`: (Optional) Custom output identifier.

## Token Creation Methods

### createCreditsDelegationToken

```typescript
async createCreditsDelegationToken(params: {
  expiry?: string,
  creditsTokenId: string,
  delegatees?: HexAddress[],
} & OutputHandler): Promise<this>
```

Creates a Credits Delegation Token.

- `params.expiry`: (Optional) Expiration date in ISO format.
- `params.creditsTokenId`: Credits Token ID.
- `params.delegatees`: (Optional) Array of delegatee addresses.
- `params.outputId`: (Optional) Custom output identifier.

### createAccessToken

```typescript
async createAccessToken(params: {
  expiration?: string;
  pkpPublicKey: HexAddress;
  type: 'custom_auth' | 'native_auth' | 'eoa';
  resources: Array<{
    type: 'pkp-signing' | 'lit-action-execution' | 'rate-limit-increase-auth' | 'access-control-condition-decryption' | 'access-control-condition-signing';
    request: string | '*';
  }>;
  creditsDelegationToken?: AuthSig;
  jsParams?: any;
  code?: string;
  ipfsCid?: IPFSCIDv0;
  permissions?: {
    grantIPFSCIDtoUsePKP?: {
      scopes: AuthMethodScopes;
    }
  };
} & OutputHandler): Promise<this>
```

Creates an Access Token.

- `params.expiration`: (Optional) Expiration date in ISO format.
- `params.pkpPublicKey`: PKP public key.
- `params.type`: Token type ('custom_auth', 'native_auth', or 'eoa').
- `params.resources`: Array of resources and their types.
- `params.creditsDelegationToken`: (Optional) Credits Delegation Token.
- `params.jsParams`: (Optional) JavaScript parameters.
- `params.code`: (Optional) JavaScript code.
- `params.ipfsCid`: (Optional) IPFS CID.
- `params.permissions`: (Optional) Additional permissions.
- `params.outputId`: (Optional) Custom output identifier.

## Permission Granting Methods

### grantAuthMethodToUsePKP

```typescript
async grantAuthMethodToUsePKP(params: {
  pkpTokenId: HexAddress;
  authMethodId: `${string}:${string}` | string;
  authMethodType: number;
  scopes: AuthMethodScopes
} & OutputHandler): Promise<this>
```

Grants an auth method permission to use a PKP.

- `params.pkpTokenId`: PKP Token ID.
- `params.authMethodId`: Auth method ID.
- `params.authMethodType`: Auth method type.
- `params.scopes`: Array of auth method scopes.
- `params.outputId`: (Optional) Custom output identifier.

### grantIPFSCIDtoUsePKP

```typescript
async grantIPFSCIDtoUsePKP(params: {
  pkpTokenId: HexAddress,
  ipfsCid: IPFSCIDv0,
  scopes: AuthMethodScopes
} & OutputHandler): Promise<this>
```

Grants an IPFS CID permission to use a PKP.

- `params.pkpTokenId`: PKP Token ID.
- `params.ipfsCid`: IPFS CID.
- `params.scopes`: Array of auth method scopes.
- `params.outputId`: (Optional) Custom output identifier.

## Getter Methods

### getPkps

```typescript
async getPkps(): Promise<this>
```

Retrieves all PKPs associated with the signer's address.

## Action Methods

### use

```typescript
use(accessToken: SessionSigsMap): {
  toRun: <T extends PKG_TYPES>(repo: T, params: PkgParams[T] & OutputHandler) => Promise<this>;
  toExecuteJs: (params: {
    code?: string,
    ipfsId?: IPFSCIDv0,
    authMethod?: AuthMethod[],
    jsParams?: { [key: string]: any }
  } & OutputHandler) => Promise<this>;
  toPkpSign: (params: {
    publicKey: HexAddress,
    message: string | Uint8Array,
  } & OutputHandler) => Promise<this>;
}
```

The `use` method provides access to various actions that can be performed with an access token. It returns an object containing three methods:

- **toRun**:
  - Runs a specific package or IPFS CID. This method allows you to execute custom-built Lit Action code stored in a local repository.
  - **Parameters**:
    - `repo`: The local repository of the custom-built Lit Action code.
    - `params`: Additional parameters required for the specific package.
- **toExecuteJs**:

  - Executes JavaScript code on Lit nodes. This method is useful for running dynamic scripts that interact with the Lit Protocol.
  - **Parameters**:
    - `code`: (Optional) The JavaScript code to execute.
    - `ipfsId`: (Optional) The IPFS ID of the code to execute.
    - `authMethod`: (Optional) An array of authentication methods to use.
    - `jsParams`: (Optional) Additional parameters for the JavaScript execution.

- **toPkpSign**:
  - Signs a message using a Programmable Key Pair (PKP). This method is essential for cryptographic operations that require signing.
  - **Parameters**:
    - `publicKey`: The public key associated with the PKP.
    - `message`: The message to be signed, which can be a string or a Uint8Array.

This structure allows for flexible interaction with the Lit Protocol, enabling developers to run custom actions, execute scripts, and perform cryptographic signing seamlessly.

## Utility Methods

### getOutput

```typescript
getOutput<T extends BulkieSupportedFunctions>(fnName: T, outputId?: string): FunctionReturnTypes[T] | undefined
```

Retrieves the output of a specific function.

### getAllOutputs

```typescript
getAllOutputs(): Map<BulkieSupportedFunctions, any>
```

Retrieves all outputs.

### getTotalExecutionTime

```typescript
getTotalExecutionTime(): { ms: number, s: number }
```

Retrieves the total execution time of all operations.

## Code Examples

Here are some code examples demonstrating how to use the Bulkie SDK with the `alice` instance.

### Example 1: Connecting to the Lit Node Client

```typescript
import { ethers } from "ethers"; // 5.7.2
import { Bulkie } from "./src/bulkie";

const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string);
const alice = new Bulkie({
  guides: true,
  debug: true,
  litDebug: false,
  network: detectedNetwork(),
  signer: signer,
});

await alice.connectToLitNodeClient();
await alice.connectToLitContracts();
```

### Example 2: Minting a Programmable Key Pair (PKP)

```typescript
await alice.mintPKP({
  selfFund: true,
  amountInEth: "0.0001",
});
console.log("PKP Minted:", alice.getOutput("mintPKP"));
```

### Example 3: Creating a Credits NFT

```typescript
await alice.mintCreditsNFT({
  requestsPerKilosecond: 200,
  daysUntilUTCMidnightExpiration: 2,
});
console.log("Credits NFT Minted:", alice.getOutput("mintCreditsNFT"));
```

### Example 4: Granting an Auth Method to Use PKP

```typescript
await alice.grantAuthMethodToUsePKP({
  pkpTokenId: alice.getOutput("mintPKP")?.tokenId.hex!,
  authMethodId: "app-id-xxx:user-id-yyy",
  authMethodType: 918232,
  scopes: ["sign_anything"],
});
console.log("tx:", alice.getOutput("grantAuthMethodToUsePKP"));
```

### Example 5: Creating an Access Token

```typescript
const litActionCode = `(async () => {
  LitActions.setResponse({ response: "true" });  
})();`;

await alice.createAccessToken({
  type: "custom_auth",
  pkpPublicKey: alice.getOutput("mintPKP")?.publicKey as `0x${string}`,
  creditsDelegationToken: alice.getOutput("createCreditsDelegationToken"),
  resources: [
    { type: "pkp-signing", request: "*" },
    { type: "lit-action-execution", request: "*" },
  ],
  code: litActionCode,
  jsParams: {
    pkpPublicKey: alice.getOutput("mintPKP")?.publicKey as `0x${string}`,
    rpcUrl: "https://yellowstone-rpc.litprotocol.com",
    magicNumber: 3,
  },
});
console.log("accessToken:", alice.getOutput("createAccessToken"));
```

### Example 6: Using the Access Token to Execute JavaScript

```typescript
const accessToken = alice.getOutput("createAccessToken");

await alice.use(accessToken!).toExecuteJs({
  code: `(async () => {
      console.log("Testing");
    })();`,
});

console.log("Execution Result:", alice.getOutput("toExecuteJs"));
```

### Example 7: Signing a Message with PKP

```typescript
const accessToken = alice.getOutput("createAccessToken");
await alice.use(accessToken!).toPkpSign({
  publicKey: alice.getOutput("mintPKP")?.publicKey!,
  message: "hello",
});
console.log("Message Signed with PKP:", alice.getOutput("toPkpSign"));
```

### Example 8: To Run a Custom Lit Action

```typescript
await alice.use(accessToken!).toRun("wrapped-keys/generate-private-key", {
  chain: "evm",
  memo: "hello",
});
console.log("Key Info:", alice.getOutput("wrapped-keys/generate-private-key"));
```

These examples illustrate how to interact with the Bulkie SDK using the `alice` instance for various operations, including connecting to the Lit Node Client, minting PKPs, creating NFTs, and using access tokens.
