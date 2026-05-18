import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "./env.js";

const hasTestKeys = Boolean(
  env.razorpayKeyId?.startsWith("rzp_test_") &&
  env.razorpayKeySecret
);

export const razorpay = hasTestKeys
  ? new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret
    })
  : null;

export const assertRazorpayTestMode = () => {
  if (!hasTestKeys || !razorpay) {
    throw new Error("Razorpay test keys are required. Set RAZORPAY_KEY_ID to an rzp_test_* key and RAZORPAY_KEY_SECRET.");
  }
};

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
};

export const getRazorpayKeyId = () => env.razorpayKeyId;
