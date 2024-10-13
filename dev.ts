import { ethers } from "ethers";
import { Bulkie, BulkieUtils } from "./src/bulkie";
import { FN, IPFSCIDv0 } from "./src/types";

console.warn = () => { };

(async () => {
  // create a signer
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string);

  const alice = new Bulkie({
    guides: true,
    debug: true,
    litDebug: true,
    network: 'datil',
    signer: signer,
  });

  await alice.connectToLitNodeClient();
  await alice.connectToLitContracts();
  await alice.mintPKP({ selfFund: true, amountInEth: "0.0001" });

  // await alice.grantAuthMethodToUsePKP({
  //   pkpTokenId: alice.getOutput(FN.mintPKP)?.tokenId.hex!,
  //   authMethodId: 'app-id-xxx:user-id-yyy',
  //   authMethodType: 918232,
  //   scopes: ['sign_anything']
  // });

  const litActionCode = `(async () => {

    const jsParams = {
      magicNumber: magicNumber
    };

    const a = 1;
    const b = 2;
    console.log("Lit.Auth:", Lit.Auth);

    const res = await Lit.Actions.runOnce(
      { waitForResponse: true, name: 'bulkie-testing' },
      async () => {
        return JSON.stringify({ MO: 'FO' });
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

  await alice.getLoginToken({
    pkpPublicKey: alice.getOutput(FN.mintPKP)?.publicKey as `0x${string}`,
    type: 'custom_auth',
    resources: [
      { type: 'pkp-signing', request: '*' },
      { type: 'lit-action-execution', request: '*' }
    ],
    code: litActionCode,
    // ipfsCid: ipfsCid,
    jsParams: {
      // pkpPublicKey: alice.getOutput(FN.mintPKP)?.publicKey as `0x${string}`,
      magicNumber: 3,
    },
  });


  const loginToken = alice.getOutput(FN.getLoginToken);
  console.log("loginToken:", loginToken);

  const parsedAuthContext = BulkieUtils.parseAuthContext(loginToken!);
  console.log("parsedAuthContext:", parsedAuthContext);

  // const litNodeClient = alice.getOutput(FN.connectToLitNodeClient);

  // console.log("litNodeClient:", litNodeClient);

  // const res = await litNodeClient?.executeJs({
  //   sessionSigs: loginToken!,
  //   code: `(async () => {
  //     console.log("Lit.Auth:", Lit.Auth);
  //   })();`,
  // })

  // console.log("res:", res);

  // this require longer loading time, because it needs to fetch all pkps
  // const pkps = await alice.getPkps();
  // console.log(pkps);

  // console.log(pkp);

  console.log(`Total Execution Time: ${alice.getTotalExecutionTime().ms}ms or ${alice.getTotalExecutionTime().s}s`);
  process.exit();
})();
