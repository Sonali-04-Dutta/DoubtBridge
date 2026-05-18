import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaBolt, FaClock, FaComments, FaStar } from "react-icons/fa";
import GlassCard from "../../components/common/GlassCard";

const HomePage = () => {
  const features = [
    { icon: <FaBolt />, title: "Instant Matching", text: "Find available teachers for urgent doubts in seconds." },
    { icon: <FaComments />, title: "Live Chat + Video", text: "Solve doubts through real-time conversation and face-to-face explanations." },
    { icon: <FaClock />, title: "Flexible Durations", text: "Book short 15-minute doubt bursts or full 1-hour concept sessions." },
    { icon: <FaStar />, title: "Ratings You Trust", text: "Choose teachers based on genuine student reviews and outcomes." }
  ];

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400 px-6 py-14 text-white shadow-glow md:px-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
          <p className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">Instant Doubt Solving Platform</p>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Solve Your Doubts Instantly with Top Teachers</h1>
          <p className="mt-4 text-base text-brand-50 md:text-lg">DoubtBridge connects students with verified educators for live one-on-one sessions, instant bookings, and focused outcomes.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-brand-700">Start Learning</Link>
            <Link to="/mentors" className="rounded-2xl border border-white/55 px-5 py-3 text-sm font-bold">Meet Our Mentors</Link>
          </div>
        </motion.div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
      </section>

      <section>
        <h2 className="mb-6 text-3xl font-bold text-slate-900">How It Works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {["Choose a teacher", "Book and pay securely", "Join live class instantly"].map((step, idx) => (
            <GlassCard key={step} className="p-6">
              <p className="text-sm font-bold text-brand-600">Step {idx + 1}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{step}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-3xl font-bold text-slate-900">Platform Features</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <GlassCard key={feature.title} className="p-6">
              <div className="mb-3 inline-flex rounded-xl bg-brand-100 p-3 text-xl text-brand-700">{feature.icon}</div>
              <p className="text-xl font-bold text-slate-900">{feature.title}</p>
              <p className="mt-2 text-sm text-slate-600">{feature.text}</p>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
