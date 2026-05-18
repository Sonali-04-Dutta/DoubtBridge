import { Teacher } from "../models/Teacher.js";

const availabilityRank = { online: 0, away: 1, busy: 2, in_session: 3, not_accepting_sessions: 4, offline: 5 };

const stopWords = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "to",
  "of",
  "in",
  "on",
  "at",
  "is",
  "are",
  "i",
  "my",
  "me",
  "with",
  "need",
  "help",
  "from",
  "about",
  "want",
  "learn"
]);

export const mapTeacherDoc = (teacher) => ({
  id: teacher._id.toString(),
  userId: teacher.user_id?._id ? teacher.user_id._id.toString() : teacher.user_id.toString(),
  name: teacher.user_id?.name || "",
  email: teacher.user_id?.email || "",
  avatarUrl: teacher.profileImage || teacher.user_id?.avatar_url || null,
  profileImage: teacher.profileImage || "",
  bio: teacher.bio,
  subjects: teacher.subjects,
  qualifications: teacher.qualifications,
  certificates: teacher.certificates || [],
  experience: teacher.experience,
  languages: teacher.languages,
  pricing: {
    min15: teacher.price_15,
    min30: teacher.price_30,
    min45: teacher.price_45,
    min60: teacher.price_60
  },
  category: teacher.category,
  availability: teacher.availability,
  status: teacher.status || teacher.availability,
  manualStatus: teacher.manualStatus || null,
  isInSession: Boolean(teacher.isInSession),
  lastSeen: teacher.lastSeen,
  rating: Number(teacher.rating || 0),
  ratingCount: teacher.rating_count,
  isVerified: teacher.is_verified,
  approvalStatus: teacher.approvalStatus || (teacher.is_verified ? "approved" : "pending"),
  adminFeedback: teacher.adminFeedback || ""
});

const buildUserMatch = (search = "") => {
  const normalizedSearch = String(search || "").trim();
  if (!normalizedSearch) {
    return { role: "teacher", is_active: true };
  }

  return {
    role: "teacher",
    is_active: true,
    $or: [
      { name: { $regex: normalizedSearch, $options: "i" } },
      { email: { $regex: normalizedSearch, $options: "i" } }
    ]
  };
};

const normalizeSearchTokens = (value = "") =>
  String(value)
    .toLowerCase()
    .split(/[^a-z0-9+.#-]+/g)
    .map((item) => item.trim())
    .filter((item) => item && item.length > 1 && !stopWords.has(item));

const teacherSearchBlob = (teacher) => {
  const parts = [
    teacher.user_id?.name || "",
    ...(teacher.subjects || []),
    ...(teacher.languages || []),
    teacher.bio || "",
    teacher.qualifications || "",
    teacher.category || ""
  ];
  return parts.join(" ").toLowerCase();
};

const scoreTeacherMatch = (teacher, tokens) => {
  const blob = teacherSearchBlob(teacher);
  const matchedTokens = tokens.filter((token) => blob.includes(token));
  const tokenMatchScore = matchedTokens.length * 2.2;
  const ratingScore = Number(teacher.rating || 0) * 1.1;
  const experienceScore = Math.min(Number(teacher.experience || 0), 10) * 0.2;
  const availabilityScore = teacher.availability === "online" ? 2 : teacher.availability === "away" ? 0.7 : 0;
  const verifiedScore = teacher.is_verified ? 0.8 : 0;
  const score = tokenMatchScore + ratingScore + experienceScore + availabilityScore + verifiedScore;

  const reasons = [];
  if (matchedTokens.length) {
    reasons.push(`Matches topics: ${matchedTokens.slice(0, 4).join(", ")}`);
  }
  if (Number(teacher.rating || 0) >= 4) {
    reasons.push(`High rating: ${Number(teacher.rating || 0).toFixed(1)}`);
  }
  if (teacher.availability === "online") {
    reasons.push("Currently online");
  }
  if ((teacher.subjects || []).length) {
    reasons.push(`Covers ${teacher.subjects.slice(0, 2).join(", ")}`);
  }

  return {
    score,
    matchedTokens,
    reasons: reasons.slice(0, 2)
  };
};

export const listMentorsDirectory = async ({ subject, availability, minPrice, maxPrice, minRating, search }) => {
  const hasMinPrice = minPrice !== undefined && minPrice !== "" && Number.isFinite(Number(minPrice));
  const hasMaxPrice = maxPrice !== undefined && maxPrice !== "" && Number.isFinite(Number(maxPrice));
  const hasMinRating = minRating !== undefined && minRating !== "" && Number.isFinite(Number(minRating));
  const normalizedSubject = String(subject || "").trim();
  const normalizedSearch = String(search || "").trim();

  const teacherFilter = { is_verified: true, approvalStatus: "approved" };
  if (normalizedSubject) {
    teacherFilter.subjects = { $in: [new RegExp(`^${normalizedSubject}$`, "i")] };
  }
  if (availability) {
    teacherFilter.availability = availability;
  }
  if (hasMinRating) {
    teacherFilter.rating = { ...(teacherFilter.rating || {}), $gte: Number(minRating) };
  }

  const teachers = await Teacher.find(teacherFilter)
    .populate({
      path: "user_id",
      match: buildUserMatch(normalizedSearch),
      select: "name email avatar_url role is_active"
    })
    .sort({ availability: -1, rating: -1, rating_count: -1 });

  const filtered = teachers.filter((teacher) => {
    if (!teacher.user_id || teacher.user_id.role !== "teacher") return false;

    const minTeacherPrice = Math.min(teacher.price_15, teacher.price_30, teacher.price_45, teacher.price_60);
  const maxTeacherPrice = Math.max(teacher.price_15, teacher.price_30, teacher.price_45, teacher.price_60);

    if (hasMinPrice && minTeacherPrice < Number(minPrice)) return false;
    if (hasMaxPrice && maxTeacherPrice > Number(maxPrice)) return false;
    if (
      normalizedSearch &&
      !teacher.user_id.name.toLowerCase().includes(normalizedSearch.toLowerCase()) &&
      !(teacher.subjects || []).some((item) => item.toLowerCase().includes(normalizedSearch.toLowerCase()))
    ) {
      return false;
    }

    return true;
  });

  filtered.sort((a, b) => {
    const statusDiff = availabilityRank[a.availability] - availabilityRank[b.availability];
    if (statusDiff !== 0) return statusDiff;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.rating_count - a.rating_count;
  });

  return filtered;
};

export const recommendMentorsByProblem = async ({ problem, filters = {}, limit = 6 }) => {
  const teachers = await Teacher.find({ is_verified: true, approvalStatus: "approved" })
    .populate({
      path: "user_id",
      match: { role: "teacher", is_active: true },
      select: "name email avatar_url role is_active"
    })
    .sort({ rating: -1, rating_count: -1 });

  const validTeachers = teachers.filter((teacher) => teacher.user_id);
  const tokens = normalizeSearchTokens(problem);
  const budget = Number(filters?.budget || 0);
  const normalizedSubject = String(filters?.subject || "").trim().toLowerCase();
  const normalizedLanguage = String(filters?.language || "").trim().toLowerCase();
  const scored = validTeachers.map((teacher) => {
    const match = scoreTeacherMatch(teacher, tokens);
    const subjects = (teacher.subjects || []).map((item) => item.toLowerCase());
    const languages = (teacher.languages || []).map((item) => item.toLowerCase());
    const priceFit = !budget || Number(teacher.price_15 || 0) <= budget || Number(teacher.price_30 || 0) <= budget;
    const subjectFit = !normalizedSubject || subjects.some((item) => item.includes(normalizedSubject));
    const languageFit = !normalizedLanguage || languages.some((item) => item.includes(normalizedLanguage));
    const filterBonus = (priceFit ? 1.2 : -1.5) + (subjectFit ? 2.5 : 0) + (languageFit ? 1 : 0);
    return {
      teacher,
      score: match.score + filterBonus,
      reasons: match.reasons,
      matchedTokens: match.matchedTokens
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const cappedLimit = Math.min(Math.max(Number(limit) || 6, 1), 12);
  let top = scored.filter((item) => item.score > 0).slice(0, cappedLimit);
  if (top.length === 0) {
    top = scored.slice(0, cappedLimit);
  }

  const recommendation = top.map((item) => ({
    ...mapTeacherDoc(item.teacher),
    ai: {
      score: Number(item.score.toFixed(2)),
      reasons: item.reasons.length ? item.reasons : ["Strong overall mentor profile match"],
      matchedTokens: item.matchedTokens.slice(0, 8)
    }
  }));

  return {
    analysis: {
      detectedTopics: tokens.slice(0, 10),
      queryLength: String(problem || "").trim().length,
      recommendationCount: recommendation.length
    },
    teachers: recommendation
  };
};
