import { OrbisDB } from "@useorbis/db-sdk"
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth"
import { ethers } from "ethers";

// ===== CONFIG =====
const CERAMIC_GATEWAY = "https://ceramic-orbisdb-mainnet-direct.hirenodes.io/";
const ORBIS_GATEWAY = "https://studio.useorbis.com";
const ORBIS_ENV = "did:pkh:eip155:1:0x3b5dd260598b7579a0b015a1f3bbf322adc499a1";

const TABLE = {
  "table_x": "kjzl6hvfrbw6c8at78yx3lqom5lyjr6xf1e30ydnxf3pvizmlowrz9jzoe8m0yw"
} as const;

const CONTEXT = {
  "foo": "kjzl6kcym7w8yb9a8lebuciviazv5cxrxxt4f1xki2nljn21lanveh7gleibktc",
} as const;

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

// ===== INIT =====
const db = new OrbisDB({
  ceramic: {
    gateway: CERAMIC_GATEWAY
  },
  nodes: [
    {
      gateway: ORBIS_GATEWAY,
      env: ORBIS_ENV,
    }
  ]
});

const signer = new ethers.Wallet(PRIVATE_KEY);

// @ts-ignore
const auth = new OrbisEVMAuth(signer)

const authResult = await db.connectUser({ auth, saveSession: false })

console.log(authResult);

const connected = await db.isUserConnected();

if (!connected) {
  throw new Error("User not connected");
}

// console.log(connected);

// const readRes = await db.select().from(TABLE.test).limit(10).run();

// console.log(readRes);

const writeRes = await db.insert(TABLE.table_x).value({
  foo: "xx",
}).context(CONTEXT.foo).run();

console.log(writeRes);