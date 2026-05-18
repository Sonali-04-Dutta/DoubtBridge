import { useEffect, useMemo, useRef, useState } from "react";
import { FaComments, FaPaperPlane } from "react-icons/fa";
import toast from "react-hot-toast";
import Avatar from "../../components/common/Avatar";
import EmptyState from "../../components/common/EmptyState";
import GlassCard from "../../components/common/GlassCard";
import PageLoader from "../../components/common/PageLoader";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

const TeacherIntroInboxPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef(null);

  const selectedStudentId = selectedConversation?.studentId || null;

  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const loadConversations = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingConversations(true);
      setError("");
    }

    try {
      const { data } = await api.get("/teachers/intro-conversations");
      const nextConversations = data.conversations || [];
      setConversations(nextConversations);
      setTotalUnread(data.totalUnread || 0);
      setSelectedConversation((prev) => {
        if (!nextConversations.length) return null;
        if (!prev) return nextConversations[0];
        return nextConversations.find((item) => item.studentId === prev.studentId) || nextConversations[0];
      });
    } catch (requestError) {
      if (!silent) {
        setError(requestError.response?.data?.message || "Could not load student conversations.");
      }
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  const loadMessages = async (studentId, { silent = false } = {}) => {
    if (!silent) setLoadingMessages(true);

    try {
      const { data } = await api.get(`/teachers/intro-conversations/${studentId}/messages`);
      setMessages(data.messages || []);
    } catch (requestError) {
      if (!silent) {
        toast.error(requestError.response?.data?.message || "Could not load chat messages.");
      }
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    loadMessages(selectedStudentId);
  }, [selectedStudentId]);

  useEffect(() => {
    if (!selectedStudentId) return undefined;

    const timer = setInterval(() => {
      loadConversations({ silent: true });
      loadMessages(selectedStudentId, { silent: true });
    }, 9000);

    return () => clearInterval(timer);
  }, [selectedStudentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendReply = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || !selectedStudentId) return;

    setSending(true);
    try {
      const { data } = await api.post(`/teachers/intro-conversations/${selectedStudentId}/messages`, {
        message: trimmed
      });
      setMessages((prev) => [...prev, data.entry]);
      setMessageText("");
      toast.success("Reply sent.");
      loadConversations({ silent: true });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Could not send reply.");
    } finally {
      setSending(false);
    }
  };

  const activeConversationTitle = useMemo(() => {
    if (!selectedConversation) return "Select a student conversation";
    return selectedConversation.studentName;
  }, [selectedConversation]);

  if (loadingConversations) {
    return <PageLoader message="Loading messages inbox..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Inbox unavailable"
        description={error}
        action={
          <button
            type="button"
            onClick={loadConversations}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
          <FaComments />
          Messages
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Student Conversations</h1>
        <p className="mt-1 text-sm text-slate-600">
          Reply to incoming doubts before and after booking.
          <span className="ml-2 font-semibold text-brand-700">Unread: {totalUnread}</span>
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <GlassCard className="p-4 lg:col-span-1" hover={false}>
          <h2 className="text-lg font-bold text-slate-900">Conversations</h2>
          <div className="soft-scrollbar mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {conversations.length ? (
              conversations.map((conversation) => {
                const isActive = conversation.studentId === selectedStudentId;
                return (
                  <button
                    key={conversation.studentId}
                    type="button"
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      isActive ? "border-brand-300 bg-brand-50" : "border-white/60 bg-white/75 hover:border-brand-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={conversation.studentAvatarUrl} name={conversation.studentName} className="h-10 w-10" textClassName="text-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{conversation.studentName}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{conversation.lastMessage}</p>
                        <p className="mt-1 text-[11px] font-semibold text-brand-700">
                          Free usage: {conversation.freeMessagesSent}/{conversation.freeLimit}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="rounded-xl bg-white/70 px-3 py-3 text-sm text-slate-500">No student messages yet.</p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="flex min-h-[560px] flex-col p-4 lg:col-span-2" hover={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">{activeConversationTitle}</h2>
            {selectedConversation ? (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {selectedConversation.isPaid ? "Paid chat unlocked" : `${selectedConversation.remainingFreeMessages} free left`}
              </span>
            ) : null}
          </div>

          <div className="soft-scrollbar mt-3 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-white/75 p-3">
            {!selectedConversation ? (
              <p className="text-sm text-slate-500">Choose a student conversation from the left panel.</p>
            ) : loadingMessages ? (
              <p className="text-sm text-slate-500">Loading messages...</p>
            ) : messages.length ? (
              messages.map((entry) => {
                const mine = entry.senderRole === "teacher";
                return (
                  <div key={entry.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                    {!mine ? (
                      <Avatar src={selectedConversation.studentAvatarUrl} name={selectedConversation.studentName} className="h-7 w-7 border-brand-200" textClassName="text-[10px]" hover={false} />
                    ) : null}
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        mine ? "bg-brand-600 text-white" : "border border-brand-100 bg-brand-50 text-slate-700"
                      }`}
                    >
                      <p>{entry.message}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-slate-500"}`}>{formatTime(entry.createdAt)}</p>
                    </div>
                    {mine ? (
                      <Avatar src={user?.avatar_url} name={user?.name} className="h-7 w-7 border-brand-200" textClassName="text-[10px]" hover={false} />
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No messages yet in this conversation.</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={selectedConversation ? "Write a helpful reply..." : "Select a conversation first"}
              disabled={!selectedConversation}
              className="w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={sendReply}
              disabled={sending || !selectedConversation}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
            >
              <FaPaperPlane />
              Send
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default TeacherIntroInboxPage;
