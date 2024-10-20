import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { AuthMethod, AuthSig, LIT_NETWORKS_KEYS, SessionSigsMap } from '@lit-protocol/types';
import { ethers, Signer } from 'ethers';
import { RPC_URL_BY_NETWORK, METAMASK_CHAIN_INFO_BY_NETWORK, LIT_ABILITY } from '@lit-protocol/constants';
import { BulkieSupportedFunctions, FN, FunctionReturnTypes, IPFSCIDv0, STEP, STEP_VALUES, UNAVAILABLE_STEP, HexAddress, AuthMethodScopes, OutputHandler } from './types';
import {

  LitActionResource,
  LitPKPResource,
  LitAccessControlConditionResource,
  LitRLIResource
} from '@lit-protocol/auth-helpers';
import { BulkieUtils } from './utils';
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';
import { validateSessionSigs, formatSessionSigs } from '@lit-protocol/misc';
import { api as wrappedKeysApi } from '@lit-protocol/wrapped-keys';
import { PKG, PKG_TYPES, PkgParams } from './repo';
import { VERSION } from './version';

/**
 * This class aims to provide a simple, strongly-typed interface for interacting with the Lit Protocol. 
 * While its features are limited, it covers the basic development flow for various use cases, such as those 
 * found in the developer guides and hackathon code.
 * 
 * It is bulky because it is meant to be a one-stop-shop for all the functions that a developer might need to interact with the Lit Protocol, which means there are tighly coupled dependencies, such as ethers, LitNodeClient, LitContracts, and ethers Signer.
 * 
 * For more advanced use cases, developers can opt to use the @lit-protocol/lit-node-client and @lit-protocol/contracts-sdk packages directly.
 * 
 * Future ideas (to make it more modular):
 * - Allow the user to pass in specific instances for each function.
 */
export class Bulkie {

  private debug: boolean;
  private litDebug: boolean;
  private guides: boolean;

  // -- requirements
  private network: LIT_NETWORKS_KEYS;
  private litNodeClient: LitNodeClient;
  private litContracts: LitContracts;
  private signer: Signer | undefined;
  private rpc: string;

  // -- others
  private executionTimes: number[] = [];
  private outputs: Map<BulkieSupportedFunctions, any> = new Map();

  constructor(params: {
    network: LIT_NETWORKS_KEYS,
    debug?: boolean,
    litDebug?: boolean,
    guides?: boolean,
    signer?: Signer,
    rpc?: string,
  }) {

    if (!params.network) {
      throw new Error('Network is required');
    }

    this.network = params.network;
    this.debug = params.debug || false;
    this.litDebug = params.litDebug || false;
    this.guides = params.guides || false;
    this.rpc = params.rpc || RPC_URL_BY_NETWORK[this.network];
    this.signer = params.signer || undefined;

    if (this.signer) {
      if (typeof window === 'undefined') {
        // Node.js environment
        this.signer = this.signer.connect(new JsonRpcProvider(this.rpc));
      } else {
        // Browser environment
        if (window.ethereum) {
          this.signer = new Web3Provider(window.ethereum).getSigner();
        } else {
          this._debug('No web3 provider detected in the browser');
        }
      }
    }
  }

  /**
   * ========== Getters ==========
   */
  getOutput<T extends BulkieSupportedFunctions>(fnName: T, outputId?: string): FunctionReturnTypes[T] | undefined {
    const key = outputId ? `${fnName}:${outputId}` : fnName;
    return this.outputs.get(key as BulkieSupportedFunctions) as FunctionReturnTypes[T] | undefined;
  }

  getAllOutputs() {
    return this.outputs;
  }

  // NOTE: There isn't a "getTotalNumberOfPkps" because we need
  // to iterate over from 0 to the total number of PKPs to get the PKP
  getPkps() {
    this._checkRequirements('getPkps');

    return this._run(
      'Get PKPs',
      FN.getPkps,
      async () => {

        const signerAddress = await this.signer?.getAddress();

        if (!signerAddress) {
          throw new Error('Signer address is required');
        }

        const tokens = await this.litContracts.pkpNftContractUtils.read.getTokensByAddress(signerAddress);

        const res = await Promise.all(
          tokens.map(async (tokenId: string) => {
            const publicKey = await this.litContracts.pkpPermissionsContract.read.getPubkey(tokenId);
            const ethAddress = ethers.utils.computeAddress(`0x${publicKey.slice(2)}`);
            const tokenIdHex = ethers.BigNumber.from(tokenId).toHexString();

            return {
              tokenId: {
                hex: tokenIdHex,
                decimal: tokenId
              },
              publicKey: publicKey,
              ethAddress
            };
          })
        );

        this._setOutput(FN.getPkps, res);

        return this;
      },
      []
    );

  }

  public getTotalExecutionTime() {
    const totalMs = this.executionTimes.reduce((a, b) => a + b, 0);
    const totalS = totalMs / 1000;

    return {
      ms: totalMs,
      s: totalS,
    };
  }
  /**
   * ========== Utils ==========
   */
  private _guide(message: string) {
    if (this.guides) {
      console.log(message);
    }
  }

  private _debug(...messages: string[]) {
    if (this.debug) {
      console.log(`\x1b[90m[bulkie.js ${VERSION}] ${messages.join(' ')}` + `\x1b[0m`);
    }
  }

  private _setOutput<T>(fnName: BulkieSupportedFunctions, output: T, outputId?: string): void {
    const key = outputId ? `${fnName}:${outputId}` : fnName;
    this.outputs.set(key as BulkieSupportedFunctions, output);
  }

  private async _run<T>(
    opName: string,
    fnName: BulkieSupportedFunctions,
    action: () => Promise<T>,
    nextSteps: STEP_VALUES,
  ): Promise<T> {
    const startTime = Date.now();

    try {

      this._checkRequirements(fnName);

      this._debug(`${fnName}()`)
      const result = await action();

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.executionTimes.push(duration);

      this._guide(`
  ✅ ${opName} completed successfully in ${duration}ms
  ❓ What can I do next?
    ${nextSteps.map(step => `- ${step}`).join('\n    ')}`);
      this._guide(`\n\x1b[90m------------------------------------------------------------------------\x1b[0m\n`)

      return result;
    } catch (e: any) {
      throw new Error(`Error in ${opName}: ${e.message}`);
    }
  }

  /**
   * a function to check if all the required actions are ran before running the current action. eg. mintPKP requires connectToLitContracts to be ran first.
   */
  private _checkRequirements(fnName: BulkieSupportedFunctions) {

    const require = {
      network: () => {
        if (!this.network) {
          throw new Error('❌ this.network is required');
        }
      },
      litNodeClient: () => {
        if (!this.litNodeClient) {
          throw new Error('❌ LitNodeClient is required');
        }
      },
      litContracts: () => {
        if (!this.litContracts) {
          throw new Error('❌ LitContracts is required');
        }
      },
      signer: () => {
        if (!this.signer) {
          throw new Error('❌ Signer is required');
        }
      }
    };

    switch (fnName) {
      case FN.connectToLitNodeClient:
        require.network();
        break;
      case FN.connectToLitContracts:
        require.network();
        break;
      case FN.mintPKP:
        require.litContracts();
        require.signer();
        break;
      case FN.mintCreditsNFT:
        require.litContracts();
        require.signer();
        break;
      case FN.getPkps:
        require.litContracts();
        require.signer();
        break;
      case FN.grantAuthMethodToUsePKP:
        require.litContracts();
        require.signer();
      case FN.createAccessToken:
        require.litNodeClient();
      case FN.toExecuteJs:
        require.litNodeClient();
      default:
    }
  }

  /**
   * ========== Actions ==========
   */
  async connectToLitNodeClient(params?: OutputHandler): Promise<this> {

    return this._run(
      'LitNodeClient connection',
      FN.connectToLitNodeClient,
      async () => {

        this.litNodeClient = new LitNodeClient({
          litNetwork: this.network,
          debug: this.litDebug,
          rpcUrl: this.rpc
        });
        await this.litNodeClient.connect();

        this._setOutput(FN.connectToLitNodeClient, this.litNodeClient, params?.outputId);

        return this;
      },
      [
        STEP['connectToLitContracts']
      ]
    );
  }

  async connectToLitContracts(params?: OutputHandler): Promise<this> {

    return this._run(
      'LitContracts connection',
      FN.connectToLitContracts,
      async () => {

        if (this.signer) {
          if (typeof window === 'undefined') {
            // Node.js environment
            this.signer = this.signer.connect(new JsonRpcProvider(this.rpc));
          } else {
            // Browser environment
            if (window.ethereum) {
              this.signer = new Web3Provider(window.ethereum).getSigner();
            } else {
              this._debug('No web3 provider detected in the browser');
            }
          }
          this._debug(`Signer connected: ${this.rpc}`);
          try {
            this._debug(`Signer address:   ${await this.signer.getAddress()}`);
            this._debug(`Signer balance:   ${ethers.utils.formatEther(await this.signer.getBalance())} ETH`);
          } catch (e: any) {
            this._debug(`Error getting signer address: ${e.message}`);
          }
        }

        this.litContracts = new LitContracts({
          debug: this.litDebug,
          network: this.network,
          signer: this.signer,
          rpc: this.rpc
        });

        await this.litContracts.connect();

        this._setOutput(FN.connectToLitContracts, this.litContracts, params?.outputId);

        return this;
      },
      [
        STEP['mintPKP'],
        STEP['getPkps'],
        STEP['mintCreditsNFT']
      ]
    )
  }

  async mintPKP(params?: { selfFund?: boolean, amountInEth?: string } & OutputHandler): Promise<this> {

    let _nextSteps: STEP_VALUES = [];

    if (params?.selfFund) {
      _nextSteps = [
        STEP['grantAuthMethodToUsePKP'],
        STEP['grantIPFSCIDtoUsePKP'],
        STEP['mintCreditsNFT'],
      ];
    } else {
      _nextSteps = [
        UNAVAILABLE_STEP['mint-pkp-tip-1'],
        STEP['grantAuthMethodToUsePKP'],
        STEP['grantIPFSCIDtoUsePKP'],
        STEP['mintCreditsNFT'],
      ];
    }

    return this._run(
      'Mint PKP',
      FN.mintPKP,
      async () => {

        const _selfFund = params?.selfFund || false;
        const _amountInEth = params?.amountInEth || '0.001';

        const res = await this.litContracts.pkpNftContractUtils.write.mint();

        const explorerUrl = METAMASK_CHAIN_INFO_BY_NETWORK[this.network].blockExplorerUrls[0]
        const hashOnExplorer = `${explorerUrl}tx/${res.tx.hash}`;
        const hexPrefixedPublicKey: HexAddress = `0x${res.pkp.publicKey}`;
        const decimalTokenId = ethers.BigNumber.from(res.pkp.tokenId).toString();

        this._debug(`tokenId:    ${decimalTokenId}`);
        this._debug(`publicKey:  ${hexPrefixedPublicKey}`);
        this._debug(`ethAddress: ${res.pkp.ethAddress}`);
        this._debug(`txHash:     ${hashOnExplorer}`);

        if (_selfFund) {
          this._debug('----- (Self Funding Enabled) -----');
          try {
            const tx = await this.signer?.sendTransaction({
              to: res.pkp.ethAddress,
              value: ethers.utils.parseEther(_amountInEth)
            });

            if (!tx) {
              throw new Error('Transaction failed. This should never happen.');
            }

            const receipt = await tx.wait();

            this._debug(`Funding amount:   ${_amountInEth} ETH.`);
            this._debug(`Transaction hash: ${receipt.transactionHash}`);
            this._debug(`Explorer:         ${explorerUrl}tx/${receipt.transactionHash}`);

            const pkpBalance = await this.signer?.provider?.getBalance(res.pkp.ethAddress);

            if (pkpBalance) {
              this._debug(`PKP balance:      ${ethers.utils.formatEther(pkpBalance)} ETH`);
            }

            const signerBalance = await this.signer?.getBalance();

            if (signerBalance) {
              this._debug(`Signer balance:   ${ethers.utils.formatEther(signerBalance)} ETH`);
            }

          } catch (e) {
            throw new Error(`Error funding PKP: ${e}`);
          }
        }

        this._setOutput(FN.mintPKP, {
          tokenId: {
            hex: res.pkp.tokenId,
            decimal: decimalTokenId,
          },
          publicKey: hexPrefixedPublicKey,
          ethAddress: res.pkp.ethAddress,
          tx: {
            hash: res.tx.hash,
            explorer: hashOnExplorer
          },
        }, params?.outputId);

        return this;
      },
      _nextSteps
    )
  }

  async mintCreditsNFT(params: {

    /**
     * eg. 1000 requests per kilosecond is 86,000 requests per day
     * You could also use the calculator here: https://explorer.litprotocol.com/
     */
    requestsPerKilosecond: number;

    /**
     * The number of days until the token expires at UTC midnight.
     */
    daysUntilUTCMidnightExpiration: number;
  } & OutputHandler) {

    if (!params.requestsPerKilosecond || !params.daysUntilUTCMidnightExpiration) {
      throw new Error('requestsPerKilosecond and daysUntilUTCMidnightExpiration are required');
    }

    return this._run(
      'Mint Credits Token',
      FN.mintCreditsNFT,
      async () => {
        const { capacityTokenIdStr } = await this.litContracts.mintCapacityCreditsNFT({
          requestsPerKilosecond: params.requestsPerKilosecond,
          daysUntilUTCMidnightExpiration: params.daysUntilUTCMidnightExpiration,
        })
        this._debug(`Capacity Token ID: ${capacityTokenIdStr}`);

        this._setOutput(FN.mintCreditsNFT, capacityTokenIdStr, params?.outputId);

        return this;
      },
      [
        STEP['createCreditsDelegationToken'],
      ]
    )
  }

  async createCreditsDelegationToken(params: {

    /**
     * The expiry date of the token in UTC midnight in ISO format. eg. '2022-12-31T00:00:00.000Z'
     * @example new Date().toISOString()
     */
    expiry?: string,
    creditsTokenId: string,
    delegatees?: HexAddress[],
  } & OutputHandler) {
    return this._run(
      'Create Credits Delegation Token',
      'createCreditsDelegationToken',
      async () => {

        if (!this.signer) {
          throw new Error('Signer is required');
        }

        this._debug(`Expiry: ${params.expiry}`);
        this._debug(`Credits Token ID: ${params.creditsTokenId}`);
        if (params?.delegatees?.length) {
          this._debug(`Delegatees: ${params?.delegatees!.join(', ')}`);
        } else {
          this._debug(`No delegatees provided`);
        }

        const { capacityDelegationAuthSig } = await this.litNodeClient.createCapacityDelegationAuthSig({
          ...(params.expiry && { expiration: params.expiry }),
          dAppOwnerWallet: this.signer,
          capacityTokenId: params.creditsTokenId,
          ...(params?.delegatees?.length && { delegateeAddresses: params.delegatees }),
        });

        this._debug(`Capacity Delegation Token: ${capacityDelegationAuthSig}`);

        try {
          const resources = BulkieUtils.parseSignedMessage(capacityDelegationAuthSig.signedMessage);

          this._debug(`Resources: ${JSON.stringify(resources.raw)}`);
        } catch (e) {
          this._debug(`Error parsing signed message: ${e}`);
        }

        this._setOutput('createCreditsDelegationToken', capacityDelegationAuthSig, params?.outputId);

        return this;
      },
      [
        STEP['createAccessToken']
      ]
    )
  }

  async createAccessToken(params: {
    expiration?: string; // ISO string
    pkpPublicKey: HexAddress;
    type: 'custom_auth' | 'native_auth' | 'eoa',
    resources: {
      type:
      'pkp-signing' |
      'lit-action-execution' |
      'rate-limit-increase-auth' |
      'access-control-condition-decryption' |
      'access-control-condition-signing',
      request: string | '*'
    }[],
    creditsDelegationToken?: AuthSig;
  } & (
      (| {
        type: 'native_auth' | 'custom_auth';
      } & ({
        jsParams: any;
        code: string;

        /**
         * Make sure that this ipfsCid is pinned on the IPFS node so we can fetch it later.
         */
        ipfsCid?: IPFSCIDv0
      }) | ({
        jsParams: any;
        permissions?: {
          grantIPFSCIDtoUsePKP?: {
            scopes: AuthMethodScopes;
          }
        },

        code?: string;

        /**
         * Make sure that this ipfsCid is pinned on the IPFS node so we can fetch it later.
         */
        ipfsCid: IPFSCIDv0
      }))
      | { type: 'eoa' }
    ) & OutputHandler) {


    if (params.type === 'eoa' || params.type === 'native_auth') {
      throw new Error('Native auth and EOA are not supported yet');
    }

    if (params.type === 'custom_auth') {

      if (!params.code && !params.ipfsCid) {
        throw new Error('Either code or ipfsCid must be provided');
      }
      if (params.code && params.ipfsCid) {
        throw new Error('Only one of code or ipfsCid should be provided, not both');
      }

      if (!params.jsParams) {
        throw new Error('jsParams is required');
      }

    }

    if (!params.pkpPublicKey) {
      throw new Error('pkpPublicKey is required');
    }

    if (!params.resources.length || params.resources.length === 0) {
      throw new Error('resources is required');
    }

    const _pkpPublicKey: string = params.pkpPublicKey.startsWith('0x') ? params.pkpPublicKey.slice(2) : params.pkpPublicKey;

    const requestAbilityRequests = params.resources.map(resource => {
      switch (resource.type) {
        case 'access-control-condition-signing':
          return {
            resource: new LitAccessControlConditionResource(resource.request),
            ability: LIT_ABILITY.AccessControlConditionSigning,
          }
        case 'access-control-condition-decryption':
          return {
            resource: new LitAccessControlConditionResource(resource.request),
            ability: LIT_ABILITY.AccessControlConditionDecryption,
          }
        case 'lit-action-execution':
          return {
            resource: new LitActionResource(resource.request),
            ability: LIT_ABILITY.LitActionExecution,
          }
        case 'rate-limit-increase-auth'
          : return {
            resource: new LitRLIResource(resource.request),
            ability: LIT_ABILITY.RateLimitIncreaseAuth,
          }
        case 'pkp-signing':
          return {
            resource: new LitPKPResource(resource.request),
            ability: LIT_ABILITY.PKPSigning,
          }
        default:
          throw new Error(`Resource type ${resource.type} is not supported`);
      }
    });

    this._debug(`pkpPublicKey: ${params.pkpPublicKey}`);
    this._debug(`type: ${params.type}`);
    this._debug(`resources: ${JSON.stringify(params.resources)}`);

    return this._run(
      'Create Access Token',
      FN.createAccessToken,
      async () => {

        if (params.type === 'custom_auth') {

          if (!params.creditsDelegationToken) {
            throw new Error('creditsDelegationToken is required');
          }

          if (!params.code && !params.ipfsCid) {
            throw new Error('Either code or ipfsCid must be provided');
          }

          const sessionSigs = await this.litNodeClient.getLitActionSessionSigs({
            expiration: params.expiration || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            pkpPublicKey: _pkpPublicKey,
            resourceAbilityRequests: requestAbilityRequests,
            ...(params.code && !params.ipfsCid
              ? { litActionCode: Buffer.from(params.code).toString('base64') }
              : { litActionIpfsId: params.ipfsCid! }),
            jsParams: params.jsParams,
            ...(params.creditsDelegationToken && { capabilityAuthSigs: [params.creditsDelegationToken] }),
          });

          this._setOutput(FN.createAccessToken, sessionSigs, params?.outputId);

          return this;
        } else {
          throw new Error('Type not supported yet');
        }
      },
      [
        STEP['toExecuteJs'],
        // STEP['pkpSign']
      ]);
  }

  /**
   * This function is usually called by the dApp owner.
   */
  async grantAuthMethodToUsePKP(params: {
    pkpTokenId: HexAddress;

    /**
     * authMethodId is a string that represents the user id of the user that you want to grant access to. This is usually done in the backend of your application. eg. 'app-id-xxx:user-id-yyy'
     */
    authMethodId: `${string}:${string}` | string;

    /**
     * Recommend to use a very high number for custom auth method types.
     */
    authMethodType: number;
    scopes: AuthMethodScopes
  } & OutputHandler) {

    // no_permission = 0
    // sign_anything = 1
    // eip_191_personal_sign = 2
    const _scopes = params.scopes.map(scope => {
      return scope === 'no_permission' ? 0 : scope === 'sign_anything' ? 1 : 2;
    });

    return this._run(
      'Grant Auth Method',
      FN.grantAuthMethodToUsePKP,
      async () => {

        this._debug(`authMethodId: ${params.authMethodId}`);
        this._debug(`authMethodType: ${params.authMethodType}`);
        this._debug(`scopes: ${params.scopes} | ${_scopes}`);
        this._debug(`pkpTokenId: ${params.pkpTokenId}`);

        const receipt = await this.litContracts.addPermittedAuthMethod({
          pkpTokenId: params.pkpTokenId,
          authMethodId: params.authMethodId,
          authMethodType: params.authMethodType,
          authMethodScopes: _scopes,
        });

        const explorerUrl = METAMASK_CHAIN_INFO_BY_NETWORK[this.network].blockExplorerUrls[0]
        const hashOnExplorer = `${explorerUrl}tx/${receipt.transactionHash}`;

        this._debug(`Transaction hash: ${receipt.transactionHash}`);
        this._debug(`Explorer:         ${hashOnExplorer}`);

        this._setOutput(FN.grantAuthMethodToUsePKP, {
          tx: {
            hash: receipt.transactionHash,
            explorer: hashOnExplorer
          }
        }, params?.outputId);

        return this;
      },
      [
        STEP['grantIPFSCIDtoUsePKP']
      ]
    )
  }

  async grantIPFSCIDtoUsePKP(params: {
    pkpTokenId: HexAddress,
    ipfsCid: IPFSCIDv0,
    scopes: AuthMethodScopes
  } & OutputHandler) {

    // no_permission = 0
    // sign_anything = 1
    // eip_191_personal_sign = 2
    const _scopes = params.scopes.map(scope => {
      return scope === 'no_permission' ? 0 : scope === 'sign_anything' ? 1 : 2;
    });

    return this._run(
      'Grant IPFS CID',
      'grantIPFSCIDtoUsePKP',
      async () => {

        this._debug(`pkpTokenId: ${params.pkpTokenId}`);
        this._debug(`ipfsCid: ${params.ipfsCid}`);
        this._debug(`scopes: ${params.scopes} | ${_scopes}`);

        const receipt = await this.litContracts.addPermittedAction({
          pkpTokenId: params.pkpTokenId,
          ipfsId: params.ipfsCid,
          authMethodScopes: _scopes,
        });

        const explorerUrl = METAMASK_CHAIN_INFO_BY_NETWORK[this.network].blockExplorerUrls[0]
        const hashOnExplorer = `${explorerUrl}tx/${receipt.transactionHash}`;

        this._debug(`Transaction hash: ${receipt.transactionHash}`);
        this._debug(`Explorer:         ${hashOnExplorer}`);

        this._setOutput(FN.grantIPFSCIDtoUsePKP, {
          tx: {
            hash: receipt.transactionHash,
            explorer: hashOnExplorer
          }
        }, params?.outputId);

        return this;
      },
      [
        STEP['createAccessToken']
      ]
    )
  }

  /**
   * ========== Using Access Tokens ==========
   */
  use(this: Bulkie, accessToken: SessionSigsMap) {
    const validation = validateSessionSigs(accessToken);
    if (!validation.isValid) {
      throw new Error(`Invalid access token: ${validation.errors}`);
    }

    const formattedSessionSigs = formatSessionSigs(JSON.stringify(accessToken));
    this._debug(`formattedSessionSigs: ${formattedSessionSigs}`);

    return {
      toRun: async <T extends PKG_TYPES>(
        repo: T,
        params: PkgParams[T] & OutputHandler
      ) => {
        return await this._toRun(
          repo,
          params,
          accessToken
        );
      },
      toExecuteJs: async (params: {
        code?: string,
        ipfsId?: IPFSCIDv0,
        authMethod?: AuthMethod[],
        jsParams?: {
          [key: string]: any
        }
      } & OutputHandler) => await this._executeJs({
        accessToken: accessToken,
        ...params
      }),
      toPkpSign: async (params: {
        publicKey: HexAddress,
        message: string | Uint8Array,
      } & OutputHandler) => await this._pkpSign({
        accessToken: accessToken,
        pkpPublicKey: params.publicKey,
        message: params.message
      })
    }
  }

  private async _generatePrivateKey(
    params: PkgParams['wrapped-keys/generate-private-key'] & {
      accessToken: SessionSigsMap
    } & OutputHandler) {

    return this._run(
      'Generate Private Key',
      'wrapped-keys/generate-private-key',
      async () => {
        const { pkpAddress, generatedPublicKey, id } = await wrappedKeysApi.generatePrivateKey({
          pkpSessionSigs: params.accessToken,
          network: params.chain,
          litNodeClient: this.litNodeClient as any,
          memo: params.memo
        });

        const result = {
          pkpAddress: pkpAddress as HexAddress,
          generatedPublicKey,
          id
        };

        this._debug(`privateKeyResult: ${JSON.stringify(result)}`);

        this._setOutput('wrapped-keys/generate-private-key', result, params?.outputId);

        return this;
      },
      []
    );
  }

  // -- native actions
  private async _executeJs(params: {
    accessToken: SessionSigsMap,
    code?: string,
    ipfsId?: IPFSCIDv0,
    authMethod?: AuthMethod[],
    jsParams?: {
      [key: string]: any
    },
  } & OutputHandler
  ) {

    if (!params.accessToken) {
      throw new Error('accessToken is required');
    }

    if (params.code && params.ipfsId) {
      throw new Error('code and ipfsId cannot be both exist at the same time, only one of them is required');
    }

    if (!params.code && !params.ipfsId) {
      throw new Error('Either code or ipfsId is required');
    }

    return this._run(
      'Run JS',
      'toExecuteJs',
      async () => {
        const res = await this.litNodeClient.executeJs({
          sessionSigs: params.accessToken,
          ...(params.code && { code: params.code }),
          ...(params.ipfsId && { ipfsId: params.ipfsId }),
          ...(params.authMethod && { authMethod: params.authMethod }),
          ...(params.jsParams && { jsParams: params.jsParams }),
        });

        this._debug(`res: ${JSON.stringify(res)}`);

        this._setOutput('toExecuteJs', res, params?.outputId);

        return this;
      },
      []
    );
  }
  private async _pkpSign(params: {
    accessToken: SessionSigsMap,
    pkpPublicKey: HexAddress,
    message: string | Uint8Array,
  } & OutputHandler) {

    let messageBuffer: Uint8Array;

    // The following code checks the type of the message parameter and processes it accordingly.
    // If the message is a string, it hashes the string using SHA-256 and converts it to a Uint8Array.
    // If the message is already a Uint8Array, it assigns it directly to messageBuffer.
    messageBuffer = typeof params.message === 'string'
      ? new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(params.message)))
      : params.message;

    this._debug("messageBuffer", messageBuffer.toString());

    return this._run(
      'Pkp Sign',
      'toPkpSign',
      async () => {

        const res = await this.litNodeClient.pkpSign({
          pubKey: params.pkpPublicKey as HexAddress,
          toSign: messageBuffer,
          sessionSigs: params.accessToken
        });

        this._debug(`res: ${JSON.stringify(res)}`);

        this._setOutput(FN.toPkpSign, res, params?.outputId);

        return this
      },
      []
    )
  }

  // -- custom actions
  private async _toRun<T extends PKG_TYPES>(
    pkg: T,
    params: PkgParams[T] & OutputHandler,
    accessToken?: SessionSigsMap
  ) {

    // -- validate
    if (!Object.values(PKG).includes(pkg as any) && !pkg.startsWith('Qm')) {
      throw new Error(`pkg ${pkg} is not supported`);
    }

    if (pkg === 'wrapped-keys/generate-private-key') {
      return this._generatePrivateKey({
        chain: params.chain,
        memo: params.memo,
        accessToken: accessToken!
      });
    }

    if (pkg.startsWith('Qm')) {
      return this._run(
        'Run IPFS CID',
        `Qm${pkg.slice(1)}`,
        async () => {
          const res = await this.litNodeClient.executeJs({
            sessionSigs: accessToken,
            ipfsId: pkg,
            ...(params.jsParams && { jsParams: params.jsParams }),
          });

          this._debug(`res: ${JSON.stringify(res)}`);

          this._setOutput(pkg, res, params?.outputId);

          return this;
        },
        []
      );
    }
  }
}