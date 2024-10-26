import Hash from "typestub-ipfs-only-hash";
import { IPFSCIDv0 } from "./types/common-types";
import { SessionSigsMap } from "@lit-protocol/types";
import { ethers } from "ethers";
import { fromError } from "zod-validation-error";
import { z } from "zod";

export namespace BulkieUtils {
  export const strToIPFSHash = async (str: string): Promise<IPFSCIDv0> => {
    return await Hash.of(Buffer.from(str)) as IPFSCIDv0;
  };

  export const parseSignedMessage = (signedMessage: string) => {
    const urnLine = signedMessage.match(/urn:recap:[\w\d]+/)![0];

    const urn = JSON.parse(atob(urnLine.split(':')[2]));

    let res: any = undefined;

    try {
      const authContext = urn.att['lit-resolvedauthcontext://*']['Auth/Auth'][0]['auth_context'];
      const extractedCustomAuthResource = (authContext['customAuthResource']).slice(8, -2);
      const result = extractedCustomAuthResource.replace(/\\"/g, '"');

      try {
        res = JSON.parse(result);
      } catch (e) {
        res = extractedCustomAuthResource
      }

    } finally {
      return {
        result: res,
        raw: urn
      }
    }
  }

  export const parseAuthContext = (sessionSigs: SessionSigsMap) => {
    return Object.values(sessionSigs).map((v) => {
      const signedMessage = v.signedMessage;

      const { result } = parseSignedMessage(signedMessage);

      return result;

    }).find((v) => v !== 'undefined');
  }

  export const pubKeyToTokenId = (publicKey: string): `0x${string}` => {
    const bytes = ethers.utils.arrayify(publicKey);

    return `0x${ethers.utils.keccak256(bytes).slice(2)}`
  };
}

export namespace BulkieBouncer {
  export const check = <T>(schema: z.ZodSchema<T>, data: T) => {
    try {
      schema.parse(data);
    } catch (error) {
      const validationError = fromError(error);
      console.log(validationError.toString());
      throw validationError;
    }
  }
}