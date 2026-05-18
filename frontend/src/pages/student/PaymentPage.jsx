import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaCreditCard, FaSpinner } from "react-icons/fa";
import { api } from "../../lib/api";
import { loadRazorpay } from "../../utils/loadRazorpay";
import { razorpayTestOptions } from "../../utils/razorpayTestOptions";
import { showPaymentFailureToast, showPaymentSuccessToast } from "../../utils/paymentAlerts";

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);

  const amount = useMemo(() => Number(booking?.amount || 0), [booking]);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(({ data }) => setBooking(data.booking)).catch(() => {});
  }, [bookingId]);

  const verifyAndOpenSession = async ({ orderId, paymentId, signature }) => {
    const verifyRes = await api.post("/payments/verify", {
      bookingId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    });

    if (verifyRes.data.success) {
      setStatus("success");
      showPaymentSuccessToast({ amount });
      setTimeout(() => navigate(`/live-class/${bookingId}`), 850);
    }
  };

  const handlePay = async () => {
    try {
      setStatus("processing");
      setError("");
      // Payment flow: create Razorpay TEST MODE order, open checkout, then verify the signature.
      const orderRes = await api.post("/payments/create-order", { bookingId, amount });
      const order = orderRes.data.order;

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        throw new Error("Razorpay checkout could not be loaded. Please retry.");
      }

    
     
  //     const options = {
  // key: orderRes.data.keyId,

  // amount: order.amount,

  // currency: order.currency || "INR",

  // name: "DoubtBridge",

  // description: `Mentor Session Booking #${bookingId}`,

  // order_id: order.id,

  // handler: async (response) => {
  //   await verifyAndOpenSession({
  //     orderId: response.razorpay_order_id,
  //     paymentId: response.razorpay_payment_id,
  //     signature: response.razorpay_signature
  //   });
  // },

  // prefill: {
  //   name: booking?.student_name || "",
  //   email: ""
  // },

  // theme: {
  //   color: "#7b35f0"
  // },

  // method: {
  //   upi: true,
  //   netbanking: true,
  //   card: true,
  //   wallet: true,
  //   emi: true,
  //   paylater: true
  // },

  // modal: {
  //   ondismiss: () => {
  //     toast.error("Payment cancelled.");
  //     setStatus("idle");
  //   }
  // }
  //     };
      
      
      const options = {
  key: orderRes.data.keyId,

  amount: order.amount,

  currency: order.currency || "INR",

  name: "DoubtBridge",

  description: `Mentor Session Booking #${bookingId}`,

  order_id: order.id,

  handler: async (response) => {
    await verifyAndOpenSession({
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature
    });
  },

  prefill: {
    name: booking?.student_name || "",
    email: ""
  },

  method: {
    upi: true,
    netbanking: true,
    card: true,
    wallet: true,
    paylater: true
  },

  config: {
    display: {
      preferences: {
        show_default_blocks: true
      }
    }
  },

  theme: {
    color: "#7b35f0"
  },

  modal: {
    ondismiss: () => {
      toast.error("Payment cancelled.");
      setStatus("idle");
    }
  }
};


      
      const instance = new window.Razorpay(options);
      instance.on("payment.failed", (response) => {
        const description = response?.error?.description || "Payment failed. In test mode, use UPI ID success@razorpay or test netbanking.";
        setStatus("error");
        setError(description);
        showPaymentFailureToast(description);
      });
      instance.open();
    } catch (err) {
      setStatus("error");
      const message = err.response?.data?.message || err.message || "Payment failed. Please retry.";
      setError(message);
      showPaymentFailureToast(message);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-white/70 bg-white/85 p-8 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Secure Razorpay Payment</h1>
          <p className="mt-2 text-sm font-semibold text-brand-700">Test mode only</p>
        </div>
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right text-xs font-semibold text-slate-600">
          Use UPI: success@razorpay
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600">Booking ID: #{bookingId}</p>
      <p className="mt-1 text-sm text-slate-600">Mentor: {booking?.teacher_name || "Loading..."}</p>
      <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
        Amount payable: Rs. {amount || "--"}
      </p>
      {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
      {status === "success" ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          Payment verified. Opening your protected session...
        </div>
      ) : null}
      <button
        onClick={handlePay}
        disabled={status === "processing" || status === "success"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-glow disabled:opacity-60"
      >
        {status === "processing" ? <FaSpinner className="animate-spin" /> : <FaCreditCard />}
        {status === "processing" ? "Opening Razorpay..." : status === "success" ? "Payment Secured" : "Pay with UPI / Netbanking"}
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Test UPI: success@razorpay. Netbanking opens Razorpay's test bank page where you can choose success or failure.
      </p>
    </div>
  );
};

export default PaymentPage;
