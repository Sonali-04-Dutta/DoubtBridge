import { useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash, FaGoogle, FaLock, FaRegEnvelope } from "react-icons/fa";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { signInWithGooglePopup } from "../../lib/firebase";
import { isValidEmail, validatePassword } from "../../lib/validators";

const googleRoleOptions = [
  {
    role: "student",
    label: "Continue with Google as Student",
    helper: "Find teachers and book doubt-clearing sessions."
  },
  {
    role: "teacher",
    label: "Continue with Google as Teacher",
    helper: "Teach live sessions and manage your mentor profile."
  }
];

const getGoogleAuthError = (err) => {
  const code = err?.code || "";
  if (code === "auth/popup-closed-by-user") return "Google sign-in was closed before it finished.";
  if (code === "auth/cancelled-popup-request") return "Another Google sign-in window is already open.";
  if (code === "auth/popup-blocked") return "Your browser blocked the Google sign-in popup.";
  return err.response?.data?.message || err.message || "Google login failed.";
};

const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoadingRole, setGoogleLoadingRole] = useState(null);

  const redirectAfterAuth = (role, from) => {
    navigate(from || (role === "student" ? "/student/dashboard" : role === "teacher" ? "/teacher/dashboard" : "/admin/dashboard"));
  };

  const runValidation = () => {
    const nextErrors = {};

    if (!isValidEmail(form.email)) {
      nextErrors.email = "Enter a valid email address to continue.";
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!runValidation()) {
      toast.error("\u26A0\uFE0F Invalid password");
      return;
    }

    try {
      setLoading(true);
      const data = await login(form);
      toast.success("\uD83C\uDF89 Welcome back to DoubtBridge!");
      const from = location.state?.from?.pathname;
      redirectAfterAuth(data.user.role, from);
    } catch (err) {
      toast.error(err.response?.data?.message || "We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (role) => {
    try {
      setGoogleLoadingRole(role);
      const { idToken } = await signInWithGooglePopup();
      const data = await loginWithGoogle({ idToken, role });
      toast.success(data.isNewUser ? "\u2728 Account created successfully!" : "\uD83C\uDF89 Welcome back to DoubtBridge!");
      const from = location.state?.from?.pathname;
      redirectAfterAuth(data.user.role, from);
    } catch (err) {
      toast.error(getGoogleAuthError(err));
    } finally {
      setGoogleLoadingRole(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md rounded-3xl border border-white/70 bg-white/85 p-8 shadow-card backdrop-blur-xl"
    >
      <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
        Student + Mentor Login
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-600">Pick up where you left off and continue learning in minutes.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
          <div className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 ${fieldErrors.email ? "border-rose-300" : "border-brand-100"}`}>
            <FaRegEnvelope className="text-brand-500" />
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => {
                setForm({ ...form, email: event.target.value });
                setFieldErrors({ ...fieldErrors, email: "" });
              }}
              className="w-full bg-transparent text-sm outline-none"
              required
            />
          </div>
          <p className={`mt-1 text-xs ${fieldErrors.email ? "text-rose-600" : "text-slate-500"}`}>
            {fieldErrors.email || "Use the same email you used while signing up."}
          </p>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
          <div className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 ${fieldErrors.password ? "border-rose-300" : "border-brand-100"}`}>
            <FaLock className="text-brand-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) => {
                setForm({ ...form, password: event.target.value });
                setFieldErrors({ ...fieldErrors, password: "" });
              }}
              className="w-full bg-transparent text-sm outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-slate-500 transition hover:text-brand-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <p className={`mt-1 text-xs ${fieldErrors.password ? "text-rose-600" : "text-slate-500"}`}>
            {fieldErrors.password || "Minimum 5 characters."}
          </p>
        </label>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500">Need help getting back in?</span>
          <Link to="/forgot-password" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
            Forgot password
          </Link>
        </div>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-glow transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Signing you in..." : "Login to DoubtBridge"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>OR</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {googleRoleOptions.map((option) => {
          const isLoading = googleLoadingRole === option.role;
          const isDisabled = Boolean(googleLoadingRole);

          return (
            <button
              key={option.role}
              type="button"
              onClick={() => handleGoogleLogin(option.role)}
              disabled={isDisabled}
              className="group flex min-h-[112px] flex-col rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/70 hover:shadow-card disabled:pointer-events-none disabled:opacity-70"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white shadow-sm transition group-hover:border-brand-200">
                  <FaGoogle className="text-brand-600" />
                </span>
                {isLoading ? "Connecting..." : option.label}
              </span>
              <span className="mt-2 text-xs leading-5 text-slate-500">{option.helper}</span>
              <span className="mt-auto pt-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-600">
                {option.role}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-center text-sm text-slate-600">
        New to DoubtBridge?{" "}
        <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-800">
          Create an account
        </Link>
      </p>
    </motion.div>
  );
};

export default LoginPage;
