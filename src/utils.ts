import Hash from "typestub-ipfs-only-hash";
import { IPFSCIDv0 } from "./types";
import { SessionSigsMap } from "@lit-protocol/types";

export namespace BulkieUtils {
  export const strToIPFSHash = async (str: string): Promise<IPFSCIDv0> => {
    return await Hash.of(Buffer.from(str)) as IPFSCIDv0;
  };

  export const parseAuthContext = (sessionSigs: SessionSigsMap) => {
    return Object.values(sessionSigs).map((v) => {
      const signedMessage = v.signedMessage;
      const urnLine = signedMessage.match(/urn:recap:[\w\d]+/)![0];

      const authContext = JSON.parse(atob(urnLine.split(':')[2])).att['lit-resolvedauthcontext://*']['Auth/Auth'][0]['auth_context'];

      const extractedCustomAuthResource = (authContext['customAuthResource']).slice(8, -2);
      const result = extractedCustomAuthResource.replace(/\\"/g, '"');

      let res: any;

      try {
        res = JSON.parse(result);
      } catch (e) {
        res = extractedCustomAuthResource
      }

      return {
        result: res,
        raw: authContext
      };
    }).find((v) => v.result !== 'undefined');
  }
}