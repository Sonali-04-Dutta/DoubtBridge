import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaClock,
  FaDesktop,
  FaDoorOpen,
  FaExclamationTriangle,
  FaCreditCard,
  FaMicrophone,
  FaPaperPlane,
  FaStar,
  FaVideo,
  FaVideoSlash
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Avatar from "../../components/common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { connectSocket, socket } from "../../lib/socket";
import { razorpayTestOptions } from "../../utils/razorpayTestOptions";
import { showPaymentFailureToast, showPaymentSuccessToast, showRefundToast, showSessionToast } from "../../utils/paymentAlerts";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const formatCountdown = (secondsLeft) => {
  const safeSeconds = Math.max(secondsLeft, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s remaining`;
};

const formatDateDivider = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDifference = Math.round((startOfToday - startOfMessageDay) / 86400000);

  if (dayDifference === 0) return "Today";
  if (dayDifference === 1) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const LiveSessionPage = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [controls, setControls] = useState({ mic: true, camera: true, screen: false });
  const [ending, setEnding] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [connectionState, setConnectionState] = useState("connecting");
  const [remotePresence, setRemotePresence] = useState({});
  const [extending, setExtending] = useState(false);
  const [dismissExtendPrompt, setDismissExtendPrompt] = useState(false);
  const [selectedExtensionMinutes, setSelectedExtensionMinutes] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  const isStudent = user?.role === "student";
  const hasRequestedJoinRef = useRef(false);
  const isWaiting = session?.sessionStatus === "scheduled";
  const isLive = session?.sessionStatus === "live";
  const isExpired = useMemo(() => {
    if (!session?.expiresAt) return false;
    return Date.now() >= new Date(session.expiresAt).getTime() || ["expired", "cancelled", "completed", "refunded"].includes(session?.sessionStatus) || timerSeconds <= 0;
  }, [session, timerSeconds]);
  const joinSecondsLeft = useMemo(() => {
    if (!session?.joinDeadlineAt || !isWaiting) return 0;
    return Math.max(Math.floor((new Date(session.joinDeadlineAt).getTime() - Date.now()) / 1000), 0);
  }, [session?.joinDeadlineAt, isWaiting, timerSeconds]);
  const shouldOfferExtension = isStudent && isLive && !isExpired && timerSeconds > 0 && timerSeconds <= 120 && !dismissExtendPrompt;
  const extensionPrice = selectedExtensionMinutes ? Number(booking?.extension_prices?.[selectedExtensionMinutes] || 0) : 0;
  const chatItems = useMemo(() => {
    let lastDateLabel = "";

    return chat.map((entry, idx) => {
      const dateLabel = formatDateDivider(entry.createdAt);
      const showDate = Boolean(dateLabel && dateLabel !== lastDateLabel);
      if (showDate) lastDateLabel = dateLabel;

      return { entry, idx, dateLabel, showDate };
    });
  }, [chat]);

  const loadSession = async ({ join = false } = {}) => {
    const [sessionRes, bookingRes] = await Promise.all([
      api.post("/sessions/token", { bookingId, join }),
      api.get(`/bookings/${bookingId}`)
    ]);

    setSession(sessionRes.data.session);
    setBooking(bookingRes.data.booking);
  };

  useEffect(() => {
    const join = !hasRequestedJoinRef.current;
    hasRequestedJoinRef.current = true;
    loadSession({ join }).catch((error) => {
      toast.error(error.response?.data?.message || "Unable to open live session.");
      if (error.response?.status === 410) {
        setSession((prev) => ({ ...(prev || {}), sessionStatus: "expired", expiresAt: new Date().toISOString() }));
      }
    });
  }, [bookingId]);

  useEffect(() => {
    if (!session?.expiresAt && !session?.joinDeadlineAt) return undefined;
    const tick = () => {
      const target = isWaiting ? session.joinDeadlineAt : session.expiresAt;
      const leftSeconds = Math.floor((new Date(target).getTime() - Date.now()) / 1000);
      setTimerSeconds(leftSeconds);
      if (leftSeconds <= 0 && isLive && !ending) {
        handleEndSession("timer");
      }
      if (leftSeconds === 300 && isLive) {
        showSessionToast({ title: "Session ending soon", message: "Only 5 minutes remaining in this live class." });
      }
      if (leftSeconds === 60 && isStudent) {
        showSessionToast({ title: isWaiting ? "Join window ending soon" : "Final minute", message: isWaiting ? "Your protected refund window is almost over." : "One minute remaining in this session." });
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session?.expiresAt, session?.joinDeadlineAt, isWaiting, isStudent]);

  useEffect(() => {
    if (!isWaiting || isExpired) return undefined;
    const poll = setInterval(() => {
      loadSession({ join: false }).catch(() => {});
    }, 5000);
    return () => clearInterval(poll);
  }, [isWaiting, isExpired, bookingId]);

  useEffect(() => {
    if (!bookingId || !user?.id) return undefined;
    connectSocket();
    socket.emit("join:booking", { bookingId });
    socket.emit("session:timer:sync", { bookingId });
    const onMessage = (payload) => setChat((prev) => [...prev, payload]);
    const onConnect = () => setConnectionState("connected");
    const onDisconnect = () => setConnectionState("reconnecting");
    const onConnectError = () => setConnectionState("reconnecting");
    const onTimer = (payload) => {
      if (String(payload.bookingId) !== String(bookingId) || payload.remainingSeconds === null) return;
      setTimerSeconds(payload.remainingSeconds);
    };
    const onStarted = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setSession((prev) => ({
        ...(prev || {}),
        sessionStatus: "live",
        expiresAt: payload.expiresAt || prev?.expiresAt,
        teacherJoinedAt: payload.teacherJoinedAt || prev?.teacherJoinedAt,
        studentJoinedAt: payload.studentJoinedAt || prev?.studentJoinedAt
      }));
      showSessionToast({ title: "Session started", message: "Your live classroom is now active." });
    };
    const onEnded = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setSession((prev) => ({ ...(prev || {}), sessionStatus: "completed", expiresAt: payload.endedAt || new Date().toISOString() }));
      showSessionToast({ title: "Session ended", message: "The live session has ended for both users." });
    };
    const onUserJoined = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setRemotePresence((prev) => ({ ...prev, [payload.role]: true }));
    };
    const onUserLeft = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setRemotePresence((prev) => ({ ...prev, [payload.role]: false }));
      showSessionToast({ title: "User left class", message: `${payload.role === "teacher" ? "Teacher" : "Student"} left and can rejoin before the timer ends.` });
    };
    const onExtended = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setSession((prev) => ({
        ...(prev || {}),
        sessionStatus: payload.sessionStatus || prev?.sessionStatus || "live",
        expiresAt: payload.expiresAt || prev?.expiresAt
      }));
      toast.success(`Session extended by ${payload.minutes || "extra"} minutes.`);
    };
    const onExpired = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setSession((prev) => ({
        ...(prev || {}),
        sessionStatus: "expired",
        expiresAt: payload.expiresAt || new Date().toISOString()
      }));
    };
    const onRefund = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setSession((prev) => ({
        ...(prev || {}),
        sessionStatus: "cancelled",
        expiresAt: new Date().toISOString(),
        refundStatus: "refunded"
      }));
      showRefundToast({ ...payload, message: payload.message || "Teacher could not join. Amount refunded automatically." });
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("chat:message", onMessage);
    socket.on("session:timer", onTimer);
    socket.on("session:start", onStarted);
    socket.on("session:end", onEnded);
    socket.on("session:user-joined", onUserJoined);
    socket.on("session:user-left", onUserLeft);
    socket.on("session:extended", onExtended);
    socket.on("session:expired", onExpired);
    socket.on("payment:refund", onRefund);
    socket.on("session:refund", onRefund);
    return () => {
      socket.emit("leave:booking", { bookingId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("chat:message", onMessage);
      socket.off("session:timer", onTimer);
      socket.off("session:start", onStarted);
      socket.off("session:end", onEnded);
      socket.off("session:user-joined", onUserJoined);
      socket.off("session:user-left", onUserLeft);
      socket.off("session:extended", onExtended);
      socket.off("session:expired", onExpired);
      socket.off("payment:refund", onRefund);
      socket.off("session:refund", onRefund);
    };
  }, [bookingId, user?.id]);

  const sendMessage = () => {
    if (!message.trim() || isExpired || !isLive) return;
    socket.emit("chat:message", {
      bookingId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar_url || "",
      message: message.trim()
    });
    setMessage("");
  };

  const payAndExtendSession = async (minutes) => {
    setExtending(true);
    try {
      const orderRes = await api.post("/payments/create-order", { bookingId, purpose: "extension", extensionMinutes: minutes });
      const order = orderRes.data.order;
      const verifyExtension = async ({ orderId, paymentId, signature }) => {
        const { data } = await api.post("/payments/verify", {
          bookingId,
          purpose: "extension",
          extensionMinutes: minutes,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature
        });
        const nextExpiresAt = data.extension?.expires_at || data.extension?.expiresAt;
        setSession((prev) => ({ ...(prev || {}), sessionStatus: "live", expiresAt: nextExpiresAt || prev?.expiresAt }));
        setDismissExtendPrompt(true);
        setSelectedExtensionMinutes(null);
        showPaymentSuccessToast({ amount: extensionAmount });
        loadSession({ join: false }).catch(() => {});
      };

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Razorpay checkout could not be loaded. Please retry.");
      }

      const instance = new window.Razorpay({
        ...razorpayTestOptions,
        key: orderRes.data.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "DoubtBridge",
        description: `${minutes} min session extension`,
        order_id: order.id,
        handler: async (response) => {
          await verifyExtension({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature
          });
        },
        theme: { color: "#7b35f0" },
        modal: { ondismiss: () => setExtending(false) }
      });
      instance.on("payment.failed", (response) => {
        const description = response?.error?.description || "Payment failed. In test mode, use UPI ID success@razorpay or test netbanking.";
        showPaymentFailureToast(description);
        setExtending(false);
      });
      instance.open();
    } catch (error) {
      showPaymentFailureToast(error.response?.data?.message || "Could not start extension payment.");
    } finally {
      setExtending(false);
    }
  };

  const handleLeaveClass = () => {
    socket.emit("leave:booking", { bookingId });
    showSessionToast({ title: "Left class", message: "You can rejoin before the session timer ends." });
    navigate(user?.role === "teacher" ? "/teacher/history" : "/student");
  };

  const handleEndSession = async (reason = "manual") => {
    setEnding(true);
    try {
      await api.patch(`/bookings/${bookingId}/complete`);
      socket.emit("leave:booking", { bookingId });
      showSessionToast({ title: "Session ended", message: reason === "timer" ? "Time is up. The session ended automatically." : "Session completed for both users." });
      if (isStudent) {
        setShowFeedback(true);
      } else {
        navigate("/teacher/history");
      }
    } catch (_error) {
      toast.error("Could not end session right now.");
    } finally {
      setEnding(false);
      setConfirmEndOpen(false);
    }
  };

  const submitReview = async () => {
    try {
      await api.post("/reviews", { bookingId, rating, review });
      toast.success("Thanks for rating your mentor.");
      navigate("/student");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save review.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:h-[calc(100vh-145px)] lg:grid-cols-[1fr_360px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/60 bg-slate-950 text-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
            <div>
              <h1 className="inline-flex items-center gap-2 text-xl font-bold">
              <FaVideo />
                {isWaiting ? "Waiting Lobby" : "Live Classroom"}
              </h1>
              <p className="mt-1 text-xs text-white/65">Room: {session?.room || "preparing..."}</p>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold shadow-[0_0_28px_rgba(123,53,240,0.35)] backdrop-blur ${isExpired ? "bg-rose-600" : "bg-white/15"}`}>
              <FaClock />
              {formatCountdown(timerSeconds)}
            </span>
          </div>

          {connectionState !== "connected" ? (
            <div className="border-b border-amber-300/20 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-100">
              <FaExclamationTriangle className="mr-2 inline" />
              Reconnecting to classroom. If your internet is unstable, your video may pause briefly.
            </div>
          ) : null}

          {isWaiting ? (
            <div className="border-b border-white/10 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-100">
              The mentor must join within 10 minutes after payment. If not, the student is automatically refunded.
            </div>
          ) : null}

          <div className={`relative grid min-h-0 flex-1 gap-3 p-5 md:grid-cols-[1fr_220px] ${isExpired ? "pointer-events-none opacity-60" : ""}`}>
            <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700/45 via-slate-900 to-brand-300/20">
              <div className="text-center">
                <Avatar src={booking?.teacher_avatar_url} name={booking?.teacher_name || "Teacher"} className="mx-auto h-20 w-20 border-white/40" textClassName="text-lg" hover={false} />
                <p className="mt-4 text-lg font-bold">{booking?.teacher_name || "Teacher"}</p>
                <p className="text-sm text-white/65">{session?.teacherJoinedAt || remotePresence.teacher ? "Mentor joined" : "Waiting for mentor"}</p>
              </div>
            </div>
            <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/10">
              <div className="text-center">
                <Avatar src={booking?.student_avatar_url} name={booking?.student_name || "Student"} className="mx-auto h-16 w-16 border-white/40" textClassName="text-base" hover={false} />
                <p className="mt-3 text-sm font-bold">{booking?.student_name || "Student"}</p>
                <p className="text-xs text-white/65">{session?.studentJoinedAt || remotePresence.student ? "Student joined" : "Waiting for student"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {[
                ["mic", FaMicrophone, "Mic"],
                ["camera", controls.camera ? FaVideo : FaVideoSlash, "Camera"],
                ["screen", FaDesktop, "Share"]
              ].map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setControls((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${controls[key] ? "bg-white text-brand-700" : "bg-white/10 text-white"}`}
                >
                  <Icon />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLeaveClass}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <FaDoorOpen />
                Leave Class
              </button>
              <button
                type="button"
                onClick={() => setConfirmEndOpen(true)}
                disabled={ending}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                <FaDoorOpen />
                End Session
              </button>
            </div>
          </div>
        </div>

        <aside className="glass flex min-h-0 flex-col rounded-3xl p-4 shadow-card">
          <div className="rounded-2xl bg-white/70 p-3">
            <p className="text-sm font-bold text-slate-900">Session Info</p>
            <p className="mt-1 text-xs text-slate-600">Teacher: {booking?.teacher_name || "Loading..."}</p>
            <p className="text-xs text-slate-600">Student: {booking?.student_name || "Loading..."}</p>
            <p className="text-xs text-brand-700">Duration: {booking?.duration || "--"} min</p>
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">Session Chat</h2>
          <div className="soft-scrollbar mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-white/70 p-3">
            {chat.length ? chatItems.map(({ entry, idx, dateLabel, showDate }) => {
              const mine = String(entry.senderId) === String(user?.id);

              return (
                <div key={`${entry.senderId}-${entry.createdAt || idx}`} className="space-y-2">
                  {showDate ? (
                    <div className="flex justify-center">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500 shadow-sm">
                        {dateLabel}
                      </span>
                    </div>
                  ) : null}
                  <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-brand-600 text-white" : "bg-brand-50 text-slate-700"}`}>
                      <p className="text-[11px] font-bold">{entry.senderName || "User"}</p>
                      <p>{entry.message}</p>
                    </div>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-slate-500">Live session messages will appear here.</p>}
          </div>

          <div className={`mt-3 ${isExpired ? "opacity-70" : ""}`}>
            <div className="flex gap-2">
              <input
                className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm disabled:bg-slate-100"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                placeholder={isWaiting ? "Chat opens after both join" : isExpired ? "Session expired" : "Type message"}
                disabled={isExpired || !isLive}
              />
              <button onClick={sendMessage} disabled={isExpired || !isLive} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </aside>
      </section>

      {shouldOfferExtension ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-white/70 bg-white p-6 text-center shadow-card">
            <h2 className="text-2xl font-bold text-slate-900">Extend this session?</h2>
            <p className="mt-2 text-sm text-slate-600">Choose extra time first, then pay the teacher's listed rate.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {[15, 30].map((minutes) => (
                <button
                  key={minutes}
                  disabled={extending}
                  onClick={() => setSelectedExtensionMinutes(minutes)}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-60 ${selectedExtensionMinutes === minutes ? "bg-brand-600 text-white shadow-glow" : "border border-brand-200 bg-white text-brand-700"}`}
                >
                  {minutes} min | Rs. {booking?.extension_prices?.[minutes] || "--"}
                </button>
              ))}
            </div>
            {selectedExtensionMinutes ? (
              <button disabled={extending} onClick={() => payAndExtendSession(selectedExtensionMinutes)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
                <FaCreditCard /> Pay Rs. {extensionPrice || "--"}
              </button>
            ) : null}
            <button onClick={() => setDismissExtendPrompt(true)} className="mt-3 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">Not now</button>
          </div>
        </div>
      ) : null}

      {confirmEndOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-white/70 bg-white p-6 text-center shadow-card">
            <h2 className="text-2xl font-bold text-slate-900">End session for everyone?</h2>
            <p className="mt-2 text-sm text-slate-600">This will mark the booking completed, disconnect both users, and save the session end time.</p>
            <button
              disabled={ending}
              onClick={() => handleEndSession("manual")}
              className="mt-5 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              End Session
            </button>
            <button onClick={() => setConfirmEndOpen(false)} className="mt-3 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">Keep Class Open</button>
          </div>
        </div>
      ) : null}

      {isExpired ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-white/70 bg-white p-6 text-center shadow-card">
            <h2 className="text-2xl font-bold text-slate-900">{session?.sessionStatus === "completed" ? "Session completed." : session?.sessionStatus === "refunded" ? "Payment refunded." : "Session expired."}</h2>
            <p className="mt-2 text-sm text-slate-600">{isWaiting ? "The mentor did not join within the protected joining window." : session?.sessionStatus === "refunded" ? "Teacher could not join. Amount refunded automatically." : "The paid session time has ended."}</p>
            <button onClick={() => navigate(isStudent ? "/student" : "/teacher/history")} className="mt-5 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-glow">Back to dashboard</button>
          </div>
        </div>
      ) : null}

      {showFeedback ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-card">
            <h2 className="text-2xl font-bold text-slate-900">Rate Your Mentor</h2>
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} className={value <= rating ? "text-amber-400" : "text-slate-300"}>
                  <FaStar className="text-2xl" />
                </button>
              ))}
            </div>
            <textarea value={review} onChange={(event) => setReview(event.target.value)} rows={4} placeholder="Write a short review..." className="mt-4 w-full resize-none rounded-2xl border border-brand-100 px-3 py-2 text-sm outline-none" />
            <button onClick={submitReview} className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-glow">
              Submit Feedback
            </button>
            <button
              type="button"
              onClick={() => navigate("/student")}
              className="mt-2 w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm font-bold text-brand-700"
            >
              Remind Later
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LiveSessionPage;
