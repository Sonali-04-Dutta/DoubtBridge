import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaBroadcastTower,
  FaCheckCircle,
  FaClock,
  FaCreditCard,
  FaDoorOpen,
  FaExclamationTriangle,
  FaExpand,
  FaPhoneSlash,
  FaShieldAlt,
  FaSpinner,
  FaStar,
  FaVideo
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "../../components/common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { connectSocket, socket } from "../../lib/socket";
import { loadRazorpay } from "../../utils/loadRazorpay";
import { razorpayTestOptions } from "../../utils/razorpayTestOptions";
import { showPaymentFailureToast, showPaymentSuccessToast, showSessionToast } from "../../utils/paymentAlerts";

const appId = Number(import.meta.env.VITE_ZEGO_APP_ID || 0);

const formatTimer = (seconds) => {
  if (seconds === null || Number.isNaN(Number(seconds))) return "--:--";
  const safe = Math.max(0, Number(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
};

const getTimerTarget = (session) => {
  if (!session) return null;
  if (session.sessionStatus === "scheduled") return session.joinDeadlineAt;
  return session.expiresAt;
};

const LiveClassroom = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const zegoRef = useRef(null);
  const joinedZegoRoomRef = useRef("");
  const requestedJoinRef = useRef(false);
  const startToastShownRef = useRef(false);
  const endToastShownRef = useRef(false);
  const autoEndRequestedRef = useRef(false);

  const [session, setSession] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [connectionState, setConnectionState] = useState("connecting");
  const [presence, setPresence] = useState({ student: false, teacher: false });
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dismissExtendPrompt, setDismissExtendPrompt] = useState(false);
  const [selectedExtensionMinutes, setSelectedExtensionMinutes] = useState(null);
  const [extending, setExtending] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";
  const isWaiting = session?.sessionStatus === "scheduled";
  const isLive = session?.sessionStatus === "live";
  const isClosed = ["completed", "expired", "cancelled", "refunded"].includes(session?.sessionStatus);
  const timerLabel = isWaiting ? "Waiting room closes in" : isLive ? "Class time left" : "Session";
  const otherRole = isTeacher ? "student" : "teacher";
  const otherName = isTeacher ? booking?.student_name : booking?.teacher_name;
  const ownName = isTeacher ? booking?.teacher_name : booking?.student_name;
  const shouldOfferExtension = isStudent && isLive && !isClosed && timerSeconds > 0 && timerSeconds <= 120 && !dismissExtendPrompt;
  const extensionPrice = selectedExtensionMinutes ? Number(booking?.extension_prices?.[selectedExtensionMinutes] || 0) : 0;

  const participantCards = useMemo(
    () => [
      {
        role: "teacher",
        label: "Teacher",
        name: booking?.teacher_name || "Teacher",
        avatar: booking?.teacher_avatar_url,
        joined: Boolean(session?.teacherJoinedAt || presence.teacher)
      },
      {
        role: "student",
        label: "Student",
        name: booking?.student_name || "Student",
        avatar: booking?.student_avatar_url,
        joined: Boolean(session?.studentJoinedAt || presence.student)
      }
    ],
    [booking, presence, session]
  );

  const loadClassroom = useCallback(
    async ({ join = false, silent = false } = {}) => {
      if (!appId) {
        throw new Error("Missing VITE_ZEGO_APP_ID in frontend environment.");
      }

      if (!silent) setLoading(true);
      const [sessionRes, bookingRes] = await Promise.all([
        api.post("/sessions/token", { bookingId, join, appId }),
        api.get(`/bookings/${bookingId}`)
      ]);

      setSession(sessionRes.data.session);
      setBooking(bookingRes.data.booking);
      setPresence({
        student: Boolean(sessionRes.data.session.studentJoinedAt),
        teacher: Boolean(sessionRes.data.session.teacherJoinedAt)
      });
      setError("");
      return sessionRes.data.session;
    },
    [bookingId]
  );

  const destroyZego = useCallback(() => {
    if (zegoRef.current) {
      zegoRef.current.destroy();
      zegoRef.current = null;
      joinedZegoRoomRef.current = "";
    }
  }, []);

  const joinZegoRoom = useCallback(() => {
    if (!containerRef.current || !session?.zego?.token || !session?.room || !isLive || isClosed) return;
    if (joinedZegoRoomRef.current === session.room) return;

    destroyZego();
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
      Number(session.zego.appId || appId),
      session.zego.token,
      session.room,
      session.zego.userId,
      session.zego.userName || user?.name || "DoubtBridge user"
    );
    const zego = ZegoUIKitPrebuilt.create(kitToken);
    zegoRef.current = zego;
    joinedZegoRoomRef.current = session.room;

    zego.joinRoom({
      container: containerRef.current,
      maxUsers: 2,
      scenario: { mode: ZegoUIKitPrebuilt.VideoConference },
      showPreJoinView: false,
      turnOnCameraWhenJoining: true,
      turnOnMicrophoneWhenJoining: true,
      showRoomTimer: false,
      showTextChat: true,
      showUserList: true,
      showScreenSharingButton: true,
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: true,
      showLeaveRoomConfirmDialog: true,
      showLeavingView: false,
      showRoomDetailsButton: false,
      showInviteToCohostButton: false,
      showRemoveUserButton: false,
      layout: "Auto",
      videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
      screenSharingConfig: { resolution: "1080p", frameRate: 15 },
      branding: { logoURL: "" },
      onJoinRoom: () => {
        socket.emit("join:booking", { bookingId });
        setPresence((prev) => ({ ...prev, [user?.role]: true }));
      },
      onLeaveRoom: () => {
        socket.emit("leave:booking", { bookingId });
        joinedZegoRoomRef.current = "";
      },
      onUserJoin: (users) => {
        if (users?.length) {
          setPresence((prev) => ({ ...prev, [otherRole]: true }));
        }
      },
      onUserLeave: () => {
        setPresence((prev) => ({ ...prev, [otherRole]: false }));
      }
    });
  }, [bookingId, destroyZego, isClosed, isLive, otherRole, session, user?.name, user?.role]);

  useEffect(() => {
    const join = !requestedJoinRef.current;
    requestedJoinRef.current = true;
    loadClassroom({ join })
      .catch((err) => {
        const message = err.response?.data?.message || err.message || "Unable to open this classroom.";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));

    return () => destroyZego();
  }, [destroyZego, loadClassroom]);

  useEffect(() => {
    if (!session || isClosed) return undefined;
    const tick = () => {
      const target = getTimerTarget(session);
      if (!target) {
        setTimerSeconds(null);
        return;
      }
      const next = Math.max(Math.floor((new Date(target).getTime() - Date.now()) / 1000), 0);
      setTimerSeconds(next);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isClosed, session]);

  useEffect(() => {
    if (!isWaiting || isClosed) return undefined;
    const interval = setInterval(() => {
      loadClassroom({ join: false, silent: true }).catch(() => {});
    }, 4500);
    return () => clearInterval(interval);
  }, [isClosed, isWaiting, loadClassroom]);

  useEffect(() => {
    if (!isLive || isClosed || timerSeconds === null || timerSeconds > 0 || autoEndRequestedRef.current) return;
    autoEndRequestedRef.current = true;
    api.patch(`/bookings/${bookingId}/complete`).catch(() => {});
    destroyZego();
    setSession((prev) => ({ ...(prev || {}), sessionStatus: "completed", expiresAt: new Date().toISOString() }));
    if (isStudent) setShowFeedback(true);
  }, [bookingId, destroyZego, isClosed, isLive, isStudent, timerSeconds]);

  useEffect(() => {
    if (!bookingId || !user?.id) return undefined;
    connectSocket();
    socket.emit("join:booking", { bookingId });
    socket.emit("session:timer:sync", { bookingId });

    const onConnect = () => setConnectionState("connected");
    const onDisconnect = () => setConnectionState("reconnecting");
    const onConnectError = () => setConnectionState("reconnecting");
    const onTimer = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setTimerSeconds(payload.remainingSeconds);
    };
    const onStarted = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setSession((prev) => ({
        ...(prev || {}),
        sessionStatus: "live",
        actualStartedAt: payload.startedAt || prev?.actualStartedAt,
        expiresAt: payload.expiresAt || prev?.expiresAt,
        teacherJoinedAt: payload.teacherJoinedAt || prev?.teacherJoinedAt,
        studentJoinedAt: payload.studentJoinedAt || prev?.studentJoinedAt
      }));
      loadClassroom({ join: false, silent: true }).catch(() => {});
      if (!startToastShownRef.current) {
        startToastShownRef.current = true;
        showSessionToast({ title: "Class started", message: "Both participants are in the live classroom." });
      }
    };
    const onEnded = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      destroyZego();
      setSession((prev) => ({
        ...(prev || {}),
        sessionStatus: payload.sessionStatus || "completed",
        expiresAt: payload.endedAt || new Date().toISOString()
      }));
      if (!endToastShownRef.current) {
        endToastShownRef.current = true;
        showSessionToast({ title: "Class ended", message: "The live session has ended." });
      }
      if (isStudent) setShowFeedback(true);
    };
    const onUserJoined = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setPresence((prev) => ({ ...prev, [payload.role]: true }));
    };
    const onUserLeft = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setPresence((prev) => ({ ...prev, [payload.role]: false }));
    };
    const onExtended = (payload) => {
      if (String(payload.bookingId) !== String(bookingId)) return;
      setDismissExtendPrompt(true);
      setSelectedExtensionMinutes(null);
      setSession((prev) => ({
        ...(prev || {}),
        sessionStatus: payload.sessionStatus || prev?.sessionStatus || "live",
        expiresAt: payload.expiresAt || prev?.expiresAt
      }));
      loadClassroom({ join: false, silent: true }).catch(() => {});
      toast.success(`Session extended by ${payload.minutes || "extra"} minutes.`);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("session:timer", onTimer);
    socket.on("session:start", onStarted);
    socket.on("session:end", onEnded);
    socket.on("session:user-joined", onUserJoined);
    socket.on("session:user-left", onUserLeft);
    socket.on("session:extended", onExtended);

    return () => {
      socket.emit("leave:booking", { bookingId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("session:timer", onTimer);
      socket.off("session:start", onStarted);
      socket.off("session:end", onEnded);
      socket.off("session:user-joined", onUserJoined);
      socket.off("session:user-left", onUserLeft);
      socket.off("session:extended", onExtended);
    };
  }, [bookingId, destroyZego, isStudent, loadClassroom, user?.id]);

  useEffect(() => {
    if (isLive) joinZegoRoom();
  }, [isLive, joinZegoRoom]);

  const leaveClass = () => {
    destroyZego();
    socket.emit("leave:booking", { bookingId });
    navigate(user?.role === "teacher" ? "/teacher/history" : "/student");
  };

  const endSession = async () => {
    setEnding(true);
    try {
      await api.patch(`/bookings/${bookingId}/complete`);
      destroyZego();
      setConfirmEndOpen(false);
      setSession((prev) => ({ ...(prev || {}), sessionStatus: "completed", expiresAt: new Date().toISOString() }));
      toast.success("Session ended for everyone.");
      if (isStudent) setShowFeedback(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not end the session.");
    } finally {
      setEnding(false);
    }
  };

  const payAndExtendSession = async (minutes) => {
    setExtending(true);
    try {
      const orderRes = await api.post("/payments/create-order", {
        bookingId,
        purpose: "extension",
        extensionMinutes: minutes,
        amount: Number(booking?.extension_prices?.[minutes] || 0)
      });
      const order = orderRes.data.order;
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Razorpay checkout could not be loaded. Please retry.");

      const instance = new window.Razorpay({
        ...razorpayTestOptions,
        key: orderRes.data.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "DoubtBridge",
        description: `${minutes} min live class extension`,
        order_id: order.id,
        handler: async (response) => {
          const { data } = await api.post("/payments/verify", {
            bookingId,
            purpose: "extension",
            extensionMinutes: minutes,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });

          const nextExpiresAt = data.extension?.expires_at || data.extension?.expiresAt;
          setDismissExtendPrompt(true);
          setSelectedExtensionMinutes(null);
          setSession((prev) => ({ ...(prev || {}), sessionStatus: "live", expiresAt: nextExpiresAt || prev?.expiresAt }));
          await loadClassroom({ join: false, silent: true }).catch(() => {});
          showPaymentSuccessToast({ amount: data.extension?.amount || extensionPrice });
        },
        prefill: { name: booking?.student_name || "" },
        theme: { color: "#2563eb" },
        modal: { ondismiss: () => setExtending(false) }
      });

      instance.on("payment.failed", (response) => {
        showPaymentFailureToast(response?.error?.description || "Extension payment failed. Please retry.");
        setExtending(false);
      });
      instance.open();
    } catch (err) {
      showPaymentFailureToast(err.response?.data?.message || err.message || "Could not start extension payment.");
    } finally {
      setExtending(false);
    }
  };

  const submitReview = async () => {
    try {
      await api.post("/reviews", { bookingId, rating, review });
      toast.success("Thanks for rating your mentor.");
      navigate("/student");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save review.");
    }
  };

  const toggleFullscreen = async () => {
    const root = document.querySelector("[data-live-classroom]");
    if (!root) return;
    if (!document.fullscreenElement) {
      await root.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-2xl bg-slate-950 text-white">
        <div className="text-center">
          <FaSpinner className="mx-auto animate-spin text-3xl text-cyan-300" />
          <p className="mt-4 text-sm font-semibold text-white/70">Securing your live classroom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-card">
        <FaExclamationTriangle className="mx-auto text-3xl text-rose-500" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Classroom unavailable</h1>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div data-live-classroom className="h-[calc(100dvh-1rem)] overflow-hidden rounded-2xl bg-[#070b13] text-white shadow-2xl">
      <div className="flex h-full flex-col">
        <header className="z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0f172a]/95 px-4 py-3 backdrop-blur md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" title="Back">
              <FaArrowLeft />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold md:text-xl">DoubtBridge Live Classroom</h1>
              <p className="truncate text-xs text-white/55">
                {ownName || user?.name || "You"} with {otherName || (isTeacher ? "Student" : "Teacher")} | Room {session?.room}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${connectionState === "connected" ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-100"}`}>
              <FaBroadcastTower />
              {connectionState === "connected" ? "Connected" : "Reconnecting"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white">
              <FaClock />
              {timerLabel}: {formatTimer(timerSeconds)}
            </span>
            <button onClick={toggleFullscreen} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              <FaExpand />
            </button>
            <button onClick={leaveClass} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20">
              <FaDoorOpen />
              Leave
            </button>
            <button onClick={() => setConfirmEndOpen(true)} disabled={ending || isClosed} className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-500 disabled:opacity-60">
              <FaPhoneSlash />
              End
            </button>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden bg-[#111827]">
          <div ref={containerRef} className={`h-full w-full ${isLive ? "block" : "hidden"}`} />

          <AnimatePresence>
            {isWaiting ? (
              <motion.section className="absolute inset-0 z-10 grid place-items-center bg-[#0b0f19] p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-full max-w-4xl">
                  <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100">
                    <FaShieldAlt className="mr-2 inline" />
                    Secure waiting room active. The class starts automatically when the booked student and assigned teacher are both present.
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {participantCards.map((participant) => (
                      <motion.div key={participant.role} className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-center shadow-2xl" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <Avatar src={participant.avatar} name={participant.name} className="mx-auto h-20 w-20 border-white/30" textClassName="text-lg" hover={false} />
                        <p className="mt-4 text-lg font-bold">{participant.name}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/40">{participant.label}</p>
                        <span className={`mt-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${participant.joined ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/60"}`}>
                          {participant.joined ? <FaCheckCircle /> : <FaSpinner className="animate-spin" />}
                          {participant.joined ? "Ready" : "Waiting"}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>

          {isClosed && !(isStudent && showFeedback) ? (
            <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950/85 p-5 backdrop-blur">
              <div className="max-w-md rounded-2xl border border-white/10 bg-white p-6 text-center text-slate-900 shadow-2xl">
                <FaPhoneSlash className="mx-auto text-3xl text-rose-500" />
                <h2 className="mt-4 text-2xl font-bold">Session ended</h2>
                <p className="mt-2 text-sm text-slate-600">This classroom is closed for the current booking.</p>
                <button onClick={() => navigate(user?.role === "teacher" ? "/teacher/history" : "/student")} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
                  Back to dashboard
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {shouldOfferExtension ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white">
                <FaClock />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Want to extend the session?</h2>
                <p className="mt-1 text-sm text-slate-600">Only {formatTimer(timerSeconds)} left. Add time now so the live class continues without interruption.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[15, 30, 45].map((minutes) => (
                <button key={minutes} type="button" disabled={extending} onClick={() => setSelectedExtensionMinutes(minutes)} className={`rounded-2xl border px-4 py-4 text-left transition disabled:opacity-60 ${selectedExtensionMinutes === minutes ? "border-blue-600 bg-blue-50 text-blue-700 shadow-card" : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"}`}>
                  <span className="block text-lg font-extrabold">{minutes} min</span>
                  <span className="mt-1 block text-sm font-bold text-slate-500">Rs. {booking?.extension_prices?.[minutes] || "--"}</span>
                </button>
              ))}
            </div>
            {selectedExtensionMinutes ? (
              <button disabled={extending} onClick={() => payAndExtendSession(selectedExtensionMinutes)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
                <FaCreditCard />
                {extending ? "Opening payment..." : `Pay Rs. ${extensionPrice || "--"} and extend`}
              </button>
            ) : null}
            <button onClick={() => setDismissExtendPrompt(true)} className="mt-3 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
              No thanks
            </button>
          </div>
        </div>
      ) : null}

      {isStudent && showFeedback ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="text-center">
              <FaCheckCircle className="mx-auto text-4xl text-emerald-500" />
              <h2 className="mt-4 text-2xl font-bold">Session completed</h2>
              <p className="mt-2 text-sm text-slate-600">Rate your mentor and head back to your dashboard.</p>
            </div>
            <div className="mt-5 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} className={value <= rating ? "text-amber-400" : "text-slate-300"}>
                  <FaStar className="text-3xl" />
                </button>
              ))}
            </div>
            <textarea value={review} onChange={(event) => setReview(event.target.value)} rows={4} placeholder="Write a short review..." className="mt-5 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
            <button onClick={submitReview} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">
              Submit Rating
            </button>
            <button onClick={() => navigate("/student")} className="mt-3 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : null}

      {confirmEndOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 text-center text-slate-900 shadow-2xl">
            <FaVideo className="mx-auto text-3xl text-rose-500" />
            <h2 className="mt-4 text-2xl font-bold">End session for everyone?</h2>
            <p className="mt-2 text-sm text-slate-600">This marks the booking completed and closes the live classroom for both participants.</p>
            <button onClick={endSession} disabled={ending} className="mt-6 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
              {ending ? "Ending..." : "End Session"}
            </button>
            <button onClick={() => setConfirmEndOpen(false)} className="mt-3 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
              Keep Class Open
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LiveClassroom;
