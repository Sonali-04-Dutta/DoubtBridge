# DoubtBridge

DoubtBridge is a full-stack instant doubt-solving platform where students can connect with teachers in real time.

## Monorepo Structure

- `frontend/` React + Tailwind + Router + Axios + Framer Motion
- `backend/` Express + MongoDB Atlas + Mongoose + JWT + Socket.io + Razorpay
- `backend/src/models/` Mongoose schemas for MongoDB collections

## Quick Start

1. Create a MongoDB Atlas cluster.
2. Copy env templates:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env`
3. Set backend env values:
   - `MONGO_URI`
   - `MONGO_DB_NAME`
   - `JWT_SECRET`
   - Firebase Admin credentials for Google login:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`
4. Set frontend env values:
   - `VITE_API_URL`
   - Firebase web app config values (`VITE_FIREBASE_*`)
5. Install dependencies:
   - `npm install` (root, for monorepo scripts)
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
6. Run app from repo root:
   - `npm run dev`

## Create Admin User

Signup a normal user first, then promote it in MongoDB:

```javascript
db.users.updateOne(
  { email: "you@example.com" },
  { $set: { role: "admin" } }
);
```

## API Groups

- `/api/auth` signup, login, google login, forgot-password, me
- `/api/teachers` mentor directory, teacher profile, AI recommendations, intro messaging, teacher intro inbox, profile update, availability
- `/api/bookings` create booking, list my bookings, accept/reject, complete
- `/api/payments` razorpay order + verify (demo fallback included)
- `/api/sessions` live session token/room details
- `/api/reviews` create review, teacher review list
- `/api/admin` stats, users, teacher verification

## Deployment

- Frontend: Vercel (`frontend/`)
- Backend: Render or Railway (`backend/`)
- Database: MongoDB Atlas

## Core Features Included

- JWT auth with role-based protected routes
- Google login via Firebase Authentication
- Forgot password reset flow
- Student, Teacher, Admin dashboards
- Public mentor directory + teacher profile pages
- AI-powered teacher recommendation flow
- Pre-booking limited mentor messaging (4 free messages before session payment)
- Teacher-side intro message replies with unread conversation counters
- Booking flow with duration-based pricing
- Razorpay order + verification hooks
- Real-time chat + availability with Socket.io
- Reviews and rating updates
- Live session page with timer and collaboration placeholders
