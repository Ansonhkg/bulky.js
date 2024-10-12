import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { ethers, Signer, Wallet } from 'ethers';
import { RPC_URL_BY_NETWORK, METAMASK_CHAIN_INFO_BY_NETWORK } from '@lit-protocol/constants';
import { BulkieSupportedFunctions, FN, FunctionReturnTypes } from './types';

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
      this.signer = this.signer.connect(new ethers.providers.JsonRpcProvider(this.rpc));
    }
  }

  /**
   * ========== Getters ==========
   */
  getLitNodeClient() {
    this._checkRequirements('getLitNodeClient');

    return this.litNodeClient;
  }

  getLitContracts() {
    this._checkRequirements('getLitContracts');
    return this.litContracts;
  }

  getOutput<T extends BulkieSupportedFunctions>(fnName: T): FunctionReturnTypes[T] | undefined {
    return;
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

        return res;
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

  private _debug(message: string) {
    if (this.debug) {
      console.log(`\x1b[90m[bulkie.js] ${message}\x1b[0m`);
    }
  }

  private async _run<T>(
    opName: string,
    fnName: BulkieSupportedFunctions,
    action: () => Promise<T>,
    nextSteps: string[]
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
    } catch (e) {
      throw new Error(`Error in ${opName}: ${e}`);
    }
  }

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
      case FN.getLitNodeClient:
        require.litNodeClient();
        break
      case FN.getLitContracts:
        require.litContracts();
        break
      case FN.mintPKP:
        require.litContracts();
        require.signer();
        break;
      case FN.getPkps:
        require.litContracts();
        require.signer();
        break;
      default:

    }
  }

  /**
   * ========== Actions ==========
   */
  async connectToLitNodeClient(): Promise<this> {

    return this._run(
      'LitNodeClient connection',
      FN.connectToLitNodeClient,
      async () => {

        this.litNodeClient = new LitNodeClient({
          litNetwork: 'datil',
          debug: this.litDebug,
          rpcUrl: this.rpc
        });
        await this.litNodeClient.connect();

        this.outputs.set(FN.connectToLitNodeClient, this.litNodeClient);

        return this;
      },
      [`${FN.connectToLitContracts} (to connect to Lit Contracts)`]
    );
  }

  async connectToLitContracts(): Promise<this> {

    return this._run(
      'LitContracts connection',
      FN.connectToLitContracts,
      async () => {

        if (this.signer) {
          this.signer = this.signer.connect(new ethers.providers.JsonRpcProvider(this.rpc));
          this._debug(`Signer connected: ${this.rpc}`)
          this._debug(`Signer address:   ${await this.signer.getAddress()}`);
          this._debug(`Signer balance:   ${ethers.utils.formatEther(await this.signer.getBalance())} ETH`);
        }

        this.litContracts = new LitContracts({
          debug: this.litDebug,
          network: this.network,
          signer: this.signer,
          rpc: this.rpc
        });

        await this.litContracts.connect();

        this.outputs.set(FN.connectToLitContracts, this.litContracts);

        return this;
      },
      [
        `${FN.mintPKP} (to mint a PKP - Tip: Pass in { selfFund: true } to fund the PKP).`,
        `${FN.getPkps} (to get all PKPs)`
      ]
    )
  }

  async mintPKP(params: { selfFund?: boolean, amountInEth?: string }): Promise<this> {
    return this._run(
      'Mint PKP',
      FN.mintPKP,
      async () => {

        const _selfFund = params.selfFund || false;
        const _amountInEth = params.amountInEth || '0.001';

        const res = await this.litContracts.pkpNftContractUtils.write.mint();

        const explorerUrl = METAMASK_CHAIN_INFO_BY_NETWORK[this.network].blockExplorerUrls[0]
        const hashOnExplorer = `${explorerUrl}tx/${res.tx.hash}`;
        const hexPrefixedPublicKey = `0x${res.pkp.publicKey}`;
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

        this.outputs.set(FN.mintPKP, {
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
        });

        return this;
      },
      [`END OF THE ROAD. You need to fund your PKP to use it.`]
    )
  }
}