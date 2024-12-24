import { error } from "console";
import crypto from "crypto";
const npSecretKey = process.env.IPN_SECRET_KEY;
if (!npSecretKey) {
  throw new Error("You don't have INP_SECRET_KEY");
}

export const npSignatureCheck = (sortedMsg: string, npXSignature: string) => {
  // Create HMAC using SHA-512
  const hmac = crypto.createHmac("sha512", npSecretKey);
  hmac.update(sortedMsg);
  const signature = hmac.digest("hex");
  console.log("Signature: ", signature);
  if (signature == npXSignature) {
    return true; // Signatures match
  } else {
    return false; // Signatures does not match
  }
};
