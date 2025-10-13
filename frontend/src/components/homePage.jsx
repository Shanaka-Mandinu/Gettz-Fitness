import { useState, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import {
  Dumbbell,
  HeartPulse,
  Flame,
  Trophy,
  Play,
  ArrowRight,
  Clock,
  ShieldCheck,
  Star,
  Check,
  Activity,
  Cpu,
  Smartphone,
  QrCode,
  Headphones,
} from "lucide-react";
import { Link } from "react-router-dom";
import FeedbackDisplay from "./FeedbackDisplay";
import axios from "axios";


const BRAND = {
  red: "#DC2626",
  darkRed: "#B91C1C",
  lightRed: "#FEF2F2",
  white: "#FFFFFF",
  gray: "#F1F5F9",
  darkGray: "#0F172A",
  textGray: "#475569",
  lightGray: "#E2E8F0",
  cardGray: "#F8FAFC",
};

export default function GymLandingPage() {
  const [email, setEmail] = useState("");
  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <Hero email={email} setEmail={setEmail} />
      <AttributePills />
      <BentoFeatures />
      <VideoTeaser />
      <Programs />
      <Stats />
      <Coaches />
      {/* <Pricing /> */}
      <FeedbackDisplay />
      <Faq />
      <FinalCta />
    </div>
  );
}

/** ===== Layout ===== */
function Container({ className = "", children }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 md:px-6 ${className}`}>{children}</div>;
}

/** ===== Util: 3D Tilt ===== */
function Tilt3D({ children, max = 12, glare = true }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(py * -max);
    ry.set(px * max);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };
  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className="transform-gpu will-change-transform relative"
    >
      {children}
      {glare && (
        <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-20 mix-blend-screen"
             style={{ background: "linear-gradient(120deg, rgba(255,255,255,.2), transparent 60%)" }}/>
      )}
    </motion.div>
  );
}


function Hero({ email, setEmail }) {
  const [memberCount, setMemberCount] = useState("1,247");
  const [loading, setLoading] = useState(true);

  const API_BASE =
    (import.meta?.env && import.meta.env.VITE_BACKEND_URL) ||
    (window.location.port === "5173" ? "http://localhost:3000" : window.location.origin);

  useEffect(() => {
    fetchMemberCount();
  }, []);

  const fetchMemberCount = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/stats/public`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (data.success) {
        setMemberCount(data.data.activeMembers.toLocaleString());
      } else {
        setMemberCount("1,247");
      }
    } catch (error) {
      console.error("Error fetching member count:", error);
      setMemberCount("1,247");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50">
      <div
        aria-hidden
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #DC2626 0%, transparent 50%), radial-gradient(circle at 75% 75%, #DC2626 0%, transparent 50%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(220,38,38,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Container className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-16 md:py-24">
       
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl/tight md:text-6xl/tight font-black text-slate-800"
          >
            Transform Your Fitness Journey.{" "}
            <span className="text-red-600">
              Achieve Excellence.
            </span>{" "}
            Build Strength.
          </motion.h1>

          <p className="mt-4 max-w-xl text-slate-600 md:text-lg">
            Professional gym management system with advanced tracking, personalized training programs, and expert coaching support.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/membership"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              style={{ background: BRAND.red }}
            >
              Subscribe <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-xl border-2 border-red-600 text-red-600 px-6 py-3 font-semibold hover:bg-red-600 hover:text-white transition-all duration-300"
            >
              Explore Features
            </a>
          </div>

          {/* Email capture */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-11 flex-1 rounded-lg bg-transparent px-3 outline-none placeholder:text-slate-400 text-slate-800"
            />
            <button className="h-11 shrink-0 rounded-lg px-4 font-semibold text-white shadow-sm hover:shadow-md transition-all duration-300" style={{ background: BRAND.red }}>
              Subscribe
            </button>
          </form>

          <div className="mt-6 grid grid-cols-3 gap-6 max-w-lg text-sm text-slate-600">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-red-600" /> No contracts</div>
            <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-red-600" /> 24/7 access</div>
            <div className="flex items-center gap-2"><Star className="h-5 w-5 text-red-600" /> 1k+ 5-star reviews</div>
          </div>
        </div>

        {/* Professional gym image */}
        <div className="relative">
          <Tilt3D>
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1170&auto=format&fit=crop"
                alt="Professional Gym"
                className="w-full h-[420px] object-cover"
              />
              <motion.div
                className="absolute -bottom-6 -left-6 rounded-xl border border-slate-200 bg-white backdrop-blur p-4 flex items-center gap-3 shadow-lg"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="h-10 w-10 rounded-lg grid place-items-center text-white" style={{ background: BRAND.red }}>
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Smart Training</p>
                  <p className="text-xs text-slate-600">AI-powered workout plans</p>
                </div>
              </motion.div>
            </div>
          </Tilt3D>

          {/* floating stats card */}
          <motion.div
            className="absolute -top-6 -right-4 rounded-xl border border-slate-200 bg-white backdrop-blur p-4 shadow-lg"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <div className="text-xs text-slate-600">Active Members</div>
            <div className={`mt-1 text-lg font-black text-red-600 ${loading ? 'animate-pulse' : ''}`}>
              {memberCount}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

/** Decorative glow rings */
function GlowRings() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10">
      <div
        className="absolute -top-10 -left-14 h-56 w-56 rounded-full blur-3xl opacity-20"
        style={{ background: `radial-gradient(closest-side, ${BRAND.red}, transparent)` }}
      />
      <div
        className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full blur-3xl opacity-15"
        style={{ background: `radial-gradient(closest-side, ${BRAND.lightRed}, transparent)` }}
      />
    </div>
  );
}

/** ===== Attribute Pills (new) ===== */
function AttributePills() {
  const attrs = [
    { icon: <Cpu className="h-4 w-4" />, text: "AI Program Builder" },
    { icon: <Activity className="h-4 w-4" />, text: "Heart Rate Tracking" },
    { icon: <QrCode className="h-4 w-4" />, text: "RFID Entry System" },
    { icon: <Smartphone className="h-4 w-4" />, text: "Mobile App Booking" },
    { icon: <Headphones className="h-4 w-4" />, text: "24/7 Coach Support" },
    { icon: <ShieldCheck className="h-4 w-4" />, text: "Safety Monitoring" },
  ];
  return (
    <section className="py-8 border-y border-slate-200 bg-white">
      <Container className="flex flex-wrap items-center justify-center gap-3">
        {attrs.map((a, i) => (
          <span key={i} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-sm hover:shadow-md hover:bg-white transition-all duration-300">
            <span className="text-red-600">{a.icon}</span> {a.text}
          </span>
        ))}
      </Container>
    </section>
  );
}


function BentoFeatures() {
  const tiles = [
    {
      title: "Smart Coaching",
      desc: "Adaptive plans tuned to your recovery and performance.",
      icon: <HeartPulse className="h-6 w-6" />,
  img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1920&auto=format&fit=crop",
      span: "col-span-2",
    },
    {
      title: "Metabolic Tracking",
      desc: "Calories, HR zones, and readiness—live.",
      icon: <Flame className="h-6 w-6" />,
      img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1920&auto=format&fit=crop",
    },
    {
      title: "Elite Equipment",
      desc: "Calibrated plates, platforms, and competition bars.",
      icon: <Dumbbell className="h-6 w-6" />,
      img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1920&auto=format&fit=crop",
    },
    {
      title: "Community & Events",
      desc: "Comps, workshops, and member challenges.",
      icon: <Trophy className="h-6 w-6" />,
  img: "https://images.unsplash.com/photo-1464983953574-0892a716854b?q=80&w=1920&auto=format&fit=crop",
      span: "col-span-2",
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-slate-50">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800">Professional Gym Management</h2>
          <p className="mt-3 text-slate-600">Advanced technology, expert coaching, and comprehensive tracking for optimal results.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          {tiles.map((t, i) => (
            <Tilt3D key={i}>
              <article className={`relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 ${t.span || ""}`}>
                <img src={t.img} alt={t.title} className="absolute inset-0 h-full w-full object-cover opacity-15" />
                <div className="relative h-full w-full p-6 flex flex-col justify-end">
                  <div className="h-12 w-12 rounded-xl grid place-items-center text-white shadow-lg" style={{ background: BRAND.red }}>
                    {t.icon}
                  </div>
                  <h3 className="mt-4 font-bold text-lg text-slate-800">{t.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{t.desc}</p>
                </div>
              </article>
            </Tilt3D>
          ))}
        </div>
      </Container>
    </section>
  );
}


function VideoTeaser() {
  return (
    <section id="video" className="py-12 bg-white">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
          <img
            src="https://images.unsplash.com/photo-1464983953574-0892a716854b?q=80&w=1920&auto=format&fit=crop"
            alt="Gym ambience"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="relative p-8 md:p-14">
            <div className="max-w-xl">
                <h3 className="text-2xl md:text-3xl font-black text-slate-800">Tour the club in 60 seconds</h3>
                <p className="mt-2 text-slate-600">See how our tech and coaching come together.</p>
              <Link
                to="/videos"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white hover:-translate-y-0.5 transition"
                style={{ background: BRAND.red }}
              >
                <Play className="h-4 w-4" /> Watch video
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** ===== Programs (minimal design) ===== */
function Programs() {
  const items = [
    {
      title: "Strength & Conditioning",
  img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1920&auto=format&fit=crop",
      desc: "Compound lifts + accessories for raw power.",
    },
    {
      title: "HIIT & MetCon",
  img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1920&auto=format&fit=crop",
      desc: "Intervals that burn fat and build capacity.",
    },
    {
      title: "Mobility & Recovery",
  img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1920&auto=format&fit=crop",
      desc: "Move better, reduce pain, and bulletproof joints.",
    },
  ];
  return (
    <section id="classes" className="py-16 md:py-24 bg-white">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Choose your path</h2>
          <p className="mt-3 text-slate-600">Pick one focus or mix and match. New blocks monthly.</p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((c, i) => (
            <article key={i} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={c.img} 
                    alt={c.title} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                </div>
                <div className="p-6 bg-slate-50">
                  <h3 className="font-semibold text-lg text-slate-800 mb-2">{c.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{c.desc}</p>
                  <div className="flex items-center text-sm font-medium text-red-600 group-hover:text-red-700 transition-colors">
                    View schedule 
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** ===== Stats ===== */
function Stats() {
  const [stats, setStats] = useState([
    { label: "Active Members", value: "Loading..." },
    { label: "Certified Trainers", value: "Loading..." },
    { label: "Member Reviews", value: "Loading..." },
    { label: "Average Rating", value: "Loading..." },
  ]);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    (import.meta?.env && import.meta.env.VITE_BACKEND_URL) ||
    (window.location.port === "5173" ? "http://localhost:3000" : window.location.origin);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/stats/public`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (data.success) {
        setStats([
          { label: "Active Members", value: data.data.activeMembers.toLocaleString() },
          { label: "Certified Trainers", value: data.data.totalTrainers },
          { label: "Member Reviews", value: data.data.totalReviews.toLocaleString() },
          { label: "Average Rating", value: `${data.data.averageRating}/5.0` },
        ]);
      } else {
        // Fallback stats
        setStats([
          { label: "Active Members", value: "1,247" },
          { label: "Certified Trainers", value: "15" },
          { label: "Member Reviews", value: "892" },
          { label: "Average Rating", value: "4.8/5.0" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback stats
      setStats([
        { label: "Active Members", value: "1,247" },
        { label: "Certified Trainers", value: "15" },
        { label: "Member Reviews", value: "892" },
        { label: "Average Rating", value: "4.8/5.0" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 bg-white">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-2xl border border-slate-200 bg-white shadow-lg p-6 md:p-10">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className={`text-2xl md:text-3xl font-black text-slate-800 ${loading ? 'animate-pulse' : ''}`}>
                {s.value}
              </div>
              <div className="mt-1 text-xs md:text-sm text-slate-600">{s.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** ===== Coaches ===== */
function Coaches() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    (import.meta?.env && import.meta.env.VITE_BACKEND_URL) ||
    (window.location.port === "5173" ? "http://localhost:3000" : window.location.origin);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/trainer/public`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (data.success) {
        setTrainers(data.data);
      } else {
        // Fallback to default trainers if API fails
        setTrainers([
          { 
            name: "Professional Trainer", 
            specialization: "General Fitness", 
            profilePicture: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1200&auto=format&fit=crop",
            experienceYears: 5,
            rating: 4.8
          },
          { 
            name: "Fitness Expert", 
            specialization: "Weight Loss", 
            profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop",
            experienceYears: 7,
            rating: 4.9
          },
          { 
            name: "Strength Coach", 
            specialization: "Muscle Gain", 
            profilePicture: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=1200&auto=format&fit=crop",
            experienceYears: 6,
            rating: 4.7
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
      // Fallback trainers
      setTrainers([
        { 
          name: "Professional Trainer", 
          specialization: "General Fitness", 
          profilePicture: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1200&auto=format&fit=crop",
          experienceYears: 5,
          rating: 4.8
        },
        { 
          name: "Fitness Expert", 
          specialization: "Weight Loss", 
          profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop",
          experienceYears: 7,
          rating: 4.9
        },
        { 
          name: "Strength Coach", 
          specialization: "Muscle Gain", 
          profilePicture: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=1200&auto=format&fit=crop",
          experienceYears: 6,
          rating: 4.7
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-sm ${
          index < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <section id="trainers" className="py-16 md:py-24 bg-white">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800">Meet your coaches</h2>
            <p className="mt-3 text-slate-600">Certified professionals. Human support.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
                <div className="h-72 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section id="trainers" className="py-16 md:py-24 bg-white">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800">Meet your coaches</h2>
          <p className="mt-3 text-slate-600">Certified professionals. Human support.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainers.map((trainer, i) => (
            <Tilt3D key={i} max={10}>
              <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <img 
                  src={trainer.profilePicture || "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1200&auto=format&fit=crop"} 
                  alt={trainer.name} 
                  className="h-72 w-full object-cover" 
                />
                <figcaption className="p-6">
                  <div className="font-bold text-slate-800 text-lg">{trainer.name}</div>
                  <div className="text-sm text-slate-600 mb-2">{trainer.specialization}</div>
                  
                  {/* Experience and Rating */}
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                    <span>{trainer.experienceYears || 0} years experience</span>
                    <div className="flex items-center gap-1">
                      {renderStars(trainer.rating || 0)}
                      <span className="ml-1">({trainer.rating || 0})</span>
                    </div>
                  </div>

                  {/* Certifications */}
                  {trainer.certifications && trainer.certifications.length > 0 && (
                    <div className="text-xs text-slate-500">
                      <span className="font-medium">Certifications:</span> {trainer.certifications.slice(0, 2).join(", ")}
                      {trainer.certifications.length > 2 && " +" + (trainer.certifications.length - 2) + " more"}
                    </div>
                  )}

                  {/* Bio preview */}
                  {trainer.bio && (
                    <div className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {trainer.bio.length > 100 ? trainer.bio.substring(0, 100) + "..." : trainer.bio}
                    </div>
                  )}
                </figcaption>
              </figure>
            </Tilt3D>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** ===== Pricing (glass + red highlight) ===== */
function Pricing() {
  const tiers = [
    { name: "Starter", price: 29, desc: "Gym access + open floor", perks: ["24/7 key access", "Locker + showers", "App tracking"] },
    {
      name: "Performance",
      price: 59,
      desc: "Everything in Starter + classes",
      perks: ["Unlimited classes", "Coached sessions", "Monthly check-ins"],
      featured: true,
    },
    { name: "Elite", price: 99, desc: "1:1 coaching + programming", perks: ["Weekly 1:1", "Custom program", "Priority booking"] },
  ];

  return (
    <section id="pricing" className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-black">Memberships for every goal</h2>
          <p className="mt-3 text-neutral-300">Start with a free week. Cancel anytime.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t, i) => (
            <Tilt3D key={t.name} max={8}>
              <div
                className={`rounded-3xl p-6 md:p-8 border bg-neutral-900/60 ${
                  t.featured ? "border-white/30 shadow-[0_30px_80px_-20px_rgba(223,32,78,.35)]" : "border-white/10"
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <h3 className="text-xl font-black">{t.name}</h3>
                  {t.featured && (
                    <span className="rounded-full px-2 py-0.5 text-xs border" style={{ borderColor: BRAND.red, color: BRAND.red }}>
                      Most popular
                    </span>
                  )}
                </div>
                <div className="mt-3 text-4xl font-black">
                  ${t.price}
                  <span className="text-sm font-semibold text-neutral-400">/mo</span>
                </div>
                <p className="mt-2 text-sm text-neutral-300">{t.desc}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <Check className="h-4 w-4" style={{ color: BRAND.red }} /> {p}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold transition ${
                    t.featured ? "text-white hover:-translate-y-0.5" : "hover:bg-white/5"
                  }`}
                  style={{ background: t.featured ? BRAND.red : "transparent", border: t.featured ? "none" : "1px solid rgba(255,255,255,.15)" }}
                >
                  Choose {t.name}
                </a>
              </div>
            </Tilt3D>
          ))}
        </div>
      </Container>
    </section>
  );
}


/** ===== FAQ (minimal design) ===== */
function Faq() {
  const faqs = [
    { q: "Can I pause or cancel anytime?", a: "Yes — manage your plan in the app. No lock-in contracts." },
    { q: "Do you have beginner programs?", a: "Absolutely. We onboard with movement screening and a 2-week ramp." },
    { q: "Is coaching included?", a: "Performance & Elite include coached classes. Elite adds weekly 1:1." },
  ];
  return (
    <section className="py-16 bg-white">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-slate-800">Questions, answered</h2>
          <div className="mt-12 space-y-6">
            {faqs.map((f, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 border-b border-slate-200 hover:border-slate-300 transition-colors">
                  <span className="font-medium text-slate-800 text-lg">{f.q}</span>
                  <span className="ml-4 h-8 w-8 flex items-center justify-center rounded-full border border-slate-300 text-slate-600 group-hover:border-red-500 group-hover:text-red-500 transition-colors">
                    <span className="text-lg font-light">+</span>
                  </span>
                </summary>
                <div className="py-4">
                  <p className="text-slate-600 leading-relaxed">{f.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}


function FinalCta() {
  return (
    <section className="relative py-16 md:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 p-8 md:p-14">
          <img
            src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1920&auto=format&fit=crop"
            alt="Running silhouettes"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="relative max-w-xl">
            <h3 className="text-2xl md:text-3xl font-black text-cyan-400">Ready to transform?</h3>
            <p className="mt-2 text-white">Book a free consult and get a personalized plan.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold text-white hover:-translate-y-0.5 transition"
                style={{ background: BRAND.red }}
              >
                Start free week
              </a>
              <a href="#" className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-5 py-3 font-semibold text-gray-300 hover:bg-white/10 transition-colors">
                Talk to a coach
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
