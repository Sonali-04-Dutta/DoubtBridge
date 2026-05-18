import { useEffect, useState } from "react";
import { connectSocket, socket } from "../lib/socket";

export const useTeacherPresence = (initialTeachers = []) => {
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    setStatuses((prev) => {
      const next = { ...prev };
      initialTeachers.forEach((teacher) => {
        if (teacher?.userId && !next[teacher.userId]) {
          next[teacher.userId] = teacher.status || teacher.availability || "offline";
        }
      });
      return next;
    });
  }, [initialTeachers]);

  useEffect(() => {
    connectSocket();
    const onStatus = (payload) => {
      if (!payload?.userId) return;
      setStatuses((prev) => ({
        ...prev,
        [payload.userId]: payload.status || payload.availability || "offline"
      }));
    };

    socket.on("teacher:status-updated", onStatus);
    socket.on("teacher:presence", onStatus);
    return () => {
      socket.off("teacher:status-updated", onStatus);
      socket.off("teacher:presence", onStatus);
    };
  }, []);

  return statuses;
};
