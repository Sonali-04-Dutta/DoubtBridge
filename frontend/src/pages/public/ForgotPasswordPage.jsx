import { useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash, FaLock, FaRegEnvelope } from "react-icons/fa";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isValidEmail, validatePassword } from "../../lib/validators";

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const runValidation = () => {
    const nextErrors = {};

    if (!isValidEmail(form.email)) {
      nextErrors.email = "Please enter a valid email.";
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
      await forgotPassword(form);
      toast.success("Password updated successfully. Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md rounded-3xl border border-white/70 bg-white/85 p-8 shadow-card backdrop-blur-xl"
    >
      <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
        Account Recovery
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">Forgot your password?</h1>
      <p className="mt-2 text-sm text-slate-600">
        No worries. Set a fresh password for your account and get back to learning right away.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
          <div className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 ${fieldErrors.email ? "border-rose-300" : "border-brand-100"}`}>
            <FaRegEnvelope className="text-brand-500" />
            <input
              type="email"
              value={form.email}
              onChange={(event) => {
                setForm({ ...form, email: event.target.value });
                setFieldErrors({ ...fieldErrors, email: "" });
              }}
              placeholder="you@example.com"
              className="w-full bg-transparent text-sm outline-none"
              required
            />
          </div>
          <p className={`mt-1 text-xs ${fieldErrors.email ? "text-rose-600" : "text-slate-500"}`}>
            {fieldErrors.email || "Use the email tied to your DoubtBridge account."}
          </p>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">New Password</span>
          <div className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 ${fieldErrors.password ? "border-rose-300" : "border-brand-100"}`}>
            <FaLock className="text-brand-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => {
                setForm({ ...form, password: event.target.value });
                setFieldErrors({ ...fieldErrors, password: "" });
              }}
              placeholder="Enter new password"
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

        <button
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-glow transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Updating password..." : "Reset Password"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Remembered it now?{" "}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Back to login
        </Link>
      </p>
    </motion.div>
  );
};

export default ForgotPasswordPage;
