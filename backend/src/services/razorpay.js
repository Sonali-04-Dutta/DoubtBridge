import { razorpay } from "../config/razorpay.js";

export {
  assertRazorpayTestMode,
  getRazorpayKeyId,
  razorpay,
  verifyRazorpaySignature
} from "../config/razorpay.js";

export const isRazorpayEnabled = () => Boolean(razorpay);
