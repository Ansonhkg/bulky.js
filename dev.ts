import { ethers } from "ethers";
import { Bulkie } from "./src/bulkie";
import { FN } from "./src/types";
import { BulkieUtils } from "./src/utils";

console.warn = () => { };

(async () => {
  // create a signer
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string);

  const alice = new Bulkie({
    guides: true,
    debug: true,
    litDebug: false,
    network: 'datil',
    signer: signer,
  });

  /**
   * The theFlowToInitialiseAndGrantPKP function orchestrates the process of connecting to the Lit Node Client,
   * minting a PKP, creating a Credits NFT, generating a Credits Delegation Token, and 
   * granting an authentication method to use the PKP.
   *
   * This function performs the following steps:
   * 1. Connects to the Lit Node Client.
   * 2. Connects to the Lit Contracts.
   * 3. Mints a PKP with a specified amount of Ether.
   * 4. Mints a Credits NFT with defined request limits and expiration.
   * 5. Creates a Credits Delegation Token using the minted Credits NFT.
   * 6. Grants an auth method to use the PKP with specified parameters.
   *
   * WHEN to use this:
   * This function is intended for dApp owners who need to grant authentication methods to their users,
   * allowing them to utilise the PKP for secure transactions and interactions within the application.
   */
  async function theFlowToInitialiseAndGrantPKP() {
    await alice.connectToLitNodeClient()
      .then((client) => client.connectToLitContracts())
      .then((client) => client.mintPKP({ selfFund: true, amountInEth: "0.0001" }))
    // .then((client) => client.mintCreditsNFT({
    //   requestsPerKilosecond: 200,
    //   daysUntilUTCMidnightExpiration: 2
    // }))
    // .then((client) => client.createCreditsDelegationToken({
    //   creditsTokenId: client.getOutput('mintCreditsNFT')!
    // }))
    // .then((client) => client.grantAuthMethodToUsePKP({
    //   pkpTokenId: client.getOutput('mintPKP')?.tokenId.hex!,
    //   authMethodId: 'app-id-xxx:user-id-yyy',
    //   authMethodType: 918232,
    //   scopes: ['sign_anything']
    // }));
  }

  await theFlowToInitialiseAndGrantPKP();
  process.exit();

  const litActionCode = `(async () => {
    const jsParams = {
      magicNumber: magicNumber,
      pkpPublicKey: pkpPublicKey,
      // privateKey: privateKey,
      // amountInEth: amountInEth,
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

  // Maybe we should add a `permissions` field for access token?
  await alice.createAccessToken({
    type: 'custom_auth',
    pkpPublicKey: alice.getOutput(FN.mintPKP)?.publicKey as `0x${string}`,
    creditsDelegationToken: alice.getOutput(FN.createCreditsDelegationToken),
    resources: [
      { type: 'pkp-signing', request: '*' },
      { type: 'lit-action-execution', request: '*' },
    ],
    permissions: {
      grantIPFSCIDtoUsePKP: {
        scopes: ['sign_anything']
      },
    },
    code: litActionCode,
    // ipfsCid: ipfsCid,
    jsParams: {
      pkpPublicKey: alice.getOutput(FN.mintPKP)?.publicKey as `0x${string}`,
      rpcUrl: 'https://yellowstone-rpc.litprotocol.com',
      magicNumber: 3,
      // privateKey: process.env.PRIVATE_KEY as string,
      // amountInEth: "0.00001",
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

  // this require longer loading time, because it needs to fetch all pkps
  // const pkps = await alice.getPkps();
  // console.log(pkps);

  // console.log(pkp);

  console.log(`Total Execution Time: ${alice.getTotalExecutionTime().ms}ms or ${alice.getTotalExecutionTime().s}s`);
  process.exit();
})();
