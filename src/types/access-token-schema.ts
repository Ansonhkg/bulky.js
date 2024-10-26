import { z } from "zod";
import { ACCESS_TOKEN_TYPES_SCHEMA, AUTH_METHOD_SCOPES_SCHEMA, AUTH_RESOURCE_TYPES_SCHEMA } from "./auth-types";
import { AuthSig } from "@lit-protocol/types";
import { IPFSCIDv0 } from "./common-types";

// Define a union of all possible `type` values to enable IntelliSense suggestions
export const AccessTokenTypes = z.enum(["custom_auth", "native_auth", "eoa"]);
export type AccessTokenTypes = z.infer<typeof AccessTokenTypes>;

// Base schema for access token parameters
const BaseAccessTokenParams = z.object({
  expiration: z.string().optional(), // Optional expiration date in ISO string format
  pkpPublicKey: z.string().min(1, "pkpPublicKey is required"), // Required public key in hex format
  type: AccessTokenTypes, // Apply the union type for `type`
  resources: z.array(z.object({
    type: AUTH_RESOURCE_TYPES_SCHEMA, // Type of resource (validated against a schema)
    request: z.union([z.literal('*'), z.string()])
  })).min(1, "resources is required"), // At least one resource must be specified
  creditsDelegationToken: z.custom<AuthSig>().optional(), // Optional delegation token of type `AuthSig`
  outputId: z.string().optional(), // Optional output ID
  cache: z.boolean().optional() // Optional cache flag
});

// Custom Auth with Code schema
const CustomAuthWithCode = BaseAccessTokenParams.extend({
  type: z.literal("custom_auth"), // Specify as "custom_auth" for CustomAuthWithCode
  jsParams: z.any().refine(val => val !== undefined && val !== null, {
    message: "jsParams is required" // Ensure `jsParams` is defined
  }),
  code: z.string().min(1), // Required `code` for this auth type
  ipfsCid: z.custom<IPFSCIDv0>().optional()
}).refine(data => data.ipfsCid === undefined, {
  message: "ipfsCid should not be provided when code is present",
  path: ["ipfsCid"]
});

// Custom Auth with IPFS schema
const CustomAuthWithIPFS = BaseAccessTokenParams.extend({
  type: z.literal("custom_auth"), // Specify as "custom_auth" for CustomAuthWithIPFS
  jsParams: z.any().refine(val => val !== undefined && val !== null, {
    message: "jsParams is required"
  }),
  permissions: z.object({
    grantIPFSCIDtoUsePKP: z.object({
      scopes: z.array(AUTH_METHOD_SCOPES_SCHEMA)
    })
  }).optional(), // Optional permissions object
  code: z.string().optional(), // Optional `code`, must not exist with `ipfsCid`
  ipfsCid: z.custom<IPFSCIDv0>() // Required IPFS CID when using this type
}).refine(data => data.code === undefined, {
  message: "code should not be provided when ipfsCid is present",
  path: ["code"]
});

// Union of custom auth types with additional validation to ensure either `code` or `ipfsCid` exists
const CustomAuth = z.union([CustomAuthWithCode, CustomAuthWithIPFS]).refine(
  data => data.code !== undefined || data.ipfsCid !== undefined,
  {
    message: "Either code or ipfsCid must be provided",
    path: ["code", "ipfsCid"]
  }
);

// Native Auth schema (unsupported marker)
const NativeAuth = BaseAccessTokenParams.extend({
  type: z.literal("native_auth") // Type set to "native_auth"
});

// EOA Auth schema (unsupported marker)
const EOAAuth = BaseAccessTokenParams.extend({
  type: z.literal("eoa") // Type set to "eoa"
});

// Combined schema for all access token types
const AccessTokenParamsSchemaUnvalidated = z.union([
  CustomAuth, // Custom auth (requires either `code` or `ipfsCid`)
  NativeAuth, // Native auth (unsupported)
  EOAAuth     // EOA auth (unsupported)
]);

// For TypeScript type inference, create a separate type that includes all possibilities
export type AccessTokenParams = z.infer<typeof AccessTokenParamsSchemaUnvalidated>;

// For runtime validation, keep the refined schema that excludes unsupported types
export const AccessTokenParamsSchema = AccessTokenParamsSchemaUnvalidated.refine(
  (data) => data.type !== "native_auth" && data.type !== "eoa",
  { message: "Native auth and EOA auth are not supported yet" }
);
