import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaArrowRight,
  FaBriefcase,
  FaBug,
  FaChevronDown,
  FaClock,
  FaEnvelope,
  FaGraduationCap,
  FaHeadset,
  FaPaperPlane,
  FaRegComments,
  FaShieldAlt,
  FaUserTie
} from "react-icons/fa";
import toast from "react-hot-toast";

const supportOptions = [
  {
    icon: FaGraduationCap,
    title: "Student Support",
    description: "Bookings, payments, refunds, mentor matching, and live class help.",
    email: "support@doubtbridge.com"
  },
  {
    icon: FaUserTie,
    title: "Mentor Support",
    description: "Profile approval, session tools, earnings, and student conversations.",
    email: "mentors@doubtbridge.com"
  },
  {
    icon: FaBug,
    title: "Report an Issue",
    description: "Tell us about bugs, failed sessions, payment errors, or safety concerns.",
    email: "report@doubtbridge.com"
  },
  {
    icon: FaBriefcase,
    title: "Partnerships",
    description: "School, college, creator, and EdTech collaboration opportunities.",
    email: "partners@doubtbridge.com"
  }
];

const faqs = [
  {
    question: "Payment failed but money deducted",
    answer: "Share the payment ID, booking ID, and screenshot. Our team checks Razorpay status and updates the booking or refund path."
  },
  {
    question: "Mentor did not join session",
    answer: "Report it from support with your booking ID. We review attendance logs and help with refund or rescheduling options."
  },
  {
    question: "How refunds work",
    answer: "Refund eligibility depends on payment status, session status, and mentor attendance. Approved refunds are processed back to the original payment method."
  },
  {
    question: "How to reschedule a class",
    answer: "Message your mentor first. If payment is already complete and timing changes are needed, contact support with the booking details."
  },
  {
    question: "How to become a mentor",
    answer: "Create a mentor account, complete your profile with subjects, topics, languages, pricing, and certificates, then wait for admin review."
  },
  {
    question: "Live class not opening",
    answer: "Check your browser permission, internet connection, and login session. If it still fails, send us your booking ID and a screenshot."
  }
];

const fieldClass =
  "w-full rounded-2xl border border-[#DDD6FE] bg-white/80 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#DDD6FE]/70";

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

const SupportIllustration = () => (
  <div className="relative mx-auto aspect-square w-full max-w-[360px]">
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-8 rounded-[42px] border border-white/70 bg-white/60 shadow-[0_24px_70px_rgba(124,58,237,0.2)] backdrop-blur-xl"
    />
    <div className="absolute inset-0 rounded-full bg-[#DDD6FE]/70 blur-3xl" />
    <div className="absolute left-8 right-8 top-14 rounded-[28px] border border-white/80 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F5F3FF] text-[#7C3AED]">
          <FaHeadset />
        </span>
        <div>
          <p className="text-sm font-extrabold text-slate-900">Support desk</p>
          <p className="text-xs font-semibold text-emerald-600">Online now</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-3 w-3/4 rounded-full bg-[#DDD6FE]" />
        <div className="h-3 w-1/2 rounded-full bg-[#EDE9FE]" />
        <div className="ml-auto h-10 w-3/5 rounded-2xl bg-[#7C3AED]" />
      </div>
    </div>
    <div className="absolute bottom-10 left-0 rounded-3xl border border-white/80 bg-white/85 p-4 shadow-card backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-wide text-[#5B21B6]">Avg response</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-950">24h</p>
    </div>
    <div className="absolute bottom-8 right-3 grid h-16 w-16 place-items-center rounded-3xl bg-[#7C3AED] text-2xl text-white shadow-glow">
      <FaRegComments />
    </div>
  </div>
);

const SupportCard = ({ option, index }) => {
  const Icon = option.icon;

  return (
    <motion.article
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="group rounded-3xl border border-[#DDD6FE]/80 bg-white/78 p-5 shadow-card backdrop-blur-xl transition hover:border-[#8B5CF6]/50 hover:shadow-glow"
    >
      <div className="grid h-13 w-13 place-items-center rounded-2xl bg-[#F5F3FF] text-xl text-[#7C3AED] transition group-hover:bg-[#7C3AED] group-hover:text-white">
        <Icon />
      </div>
      <h3 className="mt-5 text-lg font-extrabold text-slate-950">{option.title}</h3>
      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">{option.description}</p>
      <a
        href={`mailto:${option.email}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#DDD6FE] bg-white px-4 py-3 text-sm font-bold text-[#5B21B6] transition hover:border-[#8B5CF6] hover:bg-[#F5F3FF]"
      >
        <FaEnvelope />
        {option.email}
      </a>
    </motion.article>
  );
};

const FAQItem = ({ item, isOpen, onToggle }) => (
  <div className="rounded-3xl border border-[#DDD6FE]/80 bg-white/75 shadow-sm backdrop-blur-xl">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
    >
      <span className="text-sm font-extrabold text-slate-900 sm:text-base">{item.question}</span>
      <FaChevronDown className={`shrink-0 text-[#7C3AED] transition ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <AnimatePresence initial={false}>
      {isOpen ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <p className="px-5 pb-5 text-sm leading-6 text-slate-600">{item.answer}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  </div>
);

const ContactPage = () => {
  const [openFaq, setOpenFaq] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Student",
    issueType: "Booking",
    subject: "",
    message: ""
  });

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setForm({ name: "", email: "", role: "Student", issueType: "Booking", subject: "", message: "" });
      toast.success("Message sent. Our support team will reply soon.");
    }, 800);
  };

  return (
    <div className="space-y-10 pb-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br from-[#F5F3FF] via-white to-[#DDD6FE] p-6 shadow-card sm:p-8 lg:p-10">
        <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-[#8B5CF6]/18 blur-3xl" />
        <div className="absolute -right-16 bottom-4 h-64 w-64 rounded-full bg-[#7C3AED]/14 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#5B21B6]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Support Center
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl">
              Need help? We&apos;re here for you.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Get support for bookings, payments, live classes, mentor issues, and platform questions.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#contact-form" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-[#5B21B6]">
                Contact Support
                <FaArrowRight />
              </a>
              <a href="#faq" className="inline-flex items-center justify-center rounded-2xl border border-[#DDD6FE] bg-white/80 px-5 py-3 text-sm font-bold text-[#5B21B6] transition hover:bg-[#F5F3FF]">
                Browse FAQ
              </a>
            </div>
          </motion.div>
          <SupportIllustration />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {supportOptions.map((option, index) => (
          <SupportCard key={option.email} option={option} index={index} />
        ))}
      </section>

      <section id="faq" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-card backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#F5F3FF] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#5B21B6]">
            <FaShieldAlt />
            Quick help
          </p>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-950">Answers before you wait.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Common booking, refund, live class, and mentor profile questions are covered here.
          </p>
          <div className="mt-6 rounded-3xl bg-[#F5F3FF] p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-[#5B21B6]">
              <FaClock />
              Average response time: within 24 hours
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Urgent payment and live session issues are prioritized by the support team.
            </p>
          </div>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((item, index) => (
            <FAQItem
              key={item.question}
              item={item}
              isOpen={openFaq === index}
              onToggle={() => setOpenFaq((current) => (current === index ? -1 : index))}
            />
          ))}
        </div>
      </section>

      <section id="contact-form" className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="rounded-[32px] border border-[#DDD6FE]/80 bg-white/75 p-6 shadow-card backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#F5F3FF] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#5B21B6]">
            <FaPaperPlane />
            Send a request
          </p>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-950">Tell us what happened.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add the booking ID, payment ID, or mentor name if you have it. Clear context helps us resolve faster.
          </p>

          <div className="mt-6 grid gap-3">
            {["Booking ID", "Payment screenshot", "Session time", "Mentor name"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#F5F3FF] px-4 py-3 text-sm font-semibold text-slate-700">
                <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                {item} helps speed up support
              </div>
            ))}
          </div>
        </motion.div>

        <motion.form
          onSubmit={onSubmit}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-card backdrop-blur-xl sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Full Name</span>
              <input required value={form.name} onChange={updateField("name")} className={fieldClass} placeholder="Your name" />
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Email</span>
              <input required type="email" value={form.email} onChange={updateField("email")} className={fieldClass} placeholder="you@example.com" />
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Role</span>
              <select value={form.role} onChange={updateField("role")} className={fieldClass}>
                <option>Student</option>
                <option>Mentor</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Issue Type</span>
              <select value={form.issueType} onChange={updateField("issueType")} className={fieldClass}>
                <option>Booking</option>
                <option>Payment</option>
                <option>Live Class</option>
                <option>Mentor Issue</option>
                <option>Platform Question</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Subject</span>
              <input required value={form.subject} onChange={updateField("subject")} className={fieldClass} placeholder="What do you need help with?" />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Message</span>
              <textarea required rows={5} value={form.message} onChange={updateField("message")} className={`${fieldClass} resize-none`} placeholder="Write the details here..." />
            </label>
          </div>
          <button disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-[#5B21B6] disabled:opacity-70 sm:w-auto">
            <FaPaperPlane />
            {loading ? "Sending..." : "Send Message"}
          </button>
        </motion.form>
      </section>

      <section className="relative overflow-hidden rounded-[32px] border border-[#DDD6FE]/70 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] p-6 text-white shadow-glow sm:p-8">
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">Still need help?</h2>
            <p className="mt-2 text-sm text-white/85">Our support team is always ready to assist you.</p>
          </div>
          <a href="#contact-form" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#5B21B6] transition hover:bg-[#F5F3FF]">
            Contact Support
            <FaArrowRight />
          </a>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
