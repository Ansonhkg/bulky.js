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

  await alice.connectToLitNodeClient()
    .then((client) => client.connectToLitContracts())
    .then((client) => client.mintPKP({ selfFund: true, amountInEth: "0.0001" }))
    .then((client) => client.mintCreditsToken({
      requestsPerKilosecond: 200,
      daysUntilUTCMidnightExpiration: 2
    }))
    .then((client) => client.createCreditsDelegationToken({
      creditsTokenId: client.getOutput(FN.mintCreditsToken)!
    }))
    .then((client) => client.grantAuthMethodToUsePKP({
      pkpTokenId: client.getOutput(FN.mintPKP)?.tokenId.hex!,
      authMethodId: 'app-id-xxx:user-id-yyy',
      authMethodType: 918232,
      scopes: ['sign_anything']
    }));

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

  // const ipfsCid = await BulkieUtils.strToIPFSHash(litActionCode);

  // await alice.grantIPFSCIDtoUsePKP({
  //   pkpTokenId: alice.getOutput(FN.mintPKP)?.tokenId.hex!,
  //   ipfsCid: ipfsCid,
  //   scopes: ['sign_anything']
  // });

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

  // base64 encoded access token
  const base64AccessToken = Buffer.from(JSON.stringify(accessToken)).toString('base64');

  // write to file
  const fs = require('fs');
  fs.writeFileSync('access-token.json', JSON.stringify(accessToken, null, 2));
  fs.writeFileSync('access-token-base64.json', JSON.stringify(base64AccessToken, null, 2));

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
