import { createCipheriv, randomBytes, randomInt } from "crypto";

const getAlgorithm = (secret) => {
  const length = Buffer.from(secret).length;
  if (length === 16) return "aes-128-cbc";
  if (length === 24) return "aes-192-cbc";
  if (length === 32) return "aes-256-cbc";
  throw new Error("ZEGOCLOUD ServerSecret must be 16, 24, or 32 bytes.");
};

const aesEncrypt = (plainText, secret, iv) => {
  const cipher = createCipheriv(getAlgorithm(secret), secret, iv);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(plainText), cipher.final()]);
};

export const generateZegoToken04 = ({
  appId,
  userId,
  serverSecret,
  effectiveTimeInSeconds = 7200,
  payload = ""
}) => {
  if (!Number.isFinite(appId) || appId <= 0) {
    throw new Error("Valid ZEGOCLOUD AppID is required.");
  }
  if (!userId || typeof userId !== "string") {
    throw new Error("Valid ZEGOCLOUD user ID is required.");
  }
  if (!serverSecret || typeof serverSecret !== "string") {
    throw new Error("ZEGOCLOUD ServerSecret is not configured.");
  }

  const createTime = Math.floor(Date.now() / 1000);
  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: randomInt(-2147483648, 2147483647),
    ctime: createTime,
    expire: createTime + effectiveTimeInSeconds,
    payload
  };

  const iv = randomBytes(16).toString("hex").slice(0, 16);
  const encrypted = aesEncrypt(JSON.stringify(tokenInfo), serverSecret, iv);
  const expireBuffer = Buffer.alloc(8);
  const ivLengthBuffer = Buffer.alloc(2);
  const encryptedLengthBuffer = Buffer.alloc(2);

  expireBuffer.writeBigInt64BE(BigInt(tokenInfo.expire), 0);
  ivLengthBuffer.writeUInt16BE(Buffer.byteLength(iv), 0);
  encryptedLengthBuffer.writeUInt16BE(encrypted.length, 0);

  const tokenBuffer = Buffer.concat([
    expireBuffer,
    ivLengthBuffer,
    Buffer.from(iv),
    encryptedLengthBuffer,
    encrypted
  ]);

  return `04${tokenBuffer.toString("base64")}`;
};
