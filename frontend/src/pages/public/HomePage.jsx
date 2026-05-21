import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaBolt, FaClock, FaComments, FaStar } from "react-icons/fa";
import GlassCard from "../../components/common/GlassCard";
import heroGirl from "../../assets/hero-girl.png";


const HomePage = () => {
  const features = [
    { icon: <FaBolt />, title: "Instant Matching", text: "Find available teachers for urgent doubts in seconds." },
    { icon: <FaComments />, title: "Live Chat + Video", text: "Solve doubts through real-time conversation and face-to-face explanations." },
    { icon: <FaClock />, title: "Flexible Durations", text: "Book short 15-minute doubt bursts or full 1-hour concept sessions." },
    { icon: <FaStar />, title: "Ratings You Trust", text: "Choose teachers based on genuine student reviews and outcomes." }
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400 px-6 py-4 text-white shadow-glow md:px-12 h-[78vh] flex items-center">
       <div className="grid items-center gap-10 lg:grid-cols-2">

  {/* LEFT CONTENT */}
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="max-w-2xl"
  >
    <p className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
      Instant Doubt Solving Platform
    </p>

    <h1 className="text-2xl font-extrabold leading-tight md:text-4xl">
      Solve Your Doubts Instantly with Top Teachers
    </h1>

    <p className="mt-4 text-base text-brand-50 md:text-lg">
      DoubtBridge connects students with verified educators
      for live one-on-one sessions, instant bookings,
      and focused outcomes.
    </p>

    <div className="mt-8 flex flex-wrap gap-4">

  <Link
    to="/signup"
    className="
      rounded-2xl
      bg-white
      px-6
      py-3
      text-sm
      font-semibold
      text-brand-700
      shadow-lg
      transition-all
      duration-300
      hover:-translate-y-1
      hover:shadow-2xl
    "
  >
    Start Learning
  </Link>

  <Link
    to="/mentors"
    className="
      rounded-2xl
      border
      border-white/30
      bg-white/10
      backdrop-blur-md
      px-6
      py-3
      text-sm
      font-semibold
      text-white
      transition-all
      duration-300
      hover:-translate-y-1
      hover:bg-white
      hover:text-brand-700
      hover:shadow-2xl
    "
  >
    Meet Our Mentors
  </Link>

</div>

    {/* stats */}
<div className="mt-8 flex flex-wrap gap-4">

  {/* Students */}
  <div
    className="
      group
      rounded-2xl
      bg-white/10
      px-6
      py-4
      backdrop-blur-md
      transition-all
      duration-300
      hover:-translate-y-2
      hover:bg-white/20
      hover:shadow-2xl
      hover:shadow-purple-500/20
      cursor-pointer
    "
  >
    <p className="text-3xl font-extrabold transition duration-300 group-hover:scale-110">
      1K+
    </p>

    <p className="mt-1 text-sm text-brand-100">
      Students
    </p>
  </div>

  {/* Teachers */}
  <div
    className="
      group
      rounded-2xl
      bg-white/10
      px-6
      py-4
      backdrop-blur-md
      transition-all
      duration-300
      hover:-translate-y-2
      hover:bg-white/20
      hover:shadow-2xl
      hover:shadow-purple-500/20
      cursor-pointer
    "
  >
    <p className="text-3xl font-extrabold transition duration-300 group-hover:scale-110">
      100+
    </p>

    <p className="mt-1 text-sm text-brand-100">
      Teachers
    </p>
  </div>

  {/* Satisfaction */}
  <div
    className="
      group
      rounded-2xl
      bg-white/10
      px-6
      py-4
      backdrop-blur-md
      transition-all
      duration-300
      hover:-translate-y-2
      hover:bg-white/20
      hover:shadow-2xl
      hover:shadow-purple-500/20
      cursor-pointer
    "
  >
    <p className="text-3xl font-extrabold transition duration-300 group-hover:scale-110">
      98%
    </p>

    <p className="mt-1 text-sm text-brand-100">
      Satisfaction
    </p>
  </div>

</div>
  </motion.div>

  {/* RIGHT IMAGE */}
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8 }}
    className="relative hidden lg:flex justify-center"
  >
    {/* glow */}
    <div className="absolute h-[440px] w-[460px] rounded-full bg-purple-300/30 blur-3xl"></div>

    <img
      src={heroGirl}
      alt="Student"
      className="relative z-10 w-[450px] drop-shadow-2xl animate-float"
    />

    {/* floating icons
    <div className="absolute left-8 top-10 rounded-2xl bg-white/20 p-4 backdrop-blur-md">
      ❓
    </div>

    <div className="absolute right-10 top-20 rounded-2xl bg-yellow-300/90 p-4 text-black shadow-xl">
      💬
    </div>

    <div className="absolute bottom-10 right-16 rounded-2xl bg-white/20 p-4 backdrop-blur-md">
      🎓
    </div> */}
  </motion.div>
</div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
      </section>

      <section className="relative pt-6 pb-12">

  {/* heading */}
  <div className="mb-12 text-center">
   

    <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
      How It Works
    </h2>

    <p className="mt-3 text-slate-500">
      Start learning instantly in just a few easy steps
    </p>
  </div>

  {/* cards */}
  <div className="grid gap-6 md:grid-cols-3">

    {/* card 1 */}
    <div
      className="
        group
        rounded-[2rem]
        bg-gradient-to-br
        from-purple-100
        via-violet-50
        to-white
        p-8
        shadow-lg
        transition-all
        duration-500
        hover:-translate-y-3
        hover:shadow-2xl
      "
    >
      <div
        className="
          mb-6
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-purple-500
          text-3xl
          text-white
          transition
          duration-300
          group-hover:rotate-6
          group-hover:scale-110
        "
      >
        👩‍🏫
      </div>

      <p className="text-xl font-bold text-slate-900">
        Choose Teacher
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Find expert teachers instantly based on subject, ratings,
        and availability.
      </p>
    </div>

    {/* card 2 */}
    <div
      className="
        group
        rounded-[2rem]
        bg-gradient-to-br
        from-violet-100
        via-purple-50
        to-white
        p-8
        shadow-lg
        transition-all
        duration-500
        hover:-translate-y-3
        hover:shadow-2xl
      "
    >
      <div
        className="
          mb-6
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-violet-500
          text-3xl
          text-white
          transition
          duration-300
          group-hover:rotate-6
          group-hover:scale-110
        "
      >
        💳
      </div>

      <p className="text-xl font-bold text-slate-900">
        Book Session
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Securely book live doubt-solving sessions in just a few clicks.
      </p>
    </div>

    {/* card 3 */}
    <div
      className="
        group
        rounded-[2rem]
        bg-gradient-to-br
        from-fuchsia-100
        via-pink-50
        to-white
        p-8
        shadow-lg
        transition-all
        duration-500
        hover:-translate-y-3
        hover:shadow-2xl
      "
    >
      <div
        className="
          mb-6
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-pink-500
          text-3xl
          text-white
          transition
          duration-300
          group-hover:rotate-6
          group-hover:scale-110
        "
      >
        🎥
      </div>

      <p className="text-xl font-bold text-slate-900">
        Join Live Class
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Connect instantly through live video and solve doubts faster.
      </p>
    </div>

  </div>
</section>

      {/* how it work section  */}

      {/* start --> platform feature section  */}

      
      {/* start --> platform feature section */}

<section className="relative py-12">

  {/* heading */}
  <div className="mb-10">
    <h2 className="text-4xl font-extrabold text-slate-900">
      Platform Features
    </h2>

    <p className="mt-3 text-slate-500">
      Powerful features designed to make doubt solving fast,
      interactive, and seamless.
    </p>
  </div>

  {/* cards */}
  <div className="grid gap-6 md:grid-cols-2">

    {features.map((feature) => (

      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3 }}
        key={feature.title}
        className="
  group
  rounded-[2rem]
  bg-[#f4edff]
  p-8
  shadow-[0_8px_25px_rgba(139,92,246,0.10)]
  transition-all
  duration-300
  hover:-translate-y-2
  hover:bg-[#efe4ff]
  hover:shadow-[0_20px_50px_rgba(139,92,246,0.22)]
"
      >

        {/* icon */}
        <div
          className="
            mb-6
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            from-brand-500
            to-purple-500
            text-2xl
            text-white
            shadow-lg
            transition-all
            duration-300
            group-hover:scale-105
            group-hover:rotate-3
          "
        >
          {feature.icon}
        </div>

        {/* title */}
        <p
          className="
            text-2xl
            font-bold
            text-slate-900
            transition-colors
            duration-300
            group-hover:text-brand-700
          "
        >
          {feature.title}
        </p>

        {/* text */}
        <p className="mt-4 text-[15px] leading-7 text-slate-600">
          {feature.text}
        </p>

      </motion.div>

    ))}

  </div>

      </section>
      

      {/* Footer */}
<footer className="relative mt-20 overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#7b37f3] via-[#8b5cf6] to-[#a78bfa] px-10 md:px-14 py-14 shadow-[0_20px_60px_rgba(139,92,246,0.25)]">

  {/* background glow */}
  <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
  <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-pink-200/10 blur-3xl" />

  <div className="relative z-10 grid gap-12 md:grid-cols-4">

    {/* brand */}
    <div>
      <h2 className="text-3xl font-extrabold text-white">
        DoubtBridge
      </h2>

      <p className="mt-4 text-sm leading-7 text-purple-100">
        Instant doubt solving platform connecting students
        with expert teachers through live interactive sessions.
      </p>
    </div>

    {/* quick links */}
    <div>
      <h3 className="text-lg font-bold text-white">
        Quick Links
      </h3>

      <div className="mt-4 flex flex-col gap-3 text-sm text-purple-100">

        <Link
          to="/"
          className="transition duration-300 hover:translate-x-1 hover:text-white"
        >
          Home
        </Link>

        <Link
          to="/mentors"
          className="transition duration-300 hover:translate-x-1 hover:text-white"
        >
          Mentors
        </Link>

        <Link
          to="/signup"
          className="transition duration-300 hover:translate-x-1 hover:text-white"
        >
          Get Started
        </Link>

      </div>
    </div>

    {/* features */}
    <div>
      <h3 className="text-lg font-bold text-white">
        Features
      </h3>

      <div className="mt-4 flex flex-col gap-3 text-sm text-purple-100">
        <p className="transition hover:translate-x-1 hover:text-white">
          🎥 Live Classes
        </p>

        <p className="transition hover:translate-x-1 hover:text-white">
          💬 Instant Chat
        </p>

        <p className="transition hover:translate-x-1 hover:text-white">
          📚 Expert Mentors
        </p>

        <p className="transition hover:translate-x-1 hover:text-white">
          ⚡ Fast Booking
        </p>
      </div>
    </div>

    {/* contact */}
    <div>
      <h3 className="text-lg font-bold text-white">
        Contact
      </h3>

      <div className="mt-4 flex flex-col gap-3 text-sm text-purple-100">
        <p className="transition hover:translate-x-1">📧 doubtbridge@gmail.com</p>
              <p className="transition hover:translate-x-1">📍 Kolkata, India</p>
              <p className="transition hover:translate-x-1">🕒Mon-Sun | 10:00 AM - 6:00 PM </p>
      </div>
    </div>

  </div>

  {/* bottom */}
  <div className="relative z-10 mt-12 border-t border-white/20 pt-6 text-center text-sm text-purple-100">
    © 2026 DoubtBridge. Crafted with 💜 for modern learning.
  </div>

</footer>
      
    </div>
  );
};

export default HomePage;
