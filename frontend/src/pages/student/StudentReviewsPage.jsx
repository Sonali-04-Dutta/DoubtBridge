import { useState } from "react";
import { api } from "../../lib/api";

const StudentReviewsPage = () => {
  const [teacherUserId, setTeacherUserId] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/reviews", { teacherUserId, rating, review });
      setMessage("Review submitted successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to submit review");
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white/85 p-8 shadow-card">
      <h1 className="text-3xl font-bold text-slate-900">Rate a Teacher</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input className="w-full rounded-xl border border-brand-100 px-4 py-3" placeholder="Teacher User ID" value={teacherUserId} onChange={(e) => setTeacherUserId(e.target.value)} required />
        <select className="w-full rounded-xl border border-brand-100 px-4 py-3" value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select>
        <textarea className="w-full rounded-xl border border-brand-100 px-4 py-3" rows={4} placeholder="Write your review" value={review} onChange={(e) => setReview(e.target.value)} />
        <button className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white">Submit Review</button>
      </form>
      {message ? <p className="mt-3 text-sm font-semibold text-brand-700">{message}</p> : null}
    </div>
  );
};

export default StudentReviewsPage;
