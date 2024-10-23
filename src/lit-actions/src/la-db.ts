import { handleDB } from "./sdk-orbis";
import { genEncryptedPrivateKey } from "./util";

// --------- Global Variables ---------
export type KeyManagementParams = KeyRegisterParams | KeyReadParams | KeyUpdateParams;

export type KeyRegisterParams = {
  pkpPublicKey: string;
  operation: 'register';
}

export type KeyReadParams = {
  pkpPublicKey: string;
  operation: 'read';
}

export type KeyUpdateParams = {
  pkpPublicKey: string;
  operation: 'update';
  docId: string;
  data: JSON | string;
}

declare var params: KeyManagementParams;

if ('data' in params) {
  params.data = typeof params.data !== 'undefined' ? (typeof params.data === 'string' ? params.data : JSON.stringify(params.data)) : '';
}

if ('pkpPublicKey' in params) {
  params.pkpPublicKey = params.pkpPublicKey.startsWith('0x') ? params.pkpPublicKey : `0x${params.pkpPublicKey}`;
}

(async () => {
  const res = await Lit.Actions.runOnce({
    waitForResponse: true,
    name: 'db-bro'
  }, async () => {


    if (params.operation === 'register') {
      // The PKP owns the encrypted private key
      const privateKeyOwnerAddress = ethers.utils.computeAddress(params.pkpPublicKey);
      const { publicData, privateData } = await genEncryptedPrivateKey(privateKeyOwnerAddress);

      const { id } = await handleDB({
        privateKey: privateData.privateKey,
        operation: "write",
        data: {
          ownerAddress: privateKeyOwnerAddress,
          metadata: JSON.stringify(publicData)
        }
      });

      return JSON.stringify({
        id,
        publicData,
        ownerAddress: privateKeyOwnerAddress,
      });
    }

    if (params.operation === 'read') {
      const privateKeyOwnerAddress = ethers.utils.computeAddress(params.pkpPublicKey);
      const wallet = ethers.Wallet.createRandom();

      const res = await handleDB({
        privateKey: wallet.privateKey.toString(),
        operation: "read",
        data: {
          ownerAddress: privateKeyOwnerAddress,
        }
      });

      const allMetadata = res.rows.map((row) => {
        const metadata = JSON.parse(row.metadata);
        return {
          ...metadata,
          address: ethers.utils.computeAddress(metadata.publicKey)
        }
      });

      // TODO: 
      // first one ever written
      const firstMetadata = allMetadata[0];

      // decrypt
      const decryptRes = await Lit.Actions.decryptToSingleNode({
        accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        chain: 'ethereum',
        authSig: null,
      });

      return JSON.stringify(firstMetadata);
    }

    // if(params.operation === 'use'){

    // }
  });

  Lit.Actions.setResponse({
    response: JSON.stringify({
      success: true,
      message: res,
    })
  });
})();
