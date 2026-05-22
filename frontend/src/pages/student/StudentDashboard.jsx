import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaBolt,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaFire,
  FaGraduationCap,
  FaReceipt,
  FaRupeeSign,
  FaSearch,
  FaStar,
  FaVideo
} from "react-icons/fa";

import Avatar from "../../components/common/Avatar";
import GlassCard from "../../components/common/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

const formatDate = (date) => {
  if (!date) return "Not scheduled";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));
};

const getStatusClass = (status) => {
  const classes = {
    pending:
      "bg-amber-100 text-amber-700",

    accepted:
      "bg-sky-100 text-sky-700",

    paid:
      "bg-emerald-100 text-emerald-700",

    completed:
      "bg-brand-100 text-brand-700",

    rejected:
      "bg-rose-100 text-rose-700"
  };

  return (
    classes[status] ||
    "bg-slate-100 text-slate-700"
  );
};

const isJoinWindowOpen = (booking) => {
  if (!booking?.join_deadline_at)
    return true;

  return (
    new Date(
      booking.join_deadline_at
    ).getTime() > Date.now()
  );
};

const canStudentJoin = (booking) =>
  booking.status === "paid" &&
  ["scheduled", "live"].includes(
    booking.session_status
  ) &&
  !booking.student_joined_at &&
  isJoinWindowOpen(booking);

const StudentDashboard = () => {

  const { user } = useAuth();

  const [bookings, setBookings] =
    useState([]);

  const [selectedTeacher, setSelectedTeacher] =
    useState(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  useEffect(() => {

    const load = async () => {

      const { data } =
        await api.get("/bookings/my");

      setBookings(data.bookings || []);
    };

    load().catch(() => {});

    const onBookingPaymentUpdated =
      () => load().catch(() => {});

    window.addEventListener(
      "booking-payment-updated",
      onBookingPaymentUpdated
    );

    return () =>
      window.removeEventListener(
        "booking-payment-updated",
        onBookingPaymentUpdated
      );

  }, []);

  const stats = useMemo(() => {

    const completed =
      bookings.filter(
        (booking) =>
          booking.status ===
          "completed"
      ).length;

    const paidOrCompleted =
      bookings.filter((booking) =>
        ["paid", "completed"].includes(
          booking.status
        )
      );

    const totalSpent =
      paidOrCompleted.reduce(
        (sum, booking) =>
          sum +
          Number(
            booking.amount || 0
          ),
        0
      );

    const totalMinutes =
      bookings.reduce(
        (sum, booking) =>
          sum +
          Number(
            booking.duration || 0
          ),
        0
      );

    return [
      [
        "Total Bookings",
        bookings.length,
        FaCalendarAlt
      ],

      [
        "Completed",
        completed,
        FaCheckCircle
      ],

      [
        "Study Time",
        `${totalMinutes} min`,
        FaClock
      ],

      [
        "Money Spent",
        `Rs. ${totalSpent}`,
        FaRupeeSign
      ]
    ];

  }, [bookings]);

  const upcomingBookings =
    useMemo(
      () =>
        bookings
          .filter(
            (booking) =>
              [
                "accepted",
                "paid",
                "pending"
              ].includes(
                booking.status
              ) &&
              ![
                "expired",
                "cancelled"
              ].includes(
                booking.session_status
              )
          )
          .slice(0, 3),
      [bookings]
    );

  const groupedBookings =
    bookings.reduce(
      (acc, booking) => {

        const teacher =
          booking.teacher_name ||
          "Teacher";

        if (!acc[teacher]) {

          acc[teacher] = {
            teacherName:
              teacher,

            teacherAvatar:
              booking.teacher_avatar_url,

            bookings: [],

            totalSpent: 0,

            totalMinutes: 0
          };
        }

        acc[
          teacher
        ].bookings.push(
          booking
        );

        acc[
          teacher
        ].totalSpent += Number(
          booking.amount || 0
        );

        acc[
          teacher
        ].totalMinutes += Number(
          booking.duration || 0
        );

        return acc;

      },
      {}
    );

  const teacherList =
    Object.values(
      groupedBookings
    );

  const filteredTeachers =
    teacherList.filter(
      (teacher) =>
        teacher.teacherName
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          )
    );

  const activeTeacher =
    teacherList.find(
      (teacher) =>
        teacher.teacherName ===
        selectedTeacher
    );

  return (

    <div className="space-y-6">

      {/* HERO */}

      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/75 p-5 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-white/5">

        <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">

          <div className="flex min-w-0 items-center gap-3">

            <Avatar
              src={user?.avatar_url}
              name={user?.name}
              className="h-12 w-12"
              textClassName="text-sm"
            />

            <div>

              <p className="text-sm font-bold text-brand-600">
                Welcome back,
                study star
              </p>

              <p className="break-words text-2xl font-extrabold text-slate-900 dark:text-white">
                {user?.name ||
                  "Student"}
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-300">
                Your next mentor
                session, streak,
                and learning
                actions are ready.
              </p>
            </div>
          </div>

          <Link
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-glow"
            to="/find-teachers"
          >
            <FaSearch />
            Find a mentor
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-3xl bg-brand-50/90 p-4 dark:bg-brand-500/10">

            <p className="flex items-center gap-2 text-sm font-bold text-brand-700 dark:text-brand-100">

              <FaFire />

              Study streak
            </p>

            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">

              {Math.max(
                1,
                upcomingBookings.length +
                  2
              )}{" "}
              days
            </p>
          </div>

          <div className="rounded-3xl bg-emerald-50/90 p-4 dark:bg-emerald-500/10">

            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-100">

              <FaGraduationCap />

              Progress
            </p>

            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">

              {Math.min(
                100,
                bookings.length * 12
              )}
              %
            </p>
          </div>

          <div className="rounded-3xl bg-amber-50/90 p-4 dark:bg-amber-500/10">

            <p className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-100">

              <FaBolt />

              Motivation
            </p>

            <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
              Small doubts solved
              daily become big
              confidence.
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {stats.map(
          ([label, value, Icon]) => (

            <GlassCard
              key={label}
              className="p-5"
            >

              <div className="flex items-center justify-between gap-3">

                <p className="text-sm text-slate-500">
                  {label}
                </p>

                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-600">

                  <Icon />
                </span>
              </div>

              <p className="mt-2 text-2xl font-bold text-brand-700">
                {value}
              </p>
            </GlassCard>
          )
        )}
      </section>

      {/* QUICK ACTIONS */}

      <section className="grid gap-3 sm:grid-cols-3">

        <Link
          className="rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card"
          to="/messages"
        >
          Messages
        </Link>

        <Link
          className="rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card"
          to="/notifications"
        >
          Notifications
        </Link>

        <Link
          className="rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card"
          to="/find-teachers"
        >
          Find Mentors
        </Link>
      </section>

      {/* UPCOMING */}

      {upcomingBookings.length ? (

        <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-card">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Next Actions
              </h2>

              <p className="text-sm text-slate-500">
                Keep recent booking
                requests and live
                sessions within
                reach.
              </p>
            </div>

            <Link
              className="inline-flex justify-center rounded-2xl bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-sm sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none"
              to="/find-teachers"
            >
              Book another
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">

            {upcomingBookings.map(
              (booking) => (

                <div
                  key={booking.id}
                  className="rounded-2xl bg-brand-50/80 p-4"
                >

                  <p className="text-sm font-bold text-slate-900">
                    {booking.teacher_name ||
                      "Teacher"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      booking.duration
                    }{" "}
                    min | Rs.{" "}
                    {booking.amount}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>

                    {booking.status ===
                    "accepted" ? (

                      <Link
                        className="text-xs font-bold text-brand-700"
                        to={`/student/payment/${booking.id}`}
                      >
                        Pay now
                      </Link>

                    ) : canStudentJoin(
                        booking
                      ) ? (

                      <Link
                        className="text-xs font-bold text-brand-700"
                        to={`/live-class/${booking.id}`}
                      >
                        Join
                      </Link>

                    ) : booking.status ===
                      "paid" ? (

                      <span className="text-xs font-bold capitalize text-slate-500">

                        {
                          booking.session_status
                        }
                      </span>

                    ) : null}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      ) : null}

      {/* NEW BOOKING HISTORY */}

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">

        {/* HEADER */}

        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">

          <div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Booking History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View all mentor
              sessions, payments,
              and learning records.
            </p>
          </div>

          <Link
            to="/find-teachers"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <FaSearch />
            Book Mentor
          </Link>
        </div>

        {teacherList.length ? (

          <div className="grid lg:grid-cols-[320px_1fr]">

            {/* LEFT */}

            <div className="border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-r">

              {/* SEARCH */}

              <div className="border-b border-slate-200 p-4">

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">

                  <FaSearch className="text-slate-400" />

                  <input
                    type="text"
                    placeholder="Search mentor..."
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(
                        e.target.value
                      )
                    }
                    className="w-full bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* TEACHERS */}

              <div className="space-y-3 p-3">

                {filteredTeachers.map(
                  (teacher) => {

                    const completedCount =
                      teacher.bookings.filter(
                        (
                          booking
                        ) =>
                          booking.status ===
                          "completed"
                      ).length;

                    return (

                      <button
                        key={
                          teacher.teacherName
                        }
                        onClick={() =>
                          setSelectedTeacher(
                            teacher.teacherName
                          )
                        }
                        className={`
                          group
                          w-full
                          rounded-3xl
                          border
                          p-4
                          text-left
                          transition-all
                          duration-300
                          hover:-translate-y-1
                          hover:shadow-md
                          ${
                            selectedTeacher ===
                            teacher.teacherName
                              ? "border-brand-200 bg-gradient-to-br from-brand-50 to-violet-50 shadow-sm"
                              : "border-transparent bg-white hover:border-slate-200"
                          }
                        `}
                      >

                        <div className="flex items-center gap-3">

                          <Avatar
                            src={
                              teacher.teacherAvatar
                            }
                            name={
                              teacher.teacherName
                            }
                            className="h-12 w-12"
                            textClassName="text-xs"
                          />

                          <div className="min-w-0">

                            <p className="truncate font-bold text-slate-900">
                              {
                                teacher.teacherName
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                teacher
                                  .bookings
                                  .length
                              }{" "}
                              sessions
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">

                          <span className="text-xs font-semibold text-slate-500">
                            Rs.
                            {
                              teacher.totalSpent
                            }{" "}
                            spent
                          </span>

                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                            {
                              completedCount
                            }{" "}
                            completed
                          </span>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* RIGHT */}

            <div className="min-w-0 p-4 sm:p-6">

              {selectedTeacher &&
              activeTeacher ? (

                <>

                  {/* TOP */}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex min-w-0 items-center gap-4">

                      <Avatar
                        src={
                          activeTeacher.teacherAvatar
                        }
                        name={
                          activeTeacher.teacherName
                        }
                        className="h-16 w-16 border border-slate-200"
                      />

                      <div className="min-w-0">

                        <h2 className="break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                          {
                            activeTeacher.teacherName
                          }
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Complete
                          session and
                          payment
                          history.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* TABLE */}

                  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">

                    <table className="min-w-[760px] divide-y divide-slate-200">

                      <thead className="bg-slate-50">

                        <tr className="border-b border-slate-200">

                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                            Date
                          </th>

                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                            Duration
                          </th>

                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                            Amount
                          </th>

                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                            Payment
                          </th>

                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                            Booking ID
                          </th>

                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                            Status
                          </th>

                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="bg-white">

                        {activeTeacher.bookings.map(
                          (
                            booking
                          ) => (

                            <tr
                              key={
                                booking.id
                              }
                              className="
                                border-b
                                border-slate-100
                                transition-all
                                duration-200
                                hover:bg-gradient-to-r
                                hover:from-slate-50
                                hover:to-brand-50/30
                              "
                            >

                              <td className="px-6 py-5 text-sm font-medium text-slate-800">

                                {formatDate(
                                  booking.created_at
                                )}
                              </td>

                              <td className="px-6 py-5 text-sm text-slate-600">

                                {
                                  booking.duration
                                }{" "}
                                min
                              </td>

                              <td className="px-6 py-5 text-sm font-bold text-slate-900">

                                Rs.
                                {
                                  booking.amount
                                }
                              </td>

                              <td className="px-6 py-5">

                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

                                  {booking.payment_status ===
                                  "refunded"
                                    ? "Refunded"
                                    : booking.is_paid
                                    ? "Paid"
                                    : "Unpaid"}
                                </span>
                              </td>

                              <td className="px-6 py-5 text-sm text-slate-500">

                                #
                                {booking.id?.slice(
                                  -6
                                ) || "new"}
                              </td>

                              <td className="px-6 py-5">

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                                    booking.status
                                  )}`}
                                >
                                  {
                                    booking.status
                                  }
                                </span>
                              </td>

                              <td className="px-6 py-5">

                                <div className="flex flex-wrap items-center gap-2">

                                  {booking.status ===
                                  "accepted" ? (

                                    <Link
                                      to={`/student/payment/${booking.id}`}
                                      className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white"
                                    >
                                      Pay
                                    </Link>

                                  ) : null}

                                  {canStudentJoin(
                                    booking
                                  ) ? (

                                    <Link
                                      to={`/live-class/${booking.id}`}
                                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white"
                                    >
                                      <FaVideo />
                                      Join
                                    </Link>

                                  ) : null}

                                  {booking.status ===
                                  "completed" ? (

                                    <Link
                                      to="/student/reviews"
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                    >
                                      <FaStar />
                                    </Link>

                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </>

              ) : (

                <div className="grid min-h-[360px] place-items-center py-8 lg:min-h-[650px]">

                  <div className="text-center">

                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-50 to-violet-100 text-brand-600">

                      <FaSearch className="text-3xl" />
                    </div>

                    <h3 className="mt-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">

                      Select a mentor
                    </h3>

                    <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">

                      Choose a mentor
                      from the left
                      sidebar to see
                      booking history,
                      payments, and
                      learning records.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        ) : (

          <section className="p-6 text-center sm:p-10">

            <p className="text-xl font-bold text-slate-900">
              No bookings yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Your mentor booking
              history will appear
              here after your first
              session.
            </p>

            <Link
              to="/find-teachers"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white"
            >
              <FaSearch />
              Find Mentor
            </Link>
          </section>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
