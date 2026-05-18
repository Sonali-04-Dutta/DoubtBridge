const FREE_MESSAGE_WINDOW_HOURS = 12;

export const FREE_MESSAGE_WINDOW_MS = FREE_MESSAGE_WINDOW_HOURS * 60 * 60 * 1000;

export const refreshFreeMessageWindow = (conversation, now = new Date()) => {
  if (!conversation || conversation.isPaid) return conversation;

  const currentWindowStartedAt = conversation.studentFreeMessageWindowStartedAt
    ? new Date(conversation.studentFreeMessageWindowStartedAt).getTime()
    : null;

  if (!currentWindowStartedAt || now.getTime() - currentWindowStartedAt >= FREE_MESSAGE_WINDOW_MS) {
    conversation.studentFreeMessageCount = 0;
    conversation.studentFreeMessageWindowStartedAt = now;
  }

  return conversation;
};

export const getFreeMessageWindowEndsAt = (conversation) => {
  if (!conversation?.studentFreeMessageWindowStartedAt || conversation.isPaid) return null;
  return new Date(new Date(conversation.studentFreeMessageWindowStartedAt).getTime() + FREE_MESSAGE_WINDOW_MS);
};
