import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaCheckCircle, FaClock, FaCreditCard, FaSpinner } from "react-icons/fa";
import { api } from "../../lib/api";
import { loadRazorpay } from "../../utils/loadRazorpay";
import { razorpayTestOptions } from "../../utils/razorpayTestOptions";
import { showPaymentFailureToast, showPaymentSuccessToast } from "../../utils/paymentAlerts";
import { canBookTeacherStatus, teacherStatusMessage } from "../../components/teacher/TeacherStatusBadge";

const BookingPage = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [duration, setDuration] = useState(15);
  const [teacher, setTeacher] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState("");

  useEffect(() => { api.get(`/teachers/${teacherId}`).then(({ data }) => setTeacher(data.teacher)).catch(() => {}); }, [teacherId]);

  const amount = duration === 15 ? teacher?.pricing?.min15 : duration === 30 ? teacher?.pricing?.min30 : duration === 45 ? teacher?.pricing?.min45 : teacher?.pricing?.min60;

  const handleBooking = async () => {
    setSubmitting(true);
    setPaymentStep("Creating booking...");
    setError("");
    try {
      const bookingRes = await api.post("/bookings", { teacherId, duration });
      const bookingId = bookingRes.data.booking.id;

      // Payment flow: create a Razorpay TEST MODE order for the new booking.
      setPaymentStep("Preparing Razorpay test checkout...");
      const orderRes = await api.post("/payments/create-order", {
        bookingId,
        amount: bookingRes.data.booking.amount
      });
      const order = orderRes.data.order;

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        throw new Error("Razorpay checkout could not be loaded. Please retry.");
      }

      setPaymentStep("Complete test payment with success@razorpay");
      const instance = new window.Razorpay({
        ...razorpayTestOptions,
        key: orderRes.data.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "DoubtBridge",
        description: `${duration} min mentor session`,
        order_id: order.id,
        prefill: {
          name: teacher?.name || ""
        },
        theme: { color: "#7b35f0" },
        handler: async (response) => {
          try {
            setPaymentStep("Verifying secure payment...");
            await api.post("/payments/verify", {
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setPaymentStep("Payment verified. Opening protected session...");
            showPaymentSuccessToast({ amount: bookingRes.data.booking.amount });
            setTimeout(() => navigate(`/live-class/${bookingId}`), 850);
          } catch (verifyError) {
            showPaymentFailureToast(verifyError.response?.data?.message || "Payment verification failed.");
            setSubmitting(false);
            setPaymentStep("");
          }
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled.");
            setSubmitting(false);
            setPaymentStep("");
          }
        }
      });

      instance.on("payment.failed", (response) => {
        const description = response?.error?.description || "Payment failed. In test mode, use UPI ID success@razorpay or test netbanking.";
        showPaymentFailureToast(description);
        setSubmitting(false);
        setPaymentStep("");
      });

      instance.open();
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message || "This teacher is not available right now. Please try later.";
      setError(message);
      showPaymentFailureToast(message);
      setSubmitting(false);
      setPaymentStep("");
    }
  };

  const teacherStatus = teacher?.status || teacher?.availability || "offline";
  const isAvailable = canBookTeacherStatus(teacherStatus);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/70 bg-white/85 p-8 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Book Instant Session</h1>
          <p className="mt-2 text-slate-600">Teacher: {teacher?.name || "Loading..."}</p>
        </div>
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Test mode</p>
          <p className="text-sm font-semibold text-slate-600">UPI, cards, wallets, or netbanking</p>
        </div>
      </div>
      {teacher ? (
        <p className={`mt-2 text-sm font-bold capitalize ${isAvailable ? "text-emerald-600" : "text-rose-600"}`}>
          {isAvailable ? "Available now" : teacherStatusMessage(teacherStatus)}
        </p>
      ) : null}
        <div className="mt-6 grid gap-3 md:grid-cols-4">
        {[15, 30, 45, 60].map((value) => {
          const price = value === 15 ? teacher?.pricing?.min15 : value === 30 ? teacher?.pricing?.min30 : value === 45 ? teacher?.pricing?.min45 : teacher?.pricing?.min60;
          const selected = duration === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setDuration(value)}
              className={`rounded-2xl border px-4 py-5 text-left transition ${selected ? "border-brand-400 bg-brand-100 text-brand-800 shadow-glow" : "border-slate-200 bg-white text-slate-700 hover:border-brand-200"}`}
            >
              <span className="inline-flex items-center gap-2 text-sm font-bold">
                {selected ? <FaCheckCircle /> : <FaClock />}
                {value === 60 ? "1 Hour" : `${value} mins`}
              </span>
              <span className="mt-3 block text-2xl font-extrabold">Rs. {price || "--"}</span>
              <span className="mt-1 block text-xs text-slate-500">Live class + unlocked chat</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 grid gap-3 rounded-2xl bg-gradient-to-r from-brand-50 to-purple-50 p-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Selected plan</p>
          <p className="mt-1 text-sm text-slate-600">{duration} minutes with {teacher?.name || "mentor"}</p>
        </div>
        <p className="text-right text-3xl font-extrabold text-brand-700">Rs. {amount || "--"}</p>
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
      {paymentStep ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <FaSpinner className="animate-spin" />
          {paymentStep}
        </p>
      ) : null}
      <button disabled={submitting || !isAvailable} onClick={handleBooking} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? <FaSpinner className="animate-spin" /> : <FaCreditCard />}
        {submitting ? "Opening Razorpay..." : "Book Session & Pay by UPI / Netbanking"}
      </button>
    </div>
  );
};

export default BookingPage;
