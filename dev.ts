// import { grantCustomAuthUserAccessToken } from "./src/flows/grantCustomAuthUserAccessToken";

import { ethers } from "ethers";
import { Bulkie } from "./src/bulkie";
import { detectedNetwork } from "./dev-utils";
import { LIT_NETWORKS_KEYS } from "@lit-protocol/types";
import { BulkieUtils } from "./src/utils";
import { code, code as foocode } from "./src/lit-actions/dist/foo";
import { code as ladbCode } from "./src/lit-actions/dist/la-db";
import fs from 'fs';
import { KeyManagementParams, KeyReadParams, KeyRegisterParams, KeyUpdateParams, KeyUseParams } from "./src/lit-actions/src/la-db";

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
  //   .then((client) => client.mintPKP({ selfFund: true, amountInEth: "0.0001" }))
  //   .then((client) => client.mintCreditsNFT({
  //     requestsPerKilosecond: 200,
  //     daysUntilUTCMidnightExpiration: 2
  //   }))
  //   .then((client) => client.createCreditsDelegationToken({
  //     creditsTokenId: client.getOutput('mintCreditsNFT')!
  //   }))
  //   .then((client) => client.grantAuthMethodToUsePKP({
  //     pkpTokenId: client.getOutput('mintPKP')?.tokenId.hex!,
  //     authMethodId: 'app-id-xxx:user-id-yyy',
  //     authMethodType: 918232,
  //     scopes: ['sign_anything']
  //   }));

  // const litActionCode = `(async () => {
  //   LitActions.setResponse({ response: "true" });  
  // })();`;

  // const ipfsCid = await BulkieUtils.strToIPFSHash(litActionCode);

  // await alice.grantIPFSCIDtoUsePKP({
  //   pkpTokenId: alice.getOutput('mintPKP')?.tokenId.hex!,
  //   ipfsCid: ipfsCid,
  //   scopes: ['sign_anything']
  // });

  // await alice.createAccessToken({
  //   // expires in 7 days
  //   expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  //   type: 'custom_auth',
  //   pkpPublicKey: alice.getOutput('mintPKP')?.publicKey as `0x${string}`,
  //   creditsDelegationToken: alice.getOutput('createCreditsDelegationToken'),
  //   resources: [
  //     { type: 'pkp-signing', request: '*' },
  //     { type: 'lit-action-execution', request: '*' },
  //   ],
  //   code: litActionCode,
  //   jsParams: {
  //     pkpPublicKey: alice.getOutput('mintPKP')?.publicKey as `0x${string}`,
  //     rpcUrl: 'https://yellowstone-rpc.litprotocol.com',
  //     magicNumber: 3,
  //   },
  // });

  // ----- Persist data
  // fs.writeFileSync('mintPKP.json', JSON.stringify(alice.getOutput('mintPKP'), null, 2));
  // fs.writeFileSync('accessToken.json', JSON.stringify(alice.getOutput('createAccessToken'), null, 2));
  // process.exit();
  // ----- Use persisted data
  const accessToken = JSON.parse(fs.readFileSync('accessToken.json', 'utf8'));
  const mintPKP = JSON.parse(fs.readFileSync('mintPKP.json', 'utf8'));

  // --------- access token usage ---------

  await alice.use(accessToken).toRun('orbisdb/key-management/read', {
    pkpPublicKey: mintPKP.publicKey
  });

  // const res: any = alice.getOutput('toExecuteJs');

  // function parseResponse(res: any) {
  //   return JSON.parse(JSON.parse(res?.response!).message);
  // }

  // const res2 = JSON.parse(res.response);
  // const verified = ethers.utils.verifyMessage("TESTING", res2.message.signature);
  // console.log("verified:", verified);

  // { "ciphertext": "k1LNkhL/g8gAFs4O3adPHFIhxFlHiSl1bSWtBwB9gPeCUpOjybP8jw1FetqZ8l92Az2A4c4iv1ilXX2dW7KACNxFtgpUqAkUM03WKbFyAu5Hio9eejJbX8Y4H36RYDa2PeOJrSJ33AeTP5hQd+v/lOwnwzg9wyYSVTaT5x4PLXcOGIWBcr8tVOvuvBbehvaD6D7UCT6PfCAC", "dataToEncryptHash": "f96dd4a84f1c223f213032325f0e8de51dcc5085fff65606b8a475dd3e365b7f", "keyType": "K256", "publicKey": "0x0431e5ab51e9b721bdbfe957aac2b94d31ef3a58c4a9c929283cbf3518f3dc63be68b10133c34a43b2403d290d9cc5b31df8f52e26872e3c484fafc6b7fb793bec", "accs": [{ "contractAddress": "", "standardContractType": "", "chain": "ethereum", "method": "", "parameters": [":userAddress"], "returnValueTest": { "comparator": "=", "value": "0x3A2654A300F8EA574F59630b510d9D5609b10D5B" } }] }

  // const message = parseDBResponse(res);
  // const message = parseResponse(res);
  // console.log("toExecuteJs:", alice.getOutput('toExecuteJs'));
  // console.log("res:", res);
  process.exit();
  // await alice.use(accessToken!).toPkpSign({
  //   publicKey: alice.getOutput('mintPKP')?.publicKey!,
  //   message: 'hello',
  // })

  // console.log("toPkpSign:", alice.getOutput('toPkpSign'));

  // await alice.use(accessToken!).toRun('wrapped-keys/generate-private-key', {
  //   chain: 'evm',
  //   memo: 'hello',
  // });

  // console.log(alice.getOutput('wrapped-keys/generate-private-key'));

  // await alice.use(accessToken!).toRun("QmZZ6Zqfo7hCLXzGZQUzSxCRvg3G6qFFWSQT4rqfnCDxti", {});

  // console.log(alice.getOutput("QmZZ6Zqfo7hCLXzGZQUzSxCRvg3G6qFFWSQT4rqfnCDxti"))

  // await alice.use(accessToken!).toRun('wrapped-keys/generate-private-key', {
  //   chain: 'solana',
  //   memo: 'solana-memo'
  // });

  // console.log(alice.getOutput('wrapped-keys/generate-private-key'));

  // --------- External Integrations ---------
  // alice.usePlugin('db')


})();
