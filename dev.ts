// import { grantCustomAuthUserAccessToken } from "./src/flows/grantCustomAuthUserAccessToken";

import { ethers } from "ethers";
import { Bulkie } from "./src/bulkie";
import { detectedNetwork } from "./dev-utils";
import { LIT_NETWORKS_KEYS } from "@lit-protocol/types";
import { BulkieUtils } from "./src/utils";
import { code } from "./src/lit-actions/dist/foo";

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

  console.log("accessToken:", accessToken);

  // write the access token to a file
  const fs = require('fs');
  fs.writeFileSync('accessToken.json', JSON.stringify(accessToken, null, 2));

  // read the access token from the file and parse it as a JSON object
  // const accessToken = JSON.parse(fs.readFileSync('accessToken.json', 'utf8'));

  // const evmPrivateKey = await alice.use(accessToken!).toGeneratePrivateKey({
  //   chain: 'evm',
  //   memo: 'bulkie-key',
  //   accessToken
  // });

  // const solPrivateKey = await alice.use(accessToken!).toGeneratePrivateKey({
  //   chain: 'solana',
  //   memo: 'bulkie-key',
  //   accessToken
  // });

  // console.log("evmPrivateKey:", evmPrivateKey);
  // console.log("solPrivateKey:", solPrivateKey);

  const litNodeClient = alice.getOutput('connectToLitNodeClient');


  const res = await litNodeClient?.executeJs({
    sessionSigs: accessToken!,
    code,
  });

  console.log("res:", res);

  // await alice.use(accessTokens).generatePrivateKey({
  //   network: 'evm',
  //   memo: 'bulkie-key'
  // })

})();
