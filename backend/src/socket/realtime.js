let ioInstance = null;

export const setRealtimeServer = (io) => {
  ioInstance = io;
};

export const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

export const emitToBooking = (bookingId, event, payload) => {
  if (!ioInstance || !bookingId) return;
  ioInstance.to(`booking:${bookingId}`).emit(event, payload);
};

export const emitToAll = (event, payload) => {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
};
