import { ethers } from "ethers";
import { Bulkie, FN } from "./bulkie";

(async () => {
  // create a signer
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string);

  const alice = new Bulkie({
    guides: true,
    debug: true,
    network: 'datil',
    signer: signer,
    // TODO: Add more options here
    // customRpc (This should be passed to LitNodeClient and LitContracts)
  });

  await alice.connectToLitNodeClient();
  await alice.connectToLitContracts();
  // await alice.mintPKP();

  // freshly minted pkp
  // const pkp = alice.getOutput(FN.mintPKP);

  // this require longer loading time, because it needs to fetch all pkps
  // const pkps = await alice.getPkps();
  // console.log(pkps);

  // console.log(pkp);

  console.log(`Total Execution Time: ${alice.getTotalExecutionTime().ms}ms or ${alice.getTotalExecutionTime().s}s`);
  process.exit();
})();
