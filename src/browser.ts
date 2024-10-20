// // -- Request user to connect their wallet and switch network if needed
// const provider = new providers.Web3Provider((window as any).ethereum);
// await provider.send("eth_requestAccounts", []);

// // Check current network and switch if necessary
// const network = await provider.getNetwork();
// if (network.chainId !== METAMASK_CHAIN_INFO_BY_NETWORK[params.SELECTED_NETWORK].chainId) {
//   try {
//     await provider.send("wallet_switchEthereumChain", [{ chainId: ethers.utils.hexValue(METAMASK_CHAIN_INFO_BY_NETWORK[params.SELECTED_NETWORK].chainId) }]);
//   } catch (switchError: any) {
//     // This error code indicates that the chain has not been added to MetaMask
//     if (switchError.code === 4902) {
//       await provider.send("wallet_addEthereumChain", [METAMASK_CHAIN_INFO_BY_NETWORK[params.SELECTED_NETWORK]]);
//     } else {
//       throw switchError;
//     }
//   }
// }

// const signer = provider.getSigner();
// const address = await signer.getAddress();
// console.log(`   ✅ Wallet connected: ${address}`);
// console.log(`     - Network: ${await provider.getNetwork()}`);
// console.log(`     - Address: ${address}`);
// console.log(`     - Balance: ${ethers.utils.formatEther(await signer.getBalance())} ETH`);