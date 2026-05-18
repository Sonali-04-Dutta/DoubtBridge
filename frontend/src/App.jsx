import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RoleRoute from "./components/common/RoleRoute";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import HomePage from "./pages/public/HomePage";
import AboutPage from "./pages/public/AboutPage";
import LoginPage from "./pages/public/LoginPage";
import SignupPage from "./pages/public/SignupPage";
import OurMentorsPage from "./pages/public/OurMentorsPage";
import PublicTeacherProfilePage from "./pages/public/PublicTeacherProfilePage";
import StudentDashboard from "./pages/student/StudentDashboard";
import FindTeachersPage from "./pages/student/FindTeachersPage";
import BookingPage from "./pages/student/BookingPage";
import PaymentPage from "./pages/student/PaymentPage";
import LiveClassroom from "./pages/live/LiveClassroom";
import StudentReviewsPage from "./pages/student/StudentReviewsPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherProfileSetupPage from "./pages/teacher/TeacherProfileSetupPage";
import BookingRequestsPage from "./pages/teacher/BookingRequestsPage";
import TeacherEarningsPage from "./pages/teacher/TeacherEarningsPage";
import TeacherSessionHistoryPage from "./pages/teacher/TeacherSessionHistoryPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminLiveClasses from "./pages/admin/AdminLiveClasses";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import MessagesPage from "./pages/shared/MessagesPage";
import NotificationsPage from "./pages/shared/NotificationsPage";
import ProfileSettingsPage from "./pages/shared/ProfileSettingsPage";

const App = () => {
  const location = useLocation();
  const isLiveClassroom = location.pathname.startsWith("/live-class/");
  const isAdminPanel = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen">
      {isLiveClassroom || isAdminPanel ? null : <Navbar />}
      <main className={isLiveClassroom || isAdminPanel ? "w-full" : "mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-8"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/mentors" element={<OurMentorsPage />} />
          <Route path="/mentors/:id" element={<PublicTeacherProfilePage />} />
          <Route path="/find-teachers" element={<FindTeachersPage />} />
          <Route path="/teachers/:id" element={<PublicTeacherProfilePage />} />
          <Route path="/student" element={<ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentDashboard /></RoleRoute></ProtectedRoute>} />
          <Route path="/student/dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentDashboard /></RoleRoute></ProtectedRoute>} />
          <Route path="/student/booking/:teacherId" element={<ProtectedRoute><RoleRoute allowedRoles={["student"]}><BookingPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/student/payment/:bookingId" element={<ProtectedRoute><RoleRoute allowedRoles={["student"]}><PaymentPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/student/session/:bookingId" element={<ProtectedRoute><RoleRoute allowedRoles={["student"]}><LiveClassroom /></RoleRoute></ProtectedRoute>} />
          <Route path="/session/:bookingId" element={<ProtectedRoute><RoleRoute allowedRoles={["student", "teacher"]}><LiveClassroom /></RoleRoute></ProtectedRoute>} />
          <Route path="/live-class/:bookingId" element={<ProtectedRoute><RoleRoute allowedRoles={["student", "teacher"]}><LiveClassroom /></RoleRoute></ProtectedRoute>} />
          <Route path="/student/reviews" element={<ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentReviewsPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><RoleRoute allowedRoles={["student", "teacher"]}><MessagesPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><RoleRoute allowedRoles={["student", "teacher"]}><NotificationsPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><RoleRoute allowedRoles={["student", "teacher", "admin"]}><ProfileSettingsPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/teacher" element={<ProtectedRoute><RoleRoute allowedRoles={["teacher"]}><TeacherDashboard /></RoleRoute></ProtectedRoute>} />
          <Route path="/teacher/dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={["teacher"]}><TeacherDashboard /></RoleRoute></ProtectedRoute>} />
          <Route path="/teacher/profile" element={<ProtectedRoute><RoleRoute allowedRoles={["teacher"]}><TeacherProfileSetupPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/teacher/requests" element={<ProtectedRoute><RoleRoute allowedRoles={["teacher"]}><BookingRequestsPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/teacher/inbox" element={<ProtectedRoute><RoleRoute allowedRoles={["teacher"]}><MessagesPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/teacher/earnings" element={<ProtectedRoute><RoleRoute allowedRoles={["teacher"]}><TeacherEarningsPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/teacher/history" element={<ProtectedRoute><RoleRoute allowedRoles={["teacher"]}><TeacherSessionHistoryPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/admin" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
          <Route path="/admin/teachers" element={<AdminProtectedRoute><AdminTeachers /></AdminProtectedRoute>} />
          <Route path="/admin/students" element={<AdminProtectedRoute><AdminStudents /></AdminProtectedRoute>} />
          <Route path="/admin/bookings" element={<AdminProtectedRoute><AdminBookings /></AdminProtectedRoute>} />
          <Route path="/admin/payments" element={<AdminProtectedRoute><AdminPayments /></AdminProtectedRoute>} />
          <Route path="/admin/refunds" element={<AdminProtectedRoute><AdminPayments refundsOnly /></AdminProtectedRoute>} />
          <Route path="/admin/live-classes" element={<AdminProtectedRoute><AdminLiveClasses /></AdminProtectedRoute>} />
          <Route path="*" element={<div className="py-20 text-center text-slate-600">Page not found</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
