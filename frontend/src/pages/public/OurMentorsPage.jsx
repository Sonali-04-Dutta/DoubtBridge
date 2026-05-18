import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaComments, FaSearch, FaUsers } from "react-icons/fa";
import EmptyState from "../../components/common/EmptyState";
import PageLoader from "../../components/common/PageLoader";
import MentorDirectoryCard from "../../components/teacher/MentorDirectoryCard";
import { api } from "../../lib/api";
import { useTeacherPresence } from "../../hooks/useTeacherPresence";

const OurMentorsPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const teacherStatuses = useTeacherPresence(teachers);

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const normalizedSubject = subject.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesQuery =
        !query ||
        teacher.name.toLowerCase().includes(query) ||
        teacher.subjects?.some((item) => item.toLowerCase().includes(query));

      const matchesSubject =
        !normalizedSubject ||
        teacher.subjects?.some((item) => item.toLowerCase().includes(normalizedSubject));

      return matchesQuery && matchesSubject;
    });
  }, [teachers, search, subject]);

  const subjects = useMemo(() => {
    const set = new Set();
    teachers.forEach((teacher) => teacher.subjects?.forEach((item) => set.add(item)));
    return [...set].slice(0, 20);
  }, [teachers]);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/teachers/mentors");
        setTeachers(data.teachers || []);
      } catch (_error) {
        setError("We couldn't load mentor directory right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-glow backdrop-blur-xl md:p-8">
        <div className="absolute -left-14 -top-10 h-44 w-44 rounded-full bg-brand-300/35 blur-3xl" />
        <div className="absolute -right-10 -bottom-12 h-48 w-48 rounded-full bg-brand-600/20 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-brand-700">
            <FaUsers />
            Mentor Network
          </p>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 md:text-4xl">Our Mentors</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            Browse every registered teacher, ask a few free questions, and book a focused doubt-solving session when ready.
          </p>

          <div className="mt-6 grid gap-3 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-card md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search Mentors</span>
              <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2">
                <FaSearch className="text-brand-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, subject, or skill"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</span>
              <input
                list="mentor-subjects"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Math, Coding..."
                className="w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm outline-none"
              />
              <datalist id="mentor-subjects">
                {subjects.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="mt-4 inline-flex items-start gap-2 rounded-2xl bg-brand-50 px-3 py-2 text-xs text-brand-800">
            <FaComments className="mt-0.5" />
            Students can send up to 6 free messages per mentor before payment.
          </div>
        </motion.div>
      </section>

      {error ? (
        <EmptyState
          title="Mentor directory unavailable"
          description={error}
          action={
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow"
            >
              Refresh
            </button>
          }
        />
      ) : null}

      {loading ? <PageLoader message="Loading every mentor in the DoubtBridge directory..." /> : null}

      {!loading && !error ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">All Registered Mentors</h2>
            <p className="text-sm font-semibold text-brand-700">{filteredTeachers.length} mentors</p>
          </div>

          {!filteredTeachers.length ? (
            <EmptyState
              title="No mentors match this filter"
              description="Try a broader query or clear your subject filter to see all teachers."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredTeachers.map((teacher) => (
                <MentorDirectoryCard key={teacher.id} teacher={teacher} liveStatus={teacherStatuses[teacher.userId]} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default OurMentorsPage;
