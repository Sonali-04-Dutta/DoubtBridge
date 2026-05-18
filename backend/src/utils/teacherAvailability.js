export const buildTeacherBusyBookingFilter = (teacherUserId, excludeBookingId = null) => {
  const now = new Date();
  const filter = {
    teacher_id: teacherUserId,
    status: "paid",
    session_status: { $in: ["scheduled", "live"] },
    $or: [
      { session_status: "live", expires_at: { $gt: now } },
      { session_status: "live", expires_at: null },
      { session_status: "scheduled", join_deadline_at: { $gt: now } },
      { session_status: "scheduled", join_deadline_at: null }
    ]
  };

  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }

  return filter;
};
