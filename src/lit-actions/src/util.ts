// {
//   publicData: {
//     ciphertext: "sRfc9+j3x/ln4/jmYDihjKKxWfixmns6UaFxuZXDV3ivWZt771VEgsjJSYoKB+s708FIb5alHKIeU7D2fc+zZ/z3pQijhnVg8uWlUrbnGBpHyhjkRXozifZKrajX8jpZBRN31VtTocUFyQvR7TlHHuXI6ojaiKxbYP9Lpuc+cSllTPHmJZhiA+W3atQSVa8ly61wtQH0G10C",
//     dataToEncryptHash: "1c3d3ffed83ad057d51360e771f56e52e70d86363a159595d1e601a2cb1c5f1d",
//     keyType: "K256",
//     publicKey: "0x04068c15f31c625a3ca7c8accc9f7d4290dcd2092e44839828d76d3bd69df5f49dc645ad42beea40653defc6ed5459178428f668f1c0ea832f19cab068d4cb368d",
//     accs: []
//   },
//   privateData: {
//     privateKey: "0x..."
//   }
// }
export async function genEncryptedPrivateKey(accAddress: string): Promise<{
  publicData: {
    ciphertext: string;
    dataToEncryptHash: string;
    keyType: 'K256';
    publicKey: `0x${string}`;
    accs: any[];
  };
  privateData: {
    privateKey: string;
  };
}> {
  const wallet = ethers.Wallet.createRandom();
  const keypair = {
    privateKey: wallet.privateKey.toString(),
    publicKey: wallet.publicKey,
  };

  const accs = [{
    contractAddress: '',
    standardContractType: '',
    chain: 'ethereum',
    method: '',
    parameters: [':userAddress'],
    returnValueTest: {
      comparator: '=',
      value: accAddress,
    },
  }];

  // -- encrypt the keypair
  const { ciphertext, dataToEncryptHash } = await Lit.Actions.encrypt({
    accessControlConditions: accs,
    to_encrypt: new TextEncoder().encode(`lit_${keypair.privateKey}`),
  });

  return {
    publicData: {
      ciphertext,
      dataToEncryptHash,
      keyType: 'K256',
      publicKey: keypair.publicKey,
      accs
    },
    privateData: {
      privateKey: keypair.privateKey,
    }
  }
}