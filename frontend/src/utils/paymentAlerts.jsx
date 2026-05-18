import toast from "react-hot-toast";
import { FaCheckCircle, FaShieldAlt, FaStar, FaTimesCircle, FaUndo, FaUniversity } from "react-icons/fa";

const toneStyles = {
  success: {
    icon: FaCheckCircle,
    title: "Payment secured",
    border: "border-emerald-200/80",
    glow: "shadow-[0_18px_55px_rgba(123,53,240,0.20)]",
    iconClass: "bg-emerald-500 text-white"
  },
  refund: {
    icon: FaUndo,
    title: "Refund protected",
    border: "border-amber-200/90",
    glow: "shadow-[0_18px_55px_rgba(217,158,54,0.24)]",
    iconClass: "bg-gradient-to-br from-amber-400 to-brand-600 text-white"
  },
  session: {
    icon: FaStar,
    title: "Live class update",
    border: "border-violet-200/90",
    glow: "shadow-[0_18px_55px_rgba(123,53,240,0.24)]",
    iconClass: "bg-gradient-to-br from-brand-600 to-violet-500 text-white"
  },
  failure: {
    icon: FaTimesCircle,
    title: "Payment needs attention",
    border: "border-rose-200/90",
    glow: "shadow-[0_18px_55px_rgba(225,29,72,0.18)]",
    iconClass: "bg-rose-500 text-white"
  }
};

export const showPremiumPaymentToast = ({ tone = "success", title, message, amount }) => {
  const styles = toneStyles[tone] || toneStyles.success;
  const Icon = styles.icon;

  toast.custom(
    (toastItem) => (
      <div
        className={`payment-trust-toast ${toastItem.visible ? "payment-trust-toast-in" : "payment-trust-toast-out"} ${styles.border} ${styles.glow}`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles.iconClass}`}>
            <Icon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-brand-600" />
              <p className="text-sm font-extrabold text-slate-950">{title || styles.title}</p>
              <FaStar className="text-amber-400" />
            </div>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">{message}</p>
            {amount ? (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-extrabold text-brand-700">
                <FaUniversity className="text-amber-500" />
                Rs. {amount}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    ),
    { duration: tone === "failure" ? 5200 : 6200 }
  );
};

export const showPaymentSuccessToast = (payload = {}) =>
  showPremiumPaymentToast({
    tone: "success",
    title: "Payment verified",
    message: "Your Razorpay test payment is verified and the session is protected.",
    amount: payload.amount
  });

export const showRefundToast = (payload = {}) =>
  showPremiumPaymentToast({
    tone: "refund",
    title: "Safe refund issued",
    message: payload.message || "Your payment has been safely refunded because the mentor could not join the session.",
    amount: payload.amount
  });

export const showSessionToast = (payload = {}) =>
  showPremiumPaymentToast({
    tone: "session",
    title: payload.title || "Live class update",
    message: payload.message || "Your live classroom status has changed."
  });

export const showPaymentFailureToast = (message) =>
  showPremiumPaymentToast({
    tone: "failure",
    title: "Payment failed",
    message: message || "The Razorpay test payment could not be completed. Please try UPI or netbanking again."
  });
