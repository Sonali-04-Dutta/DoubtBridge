import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaLock,
  FaRegEnvelope,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { signInWithGooglePopup } from "../../lib/firebase";
import { isValidEmail, validatePassword } from "../../lib/validators";

import heroGirl from "../../assets/hero-girl.png";

const googleRoleOptions = [
  {
    role: "student",
    label: "Student",
    helper: "Find teachers and book doubt-clearing sessions.",
  },
  {
    role: "teacher",
    label: "Teacher",
    helper: "Teach live sessions and manage your mentor profile.",
  },
];

const getGoogleAuthError = (err) => {
  const code = err?.code || "";

  if (code === "auth/popup-closed-by-user")
    return "Google sign-in was closed before it finished.";

  if (code === "auth/cancelled-popup-request")
    return "Another Google sign-in window is already open.";

  if (code === "auth/popup-blocked")
    return "Your browser blocked the Google sign-in popup.";

  return (
    err.response?.data?.message ||
    err.message ||
    "Google login failed."
  );
};

const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [googleLoadingRole, setGoogleLoadingRole] =
    useState(null);

  const redirectAfterAuth = (role, from) => {
    navigate(
      from ||
        (role === "student"
          ? "/student/dashboard"
          : role === "teacher"
          ? "/teacher/dashboard"
          : "/admin/dashboard")
    );
  };

  const runValidation = () => {
    const nextErrors = {};

    if (!isValidEmail(form.email)) {
      nextErrors.email =
        "Enter a valid email address to continue.";
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
      toast.error("⚠️ Invalid credentials");
      return;
    }

    try {
      setLoading(true);

      const data = await login(form);

      toast.success("🎉 Welcome back to DoubtBridge!");

      const from = location.state?.from?.pathname;

      redirectAfterAuth(data.user.role, from);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "We couldn't sign you in."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (role) => {
    try {
      setGoogleLoadingRole(role);

      const { idToken } =
        await signInWithGooglePopup();

      const data = await loginWithGoogle({
        idToken,
        role,
      });

      toast.success(
        data.isNewUser
          ? "✨ Account created successfully!"
          : "🎉 Welcome back!"
      );

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="
        mx-auto
        mt-10
        max-w-4xl
        overflow-hidden
        rounded-[2.5rem]
        bg-[#e9d8ff]
        shadow-[0_25px_80px_rgba(139,92,246,0.18)]
      "
    >
      <div className="grid md:grid-cols-2">

        {/* LEFT SIDE */}
        <div
          className="
            relative
            hidden
            items-center
            justify-center
            overflow-hidden
            bg-gradient-to-br
            from-[#7c3aed]
            via-[#8b5cf6]
            to-[#a78bfa]
            p-10
            md:flex
          "
        >
          {/* glow */}
          <div className="absolute -left-10 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-pink-300/20 blur-3xl" />

          <div className="relative z-10 text-center text-white">

            <motion.img
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
              src={heroGirl}
              alt="login"
              className="mx-auto w-[280px] drop-shadow-2xl"
            />

            <h2 className="mt-8 text-4xl font-extrabold leading-tight">
              Welcome Back
            </h2>

            <p className="mt-4 text-sm leading-7 text-purple-100">
              Continue your learning journey with
              expert mentors and instant doubt solving.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="px-8 py-10 md:px-10">

          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.2em]
              text-brand-700
            "
          >
            Student + Mentor Login
          </p>

          <h1
            className="
              mt-3
              text-4xl
              font-extrabold
              text-[#2d1457]
            "
          >
            Login
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Access your account and continue learning
            instantly.
          </p>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            {/* EMAIL */}
            <label className="block">

              <span
                className="
                  mb-2
                  block
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-slate-500
                "
              >
                Email
              </span>

              <div
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  bg-white/90
                  px-4
                  py-4
                  backdrop-blur-sm
                  transition
                  ${
                    fieldErrors.email
                      ? "border-rose-300"
                      : "border-purple-100"
                  }
                `}
              >
                <FaRegEnvelope className="text-brand-500" />

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(event) => {
                    setForm({
                      ...form,
                      email: event.target.value,
                    });

                    setFieldErrors({
                      ...fieldErrors,
                      email: "",
                    });
                  }}
                  className="
                    w-full
                    bg-transparent
                    text-sm
                    outline-none
                  "
                  required
                />
              </div>

              <p
                className={`
                  mt-1
                  text-xs
                  ${
                    fieldErrors.email
                      ? "text-rose-600"
                      : "text-slate-500"
                  }
                `}
              >
                {fieldErrors.email ||
                  "Use your registered email address."}
              </p>
            </label>

            {/* PASSWORD */}
            <label className="block">

              <span
                className="
                  mb-2
                  block
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-slate-500
                "
              >
                Password
              </span>

              <div
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  bg-white/90
                  px-4
                  py-4
                  backdrop-blur-sm
                  transition
                  ${
                    fieldErrors.password
                      ? "border-rose-300"
                      : "border-purple-100"
                  }
                `}
              >
                <FaLock className="text-brand-500" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(event) => {
                    setForm({
                      ...form,
                      password: event.target.value,
                    });

                    setFieldErrors({
                      ...fieldErrors,
                      password: "",
                    });
                  }}
                  className="
                    w-full
                    bg-transparent
                    text-sm
                    outline-none
                  "
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  className="
                    text-slate-500
                    transition
                    hover:text-brand-700
                  "
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>

              <p
                className={`
                  mt-1
                  text-xs
                  ${
                    fieldErrors.password
                      ? "text-rose-600"
                      : "text-slate-500"
                  }
                `}
              >
                {fieldErrors.password ||
                  "Minimum 5 characters."}
              </p>
            </label>

            {/* FORGOT PASSWORD */}
            <div className="flex justify-end">

              <Link
                to="/forgot-password"
                className="
                  text-xs
                  font-semibold
                  text-brand-700
                  hover:text-brand-800
                "
              >
                Forgot Password?
              </Link>
            </div>

            {/* LOGIN BUTTON */}
            <button
              disabled={loading}
              className="
                w-full
                rounded-2xl
                bg-gradient-to-r
                from-[#7c3aed]
                to-[#9333ea]
                px-4
                py-4
                font-bold
                text-white
                shadow-lg
                transition-all
                duration-300
                hover:scale-[1.02]
                hover:shadow-[0_15px_35px_rgba(139,92,246,0.35)]
                disabled:opacity-60
              "
            >
              {loading
                ? "Signing you in..."
                : "Login to DoubtBridge"}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-300" />
            <span>OR CONTINUE WITH</span>
            <span className="h-px flex-1 bg-slate-300" />
          </div>

          {/* GOOGLE LOGIN */}
          <div className="grid gap-4 sm:grid-cols-2">

            {googleRoleOptions.map((option) => {
              const isLoading =
                googleLoadingRole === option.role;

              const isDisabled =
                Boolean(googleLoadingRole);

              return (
                <button
                  key={option.role}
                  type="button"
                  onClick={() =>
                    handleGoogleLogin(option.role)
                  }
                  disabled={isDisabled}
                  className="
                    group
                    rounded-2xl
                    border
                    border-purple-100
                    bg-white/80
                    p-5
                    text-left
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-purple-300
                    hover:shadow-xl
                  "
                >
                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-full
                        bg-purple-100
                        text-brand-700
                      "
                    >
                      <FaGoogle />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {isLoading
                          ? "Connecting..."
                          : option.label}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                      continue with google
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* SIGNUP */}
          <p className="mt-7 text-center text-sm text-slate-600">
            New to DoubtBridge?{" "}

            <Link
              to="/signup"
              className="
                font-bold
                text-brand-700
                hover:text-brand-800
              "
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;