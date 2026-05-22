import { useState } from "react";
import { motion } from "framer-motion";
import { FaMagic, FaPaperPlane, FaRobot } from "react-icons/fa";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import PageLoader from "../../components/common/PageLoader";
import RecommendationTeacherCard from "../../components/teacher/RecommendationTeacherCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { useTeacherPresence } from "../../hooks/useTeacherPresence";

const FindTeachersPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    budget: "",
    language: "",
    classLevel: ""
  });
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const teacherStatuses = useTeacherPresence(teachers);
  const [error, setError] = useState("");

  const fetchRecommendations = async () => {
    const trimmed = problem.trim();
    const hasFilter = Object.values(form).some((value) => String(value).trim());
    if (!hasFilter && trimmed.length < 3) {
      toast.error("Add a subject, topic, budget, language, or class level.");
      return;
    }
    if (!user || user.role !== "student") {
      toast.error("Please log in as a student to get AI recommendations.");
      return;
    }

    setLoading(true);
    setError("");
    setHasRequested(true);

    try {
      const { data } = await api.post("/recommend-mentors", {
        problem: trimmed,
        subject: form.subject,
        topic: form.topic,
        budget: form.budget,
        language: form.language,
        classLevel: form.classLevel,
        extraContext: trimmed,
        limit: 6
      });
      setTeachers(data.teachers || []);
      setAnalysis(data.analysis || null);
      if (!data.teachers?.length) {
        toast.error("No strong match found yet. Try adding more topic detail.");
      } else if ((data.analysis?.outOfBudgetCount || 0) > 0 && (data.analysis?.withinBudgetCount || 0) === 0) {
        toast("Teacher is found, but out of your budget.", {
          icon: "!",
          style: {
            border: "1px solid #f59e0b",
            color: "#92400e"
          }
        });
      } else {
        toast.success("AI found your best-fit mentors.");
      }
    } catch (requestError) {
      const message = requestError.response?.data?.message || "AI recommendation is unavailable right now.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await fetchRecommendations();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-brand-700/90 via-brand-600/85 to-brand-500/80 p-6 text-white shadow-glow md:p-8">
        <div className="absolute -left-14 -top-12 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -right-8 -bottom-12 h-52 w-52 rounded-full bg-brand-300/35 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em]">
            <FaRobot />
            AI Matchmaking
          </p>
          <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">Find Teachers with Smart Recommendations</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/90 md:text-base">
            Share your subject, topic, budget, preferred language, and class level. DoubtBridge only recommends mentors whose profile actually matches the subject and topic.
          </p>
          {!user || user.role !== "student" ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold text-white">
              AI recommendations are available for student accounts.
              <Link to="/login" className="rounded-lg bg-white px-2 py-1 text-brand-700">
                Login
              </Link>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 rounded-3xl border border-white/30 bg-white/15 p-4 backdrop-blur-xl">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/85">Subject</span>
                <input value={form.subject} onChange={updateField("subject")} placeholder="DSA" className="w-full rounded-2xl border border-white/35 bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/85">Topic</span>
                <input value={form.topic} onChange={updateField("topic")} placeholder="Graphs" className="w-full rounded-2xl border border-white/35 bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/85">Budget</span>
                <input value={form.budget} onChange={updateField("budget")} type="number" min="0" placeholder="200" className="w-full rounded-2xl border border-white/35 bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/85">Language</span>
                <input value={form.language} onChange={updateField("language")} placeholder="Hindi" className="w-full rounded-2xl border border-white/35 bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/85">Class</span>
                <input value={form.classLevel} onChange={updateField("classLevel")} placeholder="Class 12" className="w-full rounded-2xl border border-white/35 bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none" />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/85">
                Extra context
              </span>
              <textarea
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
                placeholder="Example: I am weak in recursion and need interview preparation."
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/35 bg-white/20 px-4 py-3 text-sm text-white placeholder:text-white/70 outline-none"
              />
            </label>
            <button
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50 disabled:opacity-70"
            >
              <FaPaperPlane />
              {loading ? "Analyzing request..." : "Recommend Mentors"}
            </button>
          </form>
        </motion.div>
      </section>

      {loading ? <PageLoader message="AI is matching your request with the most suitable mentors..." /> : null}

      {error ? (
        <EmptyState
          title="Recommendation engine unavailable"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchRecommendations}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow"
            >
              Try Again
            </button>
          }
        />
      ) : null}

      {!loading && !error && hasRequested && analysis ? (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-card">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-700">
            <FaMagic />
            AI Analysis Summary
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Detected Topics:{" "}
            <span className="font-semibold text-brand-700">
              {analysis.detectedTopics?.length ? analysis.detectedTopics.join(", ") : "General learning support"}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Recommended mentors: {analysis.recommendationCount || teachers.length}
          </p>
        </motion.section>
      ) : null}

      {!loading && !error && hasRequested ? (
        teachers.length ? (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Recommended Mentors For You</h2>
              <p className="text-sm font-semibold text-brand-700">{teachers.length} recommendations</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {teachers.map((teacher) => (
                <RecommendationTeacherCard key={teacher.id} teacher={teacher} liveStatus={teacherStatuses[teacher.userId]} />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            title="No exact mentor found"
            description="Try increasing budget, changing topic, or checking the subject spelling."
          />
        )
      ) : null}
    </div>
  );
};

export default FindTeachersPage;
