import { handleDB } from "./sdk-orbis";
import { genEncryptedPrivateKey } from "./util";

// --------- Global Variables ---------
export type KeyManagementParams =
  KeyRegisterParams |
  KeyReadParams |
  KeyUseParams |
  KeyUpdateParams;

export interface BaseJsParams {
  pkpPublicKey: `0x${string}` | string;
}

export type KeyRegisterParams = BaseJsParams & {
  operation: 'register';
}

export type KeyReadParams = BaseJsParams & {
  operation: 'read';
}

export type KeyUseParams = BaseJsParams & {
  operation: 'use';
  address: string;
}

export type KeyUpdateParams = BaseJsParams & {
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

      // The PKP address is set as the access control condition
      const { publicData, privateData } = await genEncryptedPrivateKey(privateKeyOwnerAddress);

      // We then write to the OrbisDB table in the columns 'owner' and 'metadata'.
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

    if (params.operation === 'read' || params.operation === 'use') {
      const allMetadata = await Helper.getStoredMetadata();
      return JSON.stringify(allMetadata);
    }
  });

  // When 'use' - we will decrypt the private key and use it to 
  // perform different actions (more to add)
  if (params.operation === 'use') {

    let allMetadata = JSON.parse(res);
    const selectedMetadata = allMetadata.find((metadata: any) => metadata.address === (params as KeyUseParams).address);

    const decryptRes = await Lit.Actions.decryptAndCombine({
      accessControlConditions: selectedMetadata.accs,
      ciphertext: selectedMetadata.ciphertext,
      dataToEncryptHash: selectedMetadata.dataToEncryptHash,
      chain: 'ethereum',
      authSig: null, // <-- Signed by the PKP on Lit Action, that's why is null.
    });

    const DONT_EXPORT_THIS_privateKey = decryptRes.replace('lit_', '');

    const wallet = new ethers.Wallet(DONT_EXPORT_THIS_privateKey);
    const signedMessage = 'HAKUNA MATATA';
    const signature = await wallet.signMessage(signedMessage);

    Lit.Actions.setResponse({
      response: JSON.stringify({
        success: true,
        message: {
          address: wallet.address,
          signature,
          signedMessage
        },
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