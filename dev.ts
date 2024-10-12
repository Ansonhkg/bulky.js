import { ethers } from "ethers";
import { Bulkie } from "./src/bulkie";
import { FN } from "./src/types";

(async () => {
  // create a signer
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string);

  const alice = new Bulkie({
    guides: true,
    debug: true,
    network: 'datil',
    signer: signer,
  });

  await alice.connectToLitNodeClient();
  await alice.connectToLitContracts();
  await alice.mintPKP({ selfFund: true, amountInEth: "0.0001" });

  // freshly minted pkp from output
  const mintedPKP = alice.getOutput(FN.mintPKP);

  await alice.grantAuthMethodToUsePKP({
    pkpTokenId: mintedPKP?.tokenId.hex!,
    authMethodId: 'app-id-xxx:user-id-yyy',
    authMethodType: 918232,
    scopes: ['sign_anything']
  });


  // this require longer loading time, because it needs to fetch all pkps
  // const pkps = await alice.getPkps();
  // console.log(pkps);

  // console.log(pkp);

  console.log(`Total Execution Time: ${alice.getTotalExecutionTime().ms}ms or ${alice.getTotalExecutionTime().s}s`);
  process.exit();
})();
