import { handleDB } from "./sdk-orbis";
import { genEncryptedPrivateKey } from "./util";

// --------- Global Variables ---------
export type KeyManagementParams = KeyRegisterParams | KeyReadParams | KeyUseParams | KeyUpdateParams;

export type KeyRegisterParams = {
  pkpPublicKey: string;
  operation: 'register';
}

export type KeyReadParams = {
  pkpPublicKey: string;
  operation: 'read';
}

export type KeyUseParams = {
  pkpPublicKey: string;
  operation: 'use';
  address: string;
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

namespace Helper {
  export async function getStoredMetadata() {
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

    return allMetadata;
  }
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
      const allMetadata = await Helper.getStoredMetadata();
      return JSON.stringify(allMetadata);
    }

    if (params.operation === 'use') {
      const allMetadata = await Helper.getStoredMetadata();
      const selectedMetadata = allMetadata.find((metadata) => metadata.address === (params as KeyUseParams).address);
      return JSON.stringify(selectedMetadata);
    }
  });

  // Whe 'use' - we will decrypt the private key and use it to 
  // perform different actions
  if (params.operation === 'use') {
    const _data = JSON.parse(res);
    const decryptRes = await Lit.Actions.decryptAndCombine({
      accessControlConditions: _data.accs,
      ciphertext: _data.ciphertext,
      dataToEncryptHash: _data.dataToEncryptHash,
      chain: 'ethereum',
      authSig: null, // <-- Signed by the PKP on Lit Action, that's why is null.
    });

    const privateKey = decryptRes.replace('lit_', '');
    const address = ethers.utils.computeAddress(privateKey);

    const wallet = new ethers.Wallet(privateKey);
    const signature = await wallet.signMessage('TESTING');

    Lit.Actions.setResponse({
      response: JSON.stringify({
        success: true,
        message: {
          address,
          signature
        }
      })
    });
    return;
  }

  Lit.Actions.setResponse({
    response: JSON.stringify({
      success: true,
      message: res,
    })
  });
})();