import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Bulkie, BulkieBrowser, DEPENDENCIES_MAP, FN } from 'bulkie.js';

type DependenciesMap = {
  [key in keyof typeof FN]: {
    id: key;
    action: () => Promise<any>;
    dependencies: (keyof typeof FN)[];
  };
};

const BulkieSDKDashboard: React.FC = () => {
  const [signer, setSigner] = useState<any>(null);
  const [alice, setAlice] = useState<any>(null);
  const [completedFunctions, setCompletedFunctions] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<string>('');

  const functionMap: DependenciesMap = {
    'connectToLitNodeClient': {
      id: 'connectToLitNodeClient',
      action: _connectToLitNodeClient,
      dependencies: DEPENDENCIES_MAP['connectToLitNodeClient'],
    },
    'connectToLitContracts': {
      id: 'connectToLitContracts',
      action: _connectToLitContracts,
      dependencies: DEPENDENCIES_MAP['connectToLitContracts'],
    },
    'mintPKP': {
      id: 'mintPKP',
      action: mintPKP,
      dependencies: DEPENDENCIES_MAP['mintPKP'],
    },
    'mintCreditsNFT': {
      id: 'mintCreditsNFT',
      action: mintCredits,
      dependencies: DEPENDENCIES_MAP['mintCreditsNFT'],
    },
    'createCreditsDelegationToken': {
      id: 'createCreditsDelegationToken',
      action: createDelegation,
      dependencies: DEPENDENCIES_MAP['createCreditsDelegationToken'],
    },
    'grantAuthMethodToUsePKP': {
      id: 'grantAuthMethodToUsePKP',
      action: grantAuth,
      dependencies: DEPENDENCIES_MAP['grantAuthMethodToUsePKP'],
    },
    // Add additional entries based on your DEPENDENCIES_MAP
  };

  useEffect(() => {
    renderFunctions();
  }, [completedFunctions]);

  const areDependenciesMet = (dependencies: Array<keyof DependenciesMap>) =>
    dependencies.every(dep => completedFunctions.has(functionMap[dep].id));

  const renderFunctions = () => {
    return Object.values(functionMap).map((func, key) => (
      <button
        key={func.id}
        id={func.id}
        className={`step ${areDependenciesMet(func.dependencies) ? '' : 'disabled'}`}
        disabled={!areDependenciesMet(func.dependencies)}
        onClick={async () => {
          await func.action();
          setCompletedFunctions(prev => new Set(prev.add(func.id)));
        }}
      >
        {func.id}
      </button>
    ));
  };

  const showStatus = (message: string, type: string) => {
    setStatusMessage(message);
    setStatusType(type);
  };

  async function _connectToLitNodeClient() {
    try {
      setStatusMessage("Connecting to Lit Node Client...", "active");
      const signer = await BulkieBrowser.getSigner();
      const aliceInstance = new Bulkie({
        debug: true,
        guides: true,
        litDebug: true,
        signer,
        network: "datil",
      });
      await aliceInstance.connectToLitNodeClient();
      setSigner(signer);
      setAlice(aliceInstance);
      showStatus("Lit Node Client connected!", "success");
    } catch (error: any) {
      console.error("Error:", error);
      showStatus(error.message || "Failed to connect to Lit Node Client", "error");
    }
  }

  async function _connectToLitContracts() {
    if (!alice) return showStatus("Please connect to Lit Node Client first", "error");
    try {
      showStatus("Connecting to Lit Contracts...", "active");
      await alice.connectToLitContracts();
      showStatus("Lit Contracts connected!", "success");
    } catch (error: any) {
      console.error("Error:", error);
      showStatus(error.message || "Failed to connect to Lit Contracts", "error");
    }
  }

  async function mintPKP() {
    if (!alice) return showStatus("Please connect to Lit Node Client first", "error");
    try {
      showStatus("Minting PKP...", "active");
      await alice.mintPKP({ selfFund: true, amountInEth: "0.0001", cache: true });
      showStatus("PKP minted successfully!", "success");
    } catch (error: any) {
      console.error("Error:", error);
      showStatus(error.message || "Failed to mint PKP", "error");
    }
  }

  async function mintCredits() {
    if (!alice?.getOutput("mintPKP")) return showStatus("Please mint PKP first", "error");
    try {
      showStatus("Minting Credits...", "active");
      await alice.mintCreditsNFT({
        requestsPerKilosecond: 200,
        daysUntilUTCMidnightExpiration: 2,
      });
      showStatus("Credits minted successfully!", "success");
    } catch (error: any) {
      console.error("Error:", error);
      showStatus(error.message || "Failed to mint credits", "error");
    }
  }

  async function createDelegation() {
    if (!alice?.getOutput("mintCreditsNFT")) return showStatus("Please mint credits first", "error");
    try {
      showStatus("Creating Delegation...", "active");
      await alice.createCreditsDelegationToken({
        creditsTokenId: alice.getOutput("mintCreditsNFT"),
      });
      showStatus("Delegation created successfully!", "success");
    } catch (error: any) {
      console.error("Error:", error);
      showStatus(error.message || "Failed to create delegation", "error");
    }
  }

  async function grantAuth() {
    if (!alice?.getOutput("createCreditsDelegationToken")) return showStatus("Please create delegation first", "error");
    try {
      showStatus("Granting Auth Method...", "active");
      await alice.grantAuthMethodToUsePKP({
        pkpTokenId: alice.getOutput("mintPKP")?.tokenId.hex,
        authMethodId: "app-id-xxx:user-id-yyy",
        authMethodType: 918232,
        scopes: ["sign_anything"],
      });
      showStatus("Auth method granted successfully!", "success");
    } catch (error: any) {
      console.error("Error:", error);
      showStatus(error.message || "Failed to grant auth method", "error");
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Bulkie SDK</h1>
        <p>Initialize and manage your Lit Protocol integration</p>
      </header>

      <div className="card">
        <div id="functions-container" className="functions">
          {renderFunctions()}
        </div>
        <div id="status" className={`status ${statusType}`}>
          {statusMessage}
        </div>
      </div>
    </div>
  );
};

export default BulkieSDKDashboard;
