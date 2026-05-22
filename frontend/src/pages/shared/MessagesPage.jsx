import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCalendarCheck,
  FaComments,
  FaLock,
  FaPaperPlane
} from "react-icons/fa";

import toast from "react-hot-toast";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Avatar from "../../components/common/Avatar";
import EmptyState from "../../components/common/EmptyState";
import GlassCard from "../../components/common/GlassCard";
import PageLoader from "../../components/common/PageLoader";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../lib/api";
import { connectSocket, socket } from "../../lib/socket";

const defaultMeta = {
  paidUnlocked: false,
  freeLimit: 6,
  freeMessagesSent: 0,
  remainingFreeMessages: 6,
  canSendMessage: true,
  freeWindowEndsAt: null,
  lockMessage:
    "Free message limit reached. Book session to continue."
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

const MessagesPage = () => {
  const { user } = useAuth();
  const { loadNotifications } = useNotifications();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const [conversations, setConversations] =
    useState([]);

  const [selectedId, setSelectedId] =
    useState(null);

  const [messages, setMessages] = useState([]);

  const [meta, setMeta] =
    useState(defaultMeta);

  const [
    loadingConversations,
    setLoadingConversations
  ] = useState(true);

  const [
    loadingMessages,
    setLoadingMessages
  ] = useState(false);

  const [sending, setSending] =
    useState(false);

  const [draft, setDraft] = useState("");

  const [error, setError] = useState("");

  const [didTeacherStart, setDidTeacherStart] =
    useState(false);

  const messagesEndRef = useRef(null);
  const selectedIdRef = useRef(null);
  const joinedConversationIdsRef = useRef(new Set());

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (item) => item.id === selectedId
      ) || null,
    [conversations, selectedId]
  );

  const messageItems = useMemo(() => {
    let lastDateLabel = "";

    return messages.map((entry) => {
      const dateLabel = formatDateDivider(entry.createdAt);
      const showDate = Boolean(dateLabel && dateLabel !== lastDateLabel);
      if (showDate) lastDateLabel = dateLabel;

      return { entry, dateLabel, showDate };
    });
  }, [messages]);

  const isStudent =
    user?.role === "student";

  const isLocked =
    isStudent &&
    !meta.canSendMessage &&
    !meta.paidUnlocked;

  const statusText = useMemo(() => {
    if (!isStudent)
      return "Select a student and reply from the same conversation thread.";

    if (meta.paidUnlocked)
      return "Unlimited chat unlocked after payment.";

    if (meta.canSendMessage)
      return `Free messages remaining: ${meta.remainingFreeMessages}/${meta.freeLimit}`;

    if (meta.freeWindowEndsAt) {
      return `Free limit reached. 6 more messages unlock after ${formatTime(meta.freeWindowEndsAt, true)}.`;
    }

    return meta.lockMessage || defaultMeta.lockMessage;
  }, [isStudent, meta]);

  function formatTime(value, long = false) {
    if (!value) return "";

    const date = new Date(value);

    if (long) {
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const normalizeSocketMessage = (payload) =>
    payload?.entry || payload;

  const refreshConversationPreview = (message) => {
    if (!message?.conversationId) return;

    setConversations((prev) => {
      const updatedAt =
        message.createdAt ||
        new Date().toISOString();

      const next = prev.map((item) =>
        item.id === message.conversationId
          ? {
              ...item,
              latestMessage:
                message.message ||
                message.text ||
                item.latestMessage,
              latestMessageAt: updatedAt,
              latestMessageRole:
                message.senderRole ||
                item.latestMessageRole
            }
          : item
      );

      return next.sort(
        (a, b) =>
          new Date(
            b.latestMessageAt || b.updatedAt || 0
          ) -
          new Date(
            a.latestMessageAt || a.updatedAt || 0
          )
      );
    });
  };

  const loadConversations = async ({
    silent = false
  } = {}) => {
    if (!silent) {
      setLoadingConversations(true);
      setError("");
    }

    try {
      const { data } = await api.get(
        "/messages/conversations"
      );

      const nextConversations =
        data.conversations || [];

      setConversations(nextConversations);

      nextConversations.forEach(
        (conversation) => {
          if (
            !joinedConversationIdsRef.current.has(
              conversation.id
            )
          ) {
            socket.emit(
              "join:conversation",
              {
                conversationId:
                  conversation.id
              }
            );

            joinedConversationIdsRef.current.add(
              conversation.id
            );
          }
        }
      );

      setSelectedId((prev) => {
        if (!nextConversations.length)
          return null;

        if (
          prev &&
          nextConversations.some(
            (item) => item.id === prev
          )
        ) {
          return prev;
        }

        const searchConversationId =
          searchParams.get("conversationId");

        if (
          searchConversationId &&
          nextConversations.some(
            (item) =>
              item.id ===
              searchConversationId
          )
        ) {
          return searchConversationId;
        }

        return nextConversations[0].id;
      });
    } catch (requestError) {
      if (!silent) {
        setError(
          requestError.response?.data
            ?.message ||
            "Could not load conversations."
        );
      }
    } finally {
      if (!silent)
        setLoadingConversations(false);
    }
  };

  const loadMessages = async (
    conversationId,
    { silent = false } = {}
  ) => {
    if (!conversationId) return;

    if (!silent)
      setLoadingMessages(true);

    try {
      const { data } = await api.get(
        `/messages/conversations/${conversationId}`
      );

      setMessages(data.messages || []);

      setMeta(data.meta || defaultMeta);

      loadNotifications?.().catch(() => {});
    } catch (requestError) {
      if (!silent) {
        toast.error(
          requestError.response?.data
            ?.message ||
            "Could not load messages."
        );
      }
    } finally {
      if (!silent)
        setLoadingMessages(false);
    }
  };

  const maybeStartConversationFromMentor =
    async () => {
      const teacherId =
        searchParams.get("teacherId");

      if (
        !teacherId ||
        didTeacherStart
      )
        return;

      if (!isStudent) {
        setDidTeacherStart(true);

        toast.error(
          "Please log in as a student."
        );

        navigate("/messages", {
          replace: true
        });

        return;
      }

      setDidTeacherStart(true);

      try {
        const { data } = await api.post(
          "/messages/start",
          {
            teacherProfileId:
              teacherId
          }
        );

        if (data?.conversation?.id) {
          setSelectedId(
            data.conversation.id
          );
        }

        await loadConversations({
          silent: true
        });

        toast.success(
          "Conversation ready."
        );
      } catch (requestError) {
        toast.error(
          requestError.response?.data
            ?.message ||
            "Could not start conversation."
        );
      }
    };

  const sendMessage = async () => {
    const text = draft.trim();

    if (!selectedId || !text) return;

    if (isLocked) {
      toast.error(
        meta.lockMessage ||
          defaultMeta.lockMessage
      );

      return;
    }

    setSending(true);

    try {
      const { data } = await api.post(
        `/messages/conversations/${selectedId}`,
        { text }
      );

      setMessages((prev) => [
        ...prev,
        data.entry
      ]);

      socket.emit(
        "conversation:message",
        {
          entry: data.entry,
          conversationId: selectedId
        }
      );

      refreshConversationPreview(
        data.entry
      );

      setMeta(data.meta || meta);

      setDraft("");

      loadConversations({
        silent: true
      });
    } catch (requestError) {
      toast.error(
        requestError.response?.data
          ?.message ||
          "Could not send message."
      );
    } finally {
      setSending(false);
    }
  };

  const handleDraftKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    if (!sending) {
      sendMessage();
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!user) return;

    connectSocket();

    return () => {
      joinedConversationIdsRef.current.clear();
    };
  }, [user]);

  useEffect(() => {
    maybeStartConversationFromMentor();
  }, [isStudent, didTeacherStart]);

  useEffect(() => {
    if (!selectedId) return;

    selectedIdRef.current = selectedId;

    loadMessages(selectedId);

    socket.emit(
      "join:conversation",
      {
        conversationId: selectedId
      }
    );

    joinedConversationIdsRef.current.add(
      selectedId
    );
  }, [selectedId]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const handleConversationMessage = (
      payload
    ) => {
      const message =
        normalizeSocketMessage(payload);

      if (!message?.conversationId) return;

      refreshConversationPreview(message);

      if (
        message.conversationId !==
        selectedIdRef.current
      ) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some(
          (item) =>
            item.id === message.id
        );

        if (exists) return prev;

        return [...prev, message];
      });

      if (String(message.senderId) !== String(user?.id)) {
        window.setTimeout(() => {
          loadMessages(message.conversationId, { silent: true });
        }, 350);
      }
    };

    socket.on(
      "conversation:message",
      handleConversationMessage
    );

    return () => {
      socket.off(
        "conversation:message",
        handleConversationMessage
      );
    };
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  if (loadingConversations) {
    return (
      <PageLoader message="Loading conversations..." />
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Messages unavailable"
        description={error}
      />
    );
  }

  return (
    <div className="space-y-5">

      <motion.div
        initial={{
          opacity: 0,
          y: 14
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-card"
      >
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
          <FaComments />
          Messages
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Mentor-Student Chat
        </h1>

        <p
          className={`mt-1 text-sm font-semibold ${
            isLocked
              ? "text-rose-600"
              : "text-brand-700"
          }`}
        >
          {statusText}
        </p>
      </motion.div>

      <div className="grid gap-5 lg:h-[calc(100vh-230px)] lg:min-h-[520px] lg:grid-cols-3">

        <GlassCard
          className="min-h-0 p-4 lg:col-span-1"
          hover={false}
        >
          <h2 className="text-lg font-bold text-slate-900">
            Conversations
          </h2>

          <div className="soft-scrollbar mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1 lg:max-h-none lg:h-[calc(100%-44px)]">

            {conversations.length ? (
              conversations.map(
                (conversation) => {

                  const isActive =
                    selectedId ===
                    conversation.id;

                  return (
                    <button
                      key={
                        conversation.id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedId(
                          conversation.id
                        )
                      }
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        isActive
                          ? "border-brand-300 bg-brand-50"
                          : "border-white/70 bg-white/75 hover:border-brand-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">

                        <Avatar
                          src={
                            conversation.counterpartAvatarUrl
                          }
                          name={
                            conversation.counterpartName
                          }
                          className="h-10 w-10 border-brand-200"
                          textClassName="text-xs"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {
                              conversation.counterpartName
                            }
                          </p>

                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                            {conversation.latestMessage ||
                              "No messages yet"}
                          </p>

                          <p className="mt-1 text-[11px] text-brand-700">
                            {formatTime(
                              conversation.latestMessageAt,
                              true
                            )}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                }
              )
            ) : (
              <p className="rounded-xl bg-white/75 px-3 py-3 text-sm text-slate-600">
                No conversations yet.
              </p>
            )}

          </div>
        </GlassCard>

        <GlassCard
          className="flex min-h-[580px] flex-col p-4 lg:col-span-2 lg:min-h-0"
          hover={false}
        >

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              {selectedConversation ? (
                <Avatar
                  src={
                    selectedConversation.counterpartAvatarUrl
                  }
                  name={
                    selectedConversation.counterpartName
                  }
                  className="h-10 w-10 border-brand-200"
                />
              ) : null}

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedConversation?.counterpartName ||
                    "Select conversation"}
                </h2>

                <p className="text-xs text-green-600">
                  {selectedConversation
                    ? selectedConversation.counterpartRole ===
                      "teacher"
                      ? selectedConversation.teacherAvailability ||
                        "offline"
                      : "student"
                    : ""}
                </p>
              </div>
            </div>

            {selectedConversation &&
            isStudent &&
            selectedConversation.teacherProfileId ? (
              <Link
                to={`/student/booking/${selectedConversation.teacherProfileId}`}
                onClick={(event) => {
                  if (selectedConversation.teacherAvailability !== "online") {
                    event.preventDefault();
                    toast.error("This teacher is busy or offline right now. Please try later.");
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-glow ${
                  selectedConversation.teacherAvailability === "online" ? "bg-brand-600" : "bg-slate-400"
                }`}
              >
                <FaCalendarCheck />
                Book Session
              </Link>
            ) : null}
          </div>

          <div className="soft-scrollbar mt-4 min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl bg-gradient-to-b from-[#f8f5ff] to-[#eef2ff] p-4">

            {!selectedConversation ? (

              <p className="text-sm text-slate-500">
                Select a conversation.
              </p>

            ) : loadingMessages ? (

              <p className="text-sm text-slate-500">
                Loading messages...
              </p>

            ) : messages.length ? (

              messageItems.map(({ entry, dateLabel, showDate }) => {

                const mine =
                  String(entry.senderId) ===
                  String(user.id);

                const senderName = mine
                  ? user?.name || "You"
                  : entry.senderName ||
                    selectedConversation?.counterpartName ||
                    "User";

                const senderAvatar = mine
                  ? user?.avatar_url
                  : entry.senderAvatar ||
                    selectedConversation?.counterpartAvatarUrl;

                return (
                  <div
                    key={entry.id}
                    className="mb-4"
                  >
                    {showDate ? (
                      <div className="mb-4 flex justify-center">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-500 shadow-sm">
                          {dateLabel}
                        </span>
                      </div>
                    ) : null}

                    <div className={`flex w-full ${
                      mine
                        ? "justify-end"
                        : "justify-start"
                    }`}>
                      <div
                        className={`flex items-end gap-2 max-w-[65%] ${
                          mine
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}
                      >

                        <Avatar
                          src={senderAvatar}
                          name={senderName}
                          className="h-8 w-8 border border-brand-200 shadow-sm"
                          textClassName="text-[10px]"
                          hover={false}
                        />

                        <div
                          className={`rounded-2xl px-4 py-3 shadow-md ${
                            mine
                              ? "bg-brand-600 text-white rounded-br-sm"
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                          }`}
                        >

                          <p
                            className={`mb-1 text-[11px] font-bold ${
                              mine
                                ? "text-purple-100"
                                : "text-brand-700"
                            }`}
                          >
                            {senderName}
                          </p>

                          <p className="text-sm leading-relaxed break-words">
                            {entry.message}
                          </p>

                          <p
                            className={`mt-2 text-[10px] ${
                              mine
                                ? "text-purple-100"
                                : "text-slate-400"
                            }`}
                          >
                            {formatTime(
                              entry.createdAt
                            )}
                          </p>

                        </div>
                      </div>
                    </div>
                  </div>
                );
              })

            ) : (

              <p className="text-sm text-slate-500">
                No messages yet.
              </p>

            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="mt-4">

            <div className="flex gap-2">

              <input
                value={draft}
                onChange={(event) =>
                  setDraft(
                    event.target.value
                  )
                }
                onKeyDown={handleDraftKeyDown}
                placeholder={
                  isLocked
                    ? meta.lockMessage
                    : "Type your message..."
                }
                disabled={
                  !selectedConversation ||
                  isLocked
                }
                className="w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={
                  sending ||
                  !selectedConversation ||
                  isLocked
                }
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
              >
                {isLocked ? (
                  <FaLock />
                ) : (
                  <FaPaperPlane />
                )}

                Send
              </button>

            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default MessagesPage;
