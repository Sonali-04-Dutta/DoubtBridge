import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { useNavigate } from "react-router-dom";

import ananyaAvatar from "../../assets/testimonials/ananya.png";
import souravAvatar from "../../assets/testimonials/sourav.png";
import arijitAvatar from "../../assets/testimonials/arijit.png";
import snehaAvatar from "../../assets/testimonials/sheha.png";
import ritamAvatar from "../../assets/testimonials/ritam.png";
import madhurimaAvatar from "../../assets/testimonials/madhurima.png";
import sayanAvatar from "../../assets/testimonials/sayan.png";
import priyaAvatar from "../../assets/testimonials/priya.png";

import "swiper/css";
import "swiper/css/pagination";

import { motion } from "framer-motion";

const reviews = [
  {
    name: "Ananya Das",
    role: "Engineering Student",
    text: "The live sessions are smooth and mentors explain concepts really well.",
    avatar: ananyaAvatar,
  },

  {
    name: "Sourav Roy",
    role: "JEE Aspirant",
    text: "I love how quickly teachers respond and explain difficult topics.",
    avatar: souravAvatar,
  },

  {
    name: "Priya Sen",
    role: "School Student",
    text: "The platform feels modern and very helpful for studies.",
    avatar: priyaAvatar,
  },

  {
    name: "Arijit Paul",
    role: "B.Tech Student",
    text: "The mentor quality is amazing and sessions are super interactive.",
    avatar: arijitAvatar,
  },

  {
    name: "Sneha Roy",
    role: "NEET Aspirant",
    text: "I finally understood difficult Biology concepts easily.",
    avatar: snehaAvatar,
  },

  {
    name: "Ritam Ghosh",
    role: "Engineering Student",
    text: "The platform UI is smooth and teachers are very supportive.",
    avatar: ritamAvatar,
  },

  {
    name: "Madhurima Das",
    role: "School Student",
    text: "I love the instant booking system and live classes.",
    avatar: madhurimaAvatar,
  },

  {
    name: "Sayan Dutta",
    role: "JEE Aspirant",
    text: "The sessions saved me before my entrance preparation.",
    avatar: sayanAvatar,
  },
];

const AboutPage = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-14">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa] px-8 py-20 text-white shadow-[0_20px_60px_rgba(139,92,246,0.25)]">

        {/* glow */}
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-pink-300/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">

          <p className="mb-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm font-semibold tracking-widest text-purple-100">
            ABOUT DOUBTBRIDGE
          </p>

          <h1 className="text-5xl font-extrabold leading-tight md:text-6xl">
            Making Learning
            <span className="block text-purple-200">
              Faster & Smarter
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-purple-100">
            DoubtBridge connects students with verified mentors for
            instant one-on-one doubt solving through live sessions,
            smart matching, and interactive learning.
          </p>

        </div>
      </section>

      {/* STORY SECTION */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#f7f1ff] px-8 py-16">

        {/* glow */}
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-purple-300/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="relative z-10 grid items-center gap-14 lg:grid-cols-2">

          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-brand-600">
              OUR STORY
            </p>

            <h2 className="text-5xl font-extrabold leading-tight text-slate-900">
              Learning becomes easier
              when help is instant.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              DoubtBridge was built to remove the frustration students
              feel when they get stuck while studying.
            </p>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              We connect learners with expert mentors through
              instant live sessions, creating a faster and more
              engaging educational experience.
            </p>

            {/* mini stats */}
            <div className="mt-10 flex flex-wrap gap-4">

              <div className="rounded-2xl bg-white px-6 py-4 shadow-lg">
                <h3 className="text-3xl font-extrabold text-brand-600">
                  1K+
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Students
                </p>
              </div>

              <div className="rounded-2xl bg-white px-6 py-4 shadow-lg">
                <h3 className="text-3xl font-extrabold text-brand-600">
                  100+
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Mentors
                </p>
              </div>

            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center"
          >

            <div className="absolute left-0 top-10 rounded-2xl bg-white px-5 py-4 shadow-xl">
              ⚡ Instant Support
            </div>

            <div className="absolute bottom-10 right-0 rounded-2xl bg-brand-600 px-6 py-4 text-white shadow-xl">
              🎥 Live Learning
            </div>

            <div
              className="
                flex
                h-[420px]
                w-[360px]
                items-center
                justify-center
                rounded-[2.5rem]
                bg-gradient-to-br
                from-[#7c3aed]
                via-[#8b5cf6]
                to-[#a78bfa]
                text-center
                shadow-[0_20px_60px_rgba(139,92,246,0.25)]
              "
            >

              <div>
                <div className="text-7xl">
                  📚
                </div>

                <h3 className="mt-6 text-3xl font-bold text-white">
                  Smart Learning
                </h3>

                <p className="mt-4 px-10 leading-7 text-purple-100">
                  Learn faster through instant mentorship and interactive sessions.
                </p>
              </div>

            </div>

          </motion.div>

        </div>
      </section>

      {/* TESTIMONIAL SECTION */}
      <section className="space-y-12">

        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-600">
            TESTIMONIALS
          </p>

          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            What Students Say
          </h2>

          <p className="mt-4 text-slate-600">
            Real experiences from students learning with DoubtBridge.
          </p>
        </div>

        <Swiper
          modules={[Autoplay, Pagination]}
          slidesPerView={1}
          spaceBetween={30}
          loop={true}
          autoplay={{
            delay: 1700,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          breakpoints={{
            768: {
              slidesPerView: 2,
            },

            1024: {
              slidesPerView: 3,
            },
          }}
          className="pb-14"
        >

          {reviews.map((review) => (
            <SwiperSlide key={review.name}>

              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.35 }}
                className="
                  relative
                  mt-16
                  rounded-[2rem]
                  bg-white
                  px-8
                  pb-10
                  pt-20
                  text-center
                  shadow-[0_20px_60px_rgba(139,92,246,0.10)]
                  transition-all
                  duration-100
                  hover:shadow-[0_25px_70px_rgba(139,92,246,0.16)]
                "
              >

                {/* avatar */}
                <div
                  className="
                    absolute
                    left-1/2
                    top-0
                    -translate-x-1/2
                    -translate-y-1/2
                  "
                >
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="
                      h-24
                      w-24
                      rounded-full
                      border-4
                      border-white
                      object-cover
                      shadow-xl
                    "
                  />
                </div>

                {/* quote */}
                <div className="text-5xl font-bold text-brand-300">
                  “
                </div>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {review.name}
                </h3>

                <p className="mt-1 text-sm text-brand-500">
                  {review.role}
                </p>

                <p className="mt-6 text-[15px] leading-8 text-slate-600">
                  {review.text}
                </p>

                <div className="mt-6 flex justify-end text-4xl font-bold text-brand-300">
                  ”
                </div>

              </motion.div>

            </SwiperSlide>
          ))}

        </Swiper>
      </section>

      {/* CTA SECTION */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa] px-8 py-16 text-center shadow-[0_20px_60px_rgba(139,92,246,0.25)]">

        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-pink-300/10 blur-3xl" />

        <div className="relative z-10">

          <h2 className="text-4xl font-extrabold text-white">
            Ready to Start Learning?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-purple-100">
            Join DoubtBridge today and connect with expert mentors
            for instant doubt-solving and smarter learning.
          </p>

         <button
  onClick={() => navigate("/login")}
  className="
    mt-8
    rounded-2xl
    bg-white
    px-8
    py-4
    text-sm
    font-bold
    text-brand-700
    shadow-xl
    transition-all
    duration-300
    hover:-translate-y-1
    hover:shadow-2xl
  "
>
  Get Started
</button>

        </div>
      </section>

    </div>
  );
};

export default AboutPage;
