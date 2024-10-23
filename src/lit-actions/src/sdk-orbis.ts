import { CeramicDocument, OrbisDB } from "@useorbis/db-sdk"
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";

type KeyManagementRequest = { ownerAddress: string, metadata?: string };

export class DB {
  private _CERAMIC_GATEWAY = "https://ceramic-orbisdb-mainnet-direct.hirenodes.io/";
  private _ORBIS_GATEWAY = "https://studio.useorbis.com";
  private _ORBIS_ENV = `did:pkh:eip155:1:0x3b5dd260598b7579a0b015a1f3bbf322adc499a1`;

  private _CONTEXT = {
    "foo": "kjzl6kcym7w8yb9a8lebuciviazv5cxrxxt4f1xki2nljn21lanveh7gleibktc",
    "Bulkie": "kjzl6kcym7w8y924czxug1jh44yznwt8zp3bgyffhw9mklmtplj0ain6xv0z568",
  } as const;

  private _TABLE = {
    "table_x": "kjzl6hvfrbw6c8at78yx3lqom5lyjr6xf1e30ydnxf3pvizmlowrz9jzoe8m0yw",
    "key_management": "kjzl6hvfrbw6ca1r1v0zm8y57yn2aawpuj4qvuyljchbgzk1xugplcbjuibr4qt"
  } as const;

  private _db: OrbisDB;
  private _privateKey: string;
  private _wallet: typeof ethers.Wallet;
  private _address: string;

  constructor(privateKey: string) {

    this._privateKey = privateKey;
    this._wallet = new ethers.Wallet(this._privateKey);
    this._address = this._wallet.address;

    this._db = new OrbisDB({
      ceramic: {
        gateway: this._CERAMIC_GATEWAY
      },
      nodes: [
        {
          gateway: this._ORBIS_GATEWAY,
          env: this._ORBIS_ENV,
        }
      ]
    });
  }

  async connect() {

    const auth = new OrbisEVMAuth(this._wallet)

    await this._db.connectUser({ auth, saveSession: false })

    const connected = await this._db.isUserConnected();

    if (!connected) {
      throw new Error("User not connected");
    }
  }

  async write(params: KeyManagementRequest): Promise<CeramicDocument> {
    const writeRes = await this._db.insert(this._TABLE.key_management).value({
      owner: params.ownerAddress,
      metadata: params.metadata
    }).context(this._CONTEXT.Bulkie).run();

    return writeRes;
  }

  async update(docId: string, params: KeyManagementRequest): Promise<CeramicDocument> {
    const prepare = this._db.update(docId).replace({
      owner: params.ownerAddress,
      metadata: params.metadata
    })

    const res = await prepare.run();

    if (!res) {
      throw new Error("❌ Update failed");
    }

    return res;
  }

  async read(ownerAddress: string): Promise<{
    columns: Array<string>;
    rows: Record<string, any>[];
  }> {
    const prepare = this._db.select().from(this._TABLE.key_management).where({
      // controller: this._ORBIS_ENV,
      owner: ownerAddress
    })

    const res = await prepare.run();

    return res;
  }
}

type WriteResponse = CeramicDocument;

type UpdateResponse = CeramicDocument;

type ReadResponse = {
  columns: Array<string>;
  rows: Record<string, any>[];
}

type DBOperation = 'write' | 'update' | 'read';

type DBResponseType<T extends DBOperation> =
  T extends 'write' ? WriteResponse :
  T extends 'update' ? UpdateResponse :
  T extends 'read' ? ReadResponse :
  never;

export async function handleDB<T extends DBOperation>({
  privateKey,
  operation,
  data,
  docId,
}: {
  privateKey: `0x${string}` | string;
  operation: T;
  data: KeyManagementRequest;
  docId?: string;
}): Promise<DBResponseType<T>> {
  const db = new DB(privateKey);
  await db.connect();

  try {
    if (operation === 'write') {
      return await db.write(data) as DBResponseType<T>;
    } else if (operation === 'update') {
      if (docId === undefined) {
        throw new Error("❌ docId is required for update operation");
      }
      return await db.update(docId, data) as DBResponseType<T>;
    } else {
      return await db.read(data.ownerAddress) as DBResponseType<T>;
    }
  } catch (error) {
    console.error("❌ Error in handleDB:", error);
    throw error;
  }
}
