import { useState } from "react";
import { motion } from "framer-motion";

import {
  FaArrowLeft,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaMagic,
  FaRegEnvelope,
  FaShieldAlt
} from "react-icons/fa";

import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import confusedIllustration from "../../assets/confused-boy.png";

import { useAuth } from "../../context/AuthContext";
import {
  isValidEmail,
  validatePassword
} from "../../lib/validators";

const ForgotPasswordPage = () => {

  const { forgotPassword } =
    useAuth();

  const navigate = useNavigate();

  const [form, setForm] =
    useState({
      email: "",
      password: ""
    });

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [
    showPassword,
    setShowPassword
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const runValidation = () => {

    const nextErrors = {};

    if (
      !isValidEmail(form.email)
    ) {
      nextErrors.email =
        "Please enter a valid email address.";
    }

    const passwordError =
      validatePassword(
        form.password
      );

    if (passwordError) {
      nextErrors.password =
        passwordError;
    }

    setFieldErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    if (!runValidation()) {

      toast.error(
        "⚠️ Please check your details."
      );

      return;
    }

    try {

      setLoading(true);

      await forgotPassword(
        form
      );

      toast.success(
        "Password updated successfully."
      );

      navigate("/login");

    } catch (err) {

      toast.error(
        err.response?.data
          ?.message ||
          "Password reset failed."
      );

    } finally {

      setLoading(false);
    }
  };

 return (
  <div className="
    min-h-screen
   
    px-4
    py-2
  ">

    <div className="
      mx-auto
      flex
      min-h-[85vh]
      max-w-5xl
      items-center
      justify-center
    ">

      <div className="
        grid
        overflow-hidden
        rounded-[28px]
        border
        border-white/60
        bg-white/70
        shadow-[0_25px_80px_rgba(124,58,237,0.12)]
        backdrop-blur-xl
        sm:rounded-[42px]
        lg:grid-cols-[0.85fr_1.15fr]
      ">

        {/* LEFT IMAGE */}

        <div className="
          flex
          items-center
          justify-center
          bg-white
          p-6
          sm:p-8
          lg:p-12
        ">

          <img
            src={confusedIllustration}
            alt="Forgot password"
            className="
              w-full
              max-w-[280px]
              object-contain
            "
          />
        </div>

        {/* RIGHT CONTENT */}

        <div className="
          flex
          items-center
          justify-center
          bg-gradient-to-br
          from-[#F5F3FF]
          via-[#EDE9FE]
          to-[#DDD6FE]
          p-6
          sm:p-12
        ">

          <div className="w-full max-w-md">

            {/* TITLE */}

            <h1 className="
              text-4xl
              font-black
              leading-tight
              tracking-tight
              text-[#241447]
              sm:text-5xl
            ">
              Forgot
              <br />
              Password?
            </h1>

            <p className="
              mt-4
              text-sm
              leading-relaxed
              text-[#5B4B7A]
            ">
              Enter the email address associated
              with your account and create a new password.
            </p>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6 sm:mt-10"
            >

              {/* EMAIL */}

              <div>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                  placeholder="Enter Email Address"
                  className="
                    w-full
                    border-0
                    border-b
                    border-[#D6C7F5]
                    bg-transparent
                    px-0
                    py-4
                    text-sm
                    font-medium
                    text-[#241447]
                    outline-none
                    transition-all
                    duration-300
                    focus:border-[#8B5CF6]
                    focus:ring-0
                    placeholder:text-[#7C6A9B]
                  "
                  required
                />
              </div>

              {/* PASSWORD */}

              <div className="relative">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value
                    })
                  }
                  placeholder="Enter New Password"
                  className="
                    w-full
                    border-0
                    border-b
                    border-[#D6C7F5]
                    bg-transparent
                    px-0
                    py-4
                    pr-10
                    text-sm
                    font-medium
                    text-[#241447]
                    outline-none
                    transition-all
                    duration-300
                    focus:border-[#8B5CF6]
                    focus:ring-0
                    placeholder:text-[#7C6A9B]
                  "
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="
                    absolute
                    right-0
                    top-1/2
                    -translate-y-1/2
                    text-[#7C6A9B]
                    transition
                    hover:text-[#5B21B6]
                  "
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>

              {/* ACTIONS */}

              <div className="
                flex
                flex-col-reverse
                gap-4
                pt-6
                sm:flex-row
                sm:items-center
                sm:justify-between
              ">

                <Link
                  to="/login"
                  className="
                    text-sm
                    font-semibold
                    text-[#6D28D9]
                    transition
                    hover:text-[#5B21B6]
                  "
                >
                  Back to login
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    rounded-full
                    bg-gradient-to-r
                    from-[#8B5CF6]
                    to-[#7C3AED]
                    w-full
                    px-8
                    py-3
                    text-sm
                    font-bold
                    text-white
                    shadow-[0_10px_30px_rgba(124,58,237,0.35)]
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:shadow-[0_14px_35px_rgba(124,58,237,0.45)]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    sm:w-auto
                  "
                >
                  {loading
                    ? "Updating..."
                    : "Next"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default ForgotPasswordPage;
