// import { grantCustomAuthUserAccessToken } from "./src/flows/grantCustomAuthUserAccessToken";

import { ethers } from "ethers";
import { Bulkie } from "./src/bulkie";
import { detectedNetwork } from "./dev-utils";
import { LIT_NETWORKS_KEYS } from "@lit-protocol/types";
import { BulkieUtils } from "./src/utils";
import { code as foocode } from "./src/lit-actions/dist/foo";

(async () => {
  // await grantCustomAuthUserAccessToken();

  // create a signer
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string);

  const alice = new Bulkie({
    guides: true,
    debug: true,
    litDebug: false,
    network: detectedNetwork() as LIT_NETWORKS_KEYS,
    signer: signer,
  });

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

  const litActionCode = `(async () => {
    LitActions.setResponse({ response: "true" });  
  })();`;

  const ipfsCid = await BulkieUtils.strToIPFSHash(litActionCode);

  await alice.grantIPFSCIDtoUsePKP({
    pkpTokenId: alice.getOutput('mintPKP')?.tokenId.hex!,
    ipfsCid: ipfsCid,
    scopes: ['sign_anything']
  });

  await alice.createAccessToken({
    type: 'custom_auth',
    pkpPublicKey: alice.getOutput('mintPKP')?.publicKey as `0x${string}`,
    creditsDelegationToken: alice.getOutput('createCreditsDelegationToken'),
    resources: [
      { type: 'pkp-signing', request: '*' },
      { type: 'lit-action-execution', request: '*' },
    ],
    code: litActionCode,
    jsParams: {
      pkpPublicKey: alice.getOutput('mintPKP')?.publicKey as `0x${string}`,
      rpcUrl: 'https://yellowstone-rpc.litprotocol.com',
      magicNumber: 3,
    },
  });

  const accessToken = alice.getOutput('createAccessToken');

  // write the access token to a file
  // const fs = require('fs');
  // fs.writeFileSync('accessToken.json', JSON.stringify(accessToken, null, 2));

  // read the access token from the file and parse it as a JSON object
  // const accessToken = JSON.parse(fs.readFileSync('accessToken.json', 'utf8'));

  // --------- access token usage ---------
  await alice.use(accessToken!).toGeneratePrivateKey({
    chain: 'evm',
    memo: 'evm-bulkie-key',
  });

  await alice.use(accessToken!).toGeneratePrivateKey({
    chain: 'solana',
    memo: 'solana-bulkie-key',
  });

  console.log("evmPrivateKey:", alice.getOutput('toGeneratePrivateKey'));
  console.log("solPrivateKey:", alice.getOutput('toGeneratePrivateKey'));


  await alice.use(accessToken!).toExecuteJs({
    code: `(async()=> { console.log("MAGIC NUMBER:", magicNumber) })();`,
    jsParams: {
      magicNumber: 3,
    }
  })
  console.log("toExecuteJs:", alice.getOutput('toExecuteJs'));

  await alice.use(accessToken!).toPkpSign({
    publicKey: alice.getOutput('mintPKP')?.publicKey!,
    message: 'hello',
  })

  console.log("toPkpSign:", alice.getOutput('toPkpSign'));

})();
