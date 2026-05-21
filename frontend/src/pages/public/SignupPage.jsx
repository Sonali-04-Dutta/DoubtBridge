import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaLock,
  FaRegEnvelope,
  FaUser,
} from "react-icons/fa";

import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { signInWithGooglePopup } from "../../lib/firebase";
import {
  isValidEmail,
  validatePassword,
} from "../../lib/validators";

import heroGirl from "../../assets/hero-girl.png";

const roleOptions = [
  {
    label: "Student",
    value: "student",
    helper:
      "Book sessions, ask doubts, and track progress.",
  },
  {
    label: "Teacher",
    value: "teacher",
    helper:
      "Teach students, manage profile, and earn online.",
  },
];

const googleRoleOptions = [
  {
    role: "student",
    label: "Student",
  },
  {
    role: "teacher",
    label: "Teacher",
  },
];

const getGoogleAuthError = (err) => {
  const code = err?.code || "";

  if (code === "auth/popup-closed-by-user")
    return "Google sign-up was closed.";

  if (code === "auth/cancelled-popup-request")
    return "Another Google popup is already open.";

  if (code === "auth/popup-blocked")
    return "Browser blocked Google popup.";

  return (
    err.response?.data?.message ||
    err.message ||
    "Google signup failed."
  );
};

const SignupPage = () => {
  const { signup, loginWithGoogle } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(false);

  const [googleLoadingRole, setGoogleLoadingRole] =
    useState(null);

  const [showPassword, setShowPassword] =
    useState(false);

  const validateForm = () => {
    const errors = {};

    if (
      !form.name.trim() ||
      form.name.trim().length < 2
    ) {
      errors.name = "Please enter your full name.";
    }

    if (!isValidEmail(form.email)) {
      errors.email = "Use a valid email address.";
    }

    const passwordError = validatePassword(
      form.password
    );

    if (passwordError) {
      errors.password = passwordError;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("⚠️ Invalid form details");
      return;
    }

    try {
      setLoading(true);

      const data = await signup(form);

      toast.success(
        "✨ Account created successfully!"
      );

      navigate(
        data.user.role === "student"
          ? "/student"
          : "/teacher"
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Signup failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (role) => {
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
          ? "✨ Account created!"
          : "🎉 Welcome back!"
      );

      navigate(
        data.user.role === "student"
          ? "/student"
          : "/teacher"
      );
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
        bg-[#eadcff]
        shadow-[0_25px_80px_rgba(139,92,246,0.18)]
      "
    >
      <div className="grid md:grid-cols-[1.2fr_0.8fr]">

        {/* LEFT SIDE FORM */}
        <div className="px-8 py-7 md:px-10">

          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.2em]
              text-brand-700
            "
          >
            Create Account
          </p>

          <h1
            className="
              mt-3
              text-4xl
              font-extrabold
              text-[#2d1457]
            "
          >
            Sign Up
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Create your account and begin learning
            with premium mentorship.
          </p>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            {/* NAME */}
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
                Full Name
              </span>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  border-purple-100
                  bg-white/90
                  px-4
                  py-4
                "
              >
                <FaUser className="text-brand-500" />

                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(event) => {
                    setForm({
                      ...form,
                      name: event.target.value,
                    });

                    setFieldErrors({
                      ...fieldErrors,
                      name: "",
                    });
                  }}
                  className="
                    w-full
                    bg-transparent
                    text-sm
                    outline-none
                  "
                />
              </div>
            </label>

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
                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  border-purple-100
                  bg-white/90
                  px-4
                  py-4
                "
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
                />
              </div>
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
                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  border-purple-100
                  bg-white/90
                  px-4
                  py-4
                "
              >
                <FaLock className="text-brand-500" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Choose password"
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
            </label>

            {/* ROLE */}
            <div className="grid grid-cols-2 gap-4">

              {roleOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      role: item.value,
                    })
                  }
                  className={`
                    rounded-2xl
                    border
                    bg-white/80
                    p-5
                    text-left
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-xl
                    ${
                      form.role === item.value
                        ? "border-brand-500 ring-2 ring-brand-200"
                        : "border-purple-100"
                    }
                  `}
                >
                  <p className="font-bold text-slate-900">
                    {item.label}
                  </p>

                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {item.helper}
                  </p>
                </button>
              ))}
            </div>

            {/* BUTTON */}
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
              "
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-300" />
            <span>OR CONTINUE WITH</span>
            <span className="h-px flex-1 bg-slate-300" />
          </div>

          {/* GOOGLE */}
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
                    handleGoogleSignup(option.role)
                  }
                  disabled={isDisabled}
                  className="
                    rounded-2xl
                    border
                    border-purple-100
                    bg-white/80
                    p-5
                    text-left
                    transition-all
                    duration-300
                    hover:-translate-y-1
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

                      <p className="mt-1 text-xs text-slate-500">
                        Continue with Google
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* LOGIN */}
          <p className="mt-7 text-center text-sm text-slate-600">
            Already have an account?{" "}

            <Link
              to="/login"
              className="
                font-bold
                text-brand-700
                hover:text-brand-800
              "
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div
          className="
            relative
            hidden
            overflow-hidden
            bg-gradient-to-br
            from-[#7c3aed]
            via-[#8b5cf6]
            to-[#a78bfa]
            p-10
            md:flex
            md:flex-col
            md:items-center
            md:justify-center
          "
        >

          {/* glow */}
          <div className="absolute left-0 top-0 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-pink-300/20 blur-3xl" />

          <div className="relative z-10 text-center text-white">

            <motion.img
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
              src={heroGirl}
              alt="signup"
              className="
                mx-auto
                w-[300px]
                drop-shadow-2xl
              "
            />

            <h2 className="mt-8 text-4xl font-extrabold leading-tight">
              Start Your Learning Journey
            </h2>

            <p className="mt-4 text-sm leading-7 text-purple-100">
              Join DoubtBridge and connect instantly
              with expert teachers and live sessions.
            </p>

          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default SignupPage;