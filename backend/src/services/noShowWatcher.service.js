import { processTeacherNoShows } from "./paymentRefund.service.js";
import { isRazorpayEnabled } from "./razorpay.js";
import { emitLiveSessionTimers, processExpiredLiveSessions } from "./liveSession.service.js";

const ONE_MINUTE_MS = 60 * 1000;
let watcher = null;

export const startNoShowRefundWatcher = () => {
  if (watcher) return watcher;
  if (!isRazorpayEnabled()) {
    console.warn("Teacher no-show refunds are skipped because Razorpay test keys are not configured. Session timer checks will still run.");
  }

  watcher = setInterval(() => {
    Promise.all([
      isRazorpayEnabled() ? processTeacherNoShows() : Promise.resolve([]),
      processExpiredLiveSessions(),
      emitLiveSessionTimers()
    ]).catch((error) => {
      console.error("Live session watcher failed", error);
    });
  }, ONE_MINUTE_MS);

  watcher.unref?.();
  Promise.all([
    isRazorpayEnabled() ? processTeacherNoShows() : Promise.resolve([]),
    processExpiredLiveSessions(),
    emitLiveSessionTimers()
  ]).catch((error) => {
    console.error("Initial live session scan failed", error);
  });

  return watcher;
};
