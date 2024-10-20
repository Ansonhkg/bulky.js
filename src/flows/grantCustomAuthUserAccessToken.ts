import { ethers } from "ethers";
import { Bulkie } from '../bulkie';
import { BulkieUtils } from "../utils";
import { FN } from "../types";
import { LIT_NETWORKS_KEYS } from "@lit-protocol/types";


export function isEnv(env: 'browser' | 'node'): boolean {
  if (env === 'browser' && typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return true;
  } else if (env === 'node' && typeof process !== 'undefined' && process.versions && process.versions.node) {
    return true;
  }
  return false;
}

export const detectedNetwork = () => isEnv('node') && process.env.NETWORK ? process.env.NETWORK : 'datil';

/**
 * Orchestrates the process of connecting to the Lit Node Client,
 * minting a PKP, creating a Credits NFT, generating a Credits Delegation Token, and 
 * granting an authentication method to use the PKP.
 *
 * WHEN to use this:
 * This function is intended for dApp owners who need to grant authentication methods to their users,
 * allowing them to utilise the PKP for secure transactions and interactions within the application.
 */
export async function grantCustomAuthUserAccessToken() {

  // create a signer
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string);

  const alice = new Bulkie({
    guides: true,
    debug: true,
    litDebug: true,
    network: detectedNetwork() as LIT_NETWORKS_KEYS,
    signer: signer,
  });


  // 1. As an app owner, we need to connect to the Lit Node Client, connect to the Lit Contracts, mint a PKP, mint a Credits NFT, create a Credits Delegation Token, and grant an authentication method to use the PKP.
  await alice.connectToLitNodeClient()
    .then((client) => client.connectToLitContracts())
    .then((client) => client.mintPKP({ selfFund: true, amountInEth: "0.0001" }))
    .then((client) => client.mintCreditsNFT({
      requestsPerKilosecond: 200,
      daysUntilUTCMidnightExpiration: 2
    }))
    .then((client) => client.createCreditsDelegationToken({
      creditsTokenId: client.getOutput('mintCreditsNFT')!
    }))
    .then((client) => client.grantAuthMethodToUsePKP({
      pkpTokenId: client.getOutput('mintPKP')?.tokenId.hex!,
      authMethodId: 'app-id-xxx:user-id-yyy',
      authMethodType: 918232,
      scopes: ['sign_anything']
    }));

  // 2. We then create a Lit Action Code that will be executed by the user by providing the app owner published PKP
  // If the user passes the authorisation from the Lit Action Code, like a check if the user's auth method has been granted to use the PKP, the user will be able to generate a Lit access token.
  const litActionCode = `(async () => {
        const jsParams = {
          magicNumber: magicNumber,
          pkpPublicKey: pkpPublicKey,
          rpcUrl: rpcUrl,
        };
    
        const a = 1;
        const b = 2;
    
        const res = await Lit.Actions.runOnce(
          { waitForResponse: true, name: '002-bulkie-testing' },
          async () => {
            const provider = new ethers.providers.JsonRpcProvider(jsParams.rpcUrl);
            const wallet = ethers.Wallet.createRandom().connect(provider);
            
            // const wallet = new ethers.Wallet(jsParams.privateKey, provider);
    
            // const tx = await wallet.sendTransaction({
            //   to: wallet.address,
            //   value: ethers.utils.parseEther(jsParams.amountInEth),
            // });
    
            // await tx.wait();
    
            return JSON.stringify({ 
              MO: 'FO',
              privateKey: wallet.privateKey,
            });
          }
        );
    
        if(a + b === jsParams.magicNumber){
          Lit.Actions.setResponse({
            response: JSON.stringify(\`(true, $\{res}\)\`),
          });
        }else{
          LitActions.setResponse({ response: "false" });  
        }
      })()`;

  const ipfsCid = await BulkieUtils.strToIPFSHash(litActionCode);

  await alice.grantIPFSCIDtoUsePKP({
    pkpTokenId: alice.getOutput(FN.mintPKP)?.tokenId.hex!,
    ipfsCid: ipfsCid,
    scopes: ['sign_anything']
  });

  // 3. Now, Bob can create an access token to use the PKP
  // just imagine we instantiate a new Bulkie instance, we are just reusing the same instance
  const bob = alice;
  await bob.createAccessToken({
    type: 'custom_auth',
    pkpPublicKey: alice.getOutput(FN.mintPKP)?.publicKey as `0x${string}`,
    creditsDelegationToken: alice.getOutput(FN.createCreditsDelegationToken),
    resources: [
      { type: 'pkp-signing', request: '*' },
      { type: 'lit-action-execution', request: '*' },
    ],
    code: litActionCode,
    // ipfsCid: ipfsCid,
    jsParams: {
      pkpPublicKey: alice.getOutput(FN.mintPKP)?.publicKey as `0x${string}`,
      rpcUrl: 'https://yellowstone-rpc.litprotocol.com',
      magicNumber: 3,
    },
  });

  const accessToken = alice.getOutput(FN.createAccessToken);

  const litNodeClient = alice.getOutput(FN.connectToLitNodeClient);

  const res = await litNodeClient?.executeJs({
    sessionSigs: accessToken!,
    code: `(async () => {
        console.log("Testing");
      })();`,
  })

  console.log("res:", res);

  console.log(`Total Execution Time: ${alice.getTotalExecutionTime().ms}ms or ${alice.getTotalExecutionTime().s}s`);
}