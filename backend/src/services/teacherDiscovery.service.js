import { Teacher } from "../models/Teacher.js";

const availabilityRank = { online: 0, away: 1, busy: 2, in_session: 3, not_accepting_sessions: 4, offline: 5 };
const synonymMap = new Map([
  ["dsa", "data structures algorithms"],
  ["data structure", "data structures"],
  ["data structures and algorithms", "data structures algorithms"],
  ["algo", "algorithms"],
  ["algos", "algorithms"],
  ["ll", "linked list"],
  ["linked lists", "linked list"],
  ["dp", "dynamic programming"],
  ["dynamic programing", "dynamic programming"],
  ["recursion", "recursion"],
  ["reactjs", "react"],
  ["react js", "react"],
  ["js", "javascript"],
  ["nodejs", "node"],
  ["node js", "node"],
  ["cp", "competitive programming"],
  ["jee", "joint entrance examination"],
  ["neet", "medical entrance"],
  ["electrostatics", "electrostatics"]
]);

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
  topics: teacher.topics || [],
  qualifications: teacher.qualifications,
  certificates: teacher.certificates || [],
  experience: teacher.experience,
  yearsExperience: teacher.yearsExperience || teacher.experience || 0,
  languages: teacher.languages,
  classLevels: teacher.classLevels || [],
  tags: teacher.tags || [],
  totalStudents: Number(teacher.totalStudents || 0),
  pricePerSession: Number(teacher.pricePerSession || teacher.price_30 || teacher.price_15 || 0),
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

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeTerm = (value = "") => {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return synonymMap.get(normalized) || normalized;
};

const expandTerm = (value = "") => {
  const normalized = normalizeTerm(value);
  if (!normalized) return [];
  const variants = new Set([normalized]);
  synonymMap.forEach((target, alias) => {
    if (target === normalized || alias === normalized) {
      variants.add(alias);
      variants.add(target);
    }
  });
  normalizeSearchTokens(normalized).forEach((token) => variants.add(normalizeTerm(token)));
  return [...variants].filter(Boolean);
};

const normalizedList = (items = []) => items.map(normalizeTerm).filter(Boolean);

const fuzzyIncludes = (candidate = "", query = "") => {
  const left = normalizeTerm(candidate);
  const right = normalizeTerm(query);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;

  const leftTokens = new Set(normalizeSearchTokens(left).map(normalizeTerm));
  const rightTokens = normalizeSearchTokens(right).map(normalizeTerm);
  if (!rightTokens.length) return false;
  return rightTokens.every((token) => leftTokens.has(token));
};

const listHasSemanticMatch = (items = [], query = "") => {
  const variants = expandTerm(query);
  if (!variants.length) return false;
  return items.some((item) => variants.some((variant) => fuzzyIncludes(item, variant)));
};

const minSessionPrice = (teacher) => {
  const prices = [teacher.pricePerSession, teacher.price_15, teacher.price_30, teacher.price_45, teacher.price_60]
    .map(Number)
    .filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : 0;
};

const teacherSearchBlob = (teacher) => {
  const parts = [
    teacher.user_id?.name || "",
    ...(teacher.subjects || []),
    ...(teacher.topics || []),
    ...(teacher.languages || []),
    ...(teacher.classLevels || []),
    ...(teacher.tags || []),
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
  const subject = String(filters?.subject || "").trim();
  const topic = String(filters?.topic || "").trim();
  const language = String(filters?.language || "").trim();
  const classLevel = String(filters?.classLevel || "").trim();
  const extraContext = String(filters?.extraContext || problem || "").trim();
  const budget = Number(filters?.budget || 0);
  const contextTokens = normalizeSearchTokens([topic, extraContext].filter(Boolean).join(" "));
  const detectedTerms = [...new Set(contextTokens.map(normalizeTerm).filter(Boolean))];
  const candidateTerms = [...new Set([subject, topic, language, classLevel, ...detectedTerms].map(normalizeTerm).filter(Boolean))];

  const teacherFilter = { is_verified: true, approvalStatus: "approved" };
  if (subject) {
    teacherFilter.subjects = { $in: expandTerm(subject).map((term) => new RegExp(`(^|\\b)${escapeRegex(term)}(\\b|$)`, "i")) };
  } else if (candidateTerms.length) {
    const regexes = candidateTerms.slice(0, 8).map((term) => new RegExp(escapeRegex(term), "i"));
    teacherFilter.$or = [
      { subjects: { $in: regexes } },
      { topics: { $in: regexes } },
      { tags: { $in: regexes } },
      { languages: { $in: regexes } },
      { classLevels: { $in: regexes } },
      { category: { $in: regexes } }
    ];
  } else if (budget) {
    teacherFilter.$or = [
      { pricePerSession: { $lte: budget } },
      { price_15: { $lte: budget } },
      { price_30: { $lte: budget } },
      { price_45: { $lte: budget } },
      { price_60: { $lte: budget } }
    ];
  }

  const teachers = await Teacher.find(teacherFilter)
    .populate({
      path: "user_id",
      match: { role: "teacher", is_active: true },
      select: "name email avatar_url role is_active"
    })
    .sort({ rating: -1, rating_count: -1 });

  const validTeachers = teachers.filter((teacher) => teacher.user_id);

  const scored = validTeachers.map((teacher) => {
    const searchableTopics = [
      ...(teacher.topics || []),
      ...(teacher.tags || []),
      teacher.bio || "",
      teacher.qualifications || "",
      teacher.category || ""
    ];
    const subjectFit = !subject || listHasSemanticMatch(teacher.subjects || [], subject);
    const topicFit = !topic || listHasSemanticMatch(searchableTopics, topic);
    const contextMatches = detectedTerms.filter((term) =>
      listHasSemanticMatch([...(teacher.topics || []), ...(teacher.tags || []), ...(teacher.subjects || [])], term)
    );
    const languageFit = !language || listHasSemanticMatch(teacher.languages || [], language);
    const classLevelFit = !classLevel || listHasSemanticMatch(teacher.classLevels || [], classLevel);
    const mentorPrice = minSessionPrice(teacher);
    const budgetFit = !budget || (mentorPrice > 0 && mentorPrice <= budget);

    if (!subjectFit) {
      return null;
    }

    const subjectScore = subject ? 50 : 20;
    const topicScore = topic ? (topicFit ? 25 : 8) : Math.min(contextMatches.length * 6, 18);
    const languageScore = language ? (languageFit ? 10 : -3) : 0;
    const budgetScore = budget ? (budgetFit ? 10 : Math.max(2, 7 - Math.ceil((mentorPrice - budget) / Math.max(budget, 1) * 5))) : 5;
    const classScore = classLevel ? (classLevelFit ? 7 : -4) : 0;
    const ratingBoost = Math.min(Number(teacher.rating || 0), 5);
    const experienceBoost = Math.min(Number(teacher.yearsExperience || teacher.experience || 0), 8) * 0.5;
    const studentBoost = Math.min(Number(teacher.totalStudents || 0) / 50, 3);
    const availabilityBoost = teacher.availability === "online" ? 3 : teacher.availability === "away" ? 1 : 0;
    const score =
      subjectScore +
      topicScore +
      languageScore +
      budgetScore +
      classScore +
      ratingBoost +
      experienceBoost +
      studentBoost +
      availabilityBoost;

    const reasons = [];
    if (subject) reasons.push(`Teaches ${subject}`);
    if (topicFit && topic) reasons.push(`Expert in ${topic}`);
    if (topic && !topicFit) reasons.push(`Strong ${subject || "subject"} mentor`);
    contextMatches.slice(0, 2).forEach((term) => reasons.push(`Matches ${term}`));
    if (budgetFit && budget) reasons.push("Within budget");
    if (!budgetFit && budget) reasons.push(`Above your Rs. ${budget} budget`);
    if (languageFit && language) reasons.push(`${language} support`);
    if (classLevelFit && classLevel) reasons.push(`Fits ${classLevel}`);
    if ((teacher.tags || []).length) reasons.push((teacher.tags || [])[0]);

    return {
      teacher,
      score,
      reasons: reasons.slice(0, 5),
      matchedTokens: [...new Set([subject, topic, ...contextMatches].filter(Boolean))],
      matchPercentage: Math.max(50, Math.min(99, Math.round(score))),
      budgetFit,
      mentorPrice
    };
  }).filter(Boolean);

  scored.sort((a, b) => b.score - a.score);

  const cappedLimit = Math.min(Math.max(Number(limit) || 6, 1), 12);
  const top = scored.filter((item) => item.score > 0).slice(0, cappedLimit);

  const recommendation = top.map((item) => ({
    ...mapTeacherDoc(item.teacher),
    ai: {
      score: Number(item.score.toFixed(2)),
      matchPercentage: item.matchPercentage,
      budgetFit: item.budgetFit,
      outOfBudget: budget ? !item.budgetFit : false,
      mentorPrice: item.mentorPrice,
      reasons: item.reasons.length ? item.reasons : ["Strong overall mentor profile match"],
      matchedTokens: item.matchedTokens.slice(0, 8)
    }
  }));

  return {
    analysis: {
      detectedTopics: [...new Set([topic, ...detectedTerms].filter(Boolean))].slice(0, 10),
      detectedIntent: detectedTerms.filter((term) => ["interview", "interview prep", "competitive programming", "exam"].some((intent) => term.includes(intent))).slice(0, 5),
      queryLength: [subject, topic, extraContext].filter(Boolean).join(" ").trim().length,
      recommendationCount: recommendation.length,
      outOfBudgetCount: recommendation.filter((teacher) => teacher.ai?.outOfBudget).length,
      withinBudgetCount: recommendation.filter((teacher) => !teacher.ai?.outOfBudget).length
    },
    teachers: recommendation
  };
};
