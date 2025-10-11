import { useState } from "react";
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

/** ===== Brand ===== */
const BRAND = {
  red: "#DF204E",
  black: "#0A0A0A",
  white: "#FFFFFF",
};

export default function GymLandingPage() {
  const [email, setEmail] = useState("");
  return (
    <div className="min-h-screen bg-[rgb(10,10,10)] text-white">
      <Hero email={email} setEmail={setEmail} />
      <AttributePills />
      <BentoFeatures />
      <VideoTeaser />
      <Programs />
      <Stats />
      <Coaches />
      <Pricing />
      <Testimonials />
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

/** ===== HERO (new look) ===== */
function Hero({ email, setEmail }) {
  return (
    <section className="relative overflow-hidden">
      {/* background grid + radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(1000px circle at 10% -10%, rgba(223,32,78,.22), transparent 40%), radial-gradient(900px circle at 110% 60%, rgba(255,255,255,.08), transparent 40%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(1000px circle at 50% 40%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(1000px circle at 50% 40%, black, transparent 75%)",
        }}
      />

      <Container className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-16 md:py-24">
        {/* Content */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl/tight md:text-6xl/tight font-black"
          >
            Build power.{" "}
            <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.red}, #ff7a93, ${BRAND.red})` }}>
              Recover smarter.
            </span>{" "}
            Perform longer.
          </motion.h1>

          <p className="mt-4 max-w-xl text-neutral-300 md:text-lg">
            A precision training club with AI-assisted programming, 3D form feedback, and coaches who care.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold shadow-[0_12px_30px_-10px_rgba(223,32,78,0.8)] hover:-translate-y-0.5 transition"
              style={{ background: BRAND.red }}
            >
              Start free week <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10"
            >
              Explore features
            </a>
          </div>

          {/* Email capture */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/12 bg-white/5 p-2 backdrop-blur"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-11 flex-1 rounded-xl bg-transparent px-3 outline-none placeholder:text-neutral-400"
            />
            <button className="h-11 shrink-0 rounded-xl px-4 font-semibold text-white" style={{ background: BRAND.red }}>
              Get updates
            </button>
          </form>

          <div className="mt-6 grid grid-cols-3 gap-6 max-w-lg text-sm text-neutral-300">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-white" /> No contracts</div>
            <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-white" /> 24/7 access</div>
            <div className="flex items-center gap-2"><Star className="h-5 w-5 text-white" /> 1k+ 5-star reviews</div>
          </div>
        </div>

        {/* 3D mockup stack */}
        <div className="relative">
          <GlowRings />
          <Tilt3D>
            <div className="relative rounded-[1.75rem] overflow-hidden border border-white/10 bg-neutral-900/60 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1554344728-77cf90d9ed26?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Gym hero"
                className="w-full h-[420px] object-cover"
              />
              <motion.div
                className="absolute -bottom-6 -left-6 rounded-2xl border border-white/10 bg-neutral-900/85 backdrop-blur p-4 flex items-center gap-3 shadow-xl"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="h-10 w-10 rounded-xl grid place-items-center text-white" style={{ background: BRAND.red }}>
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Velocity Blocks</p>
                  <p className="text-xs text-neutral-300">4-week progressive overload</p>
                </div>
              </motion.div>
            </div>
          </Tilt3D>

          {/* floating mini card */}
          <motion.div
            className="absolute -top-6 -right-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur p-4"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <div className="text-xs text-neutral-300">HR Zone</div>
            <div className="mt-1 text-lg font-black" style={{ color: BRAND.red }}>
              86% (RZ4)
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
        className="absolute -top-10 -left-14 h-56 w-56 rounded-full blur-3xl opacity-40"
        style={{ background: `radial-gradient(closest-side, ${BRAND.red}, transparent)` }}
      />
      <div
        className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(closest-side, #ffffff, transparent)" }}
      />
    </div>
  );
}

/** ===== Attribute Pills (new) ===== */
function AttributePills() {
  const attrs = [
    { icon: <Cpu className="h-4 w-4" />, text: "AI Program Builder" },
    { icon: <Activity className="h-4 w-4" />, text: "Red-Zone HR Tracking" },
    { icon: <QrCode className="h-4 w-4" />, text: "RFID Entry" },
    { icon: <Smartphone className="h-4 w-4" />, text: "In-App Booking" },
    { icon: <Headphones className="h-4 w-4" />, text: "Coach Chat 24/7" },
    { icon: <ShieldCheck className="h-4 w-4" />, text: "Injury-Safe Progression" },
  ];
  return (
    <section className="py-6 border-y border-white/10 bg-black/40">
      <Container className="flex flex-wrap items-center justify-center gap-3">
        {attrs.map((a, i) => (
          <span key={i} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-neutral-200">
            <span className="text-white">{a.icon}</span> {a.text}
          </span>
        ))}
      </Container>
    </section>
  );
}

/** ===== Bento Feature Grid (new look) ===== */
function BentoFeatures() {
  const tiles = [
    {
      title: "Smart Coaching",
      desc: "Adaptive plans tuned to your recovery and performance.",
      icon: <HeartPulse className="h-6 w-6" />,
      img: "https://images.unsplash.com/photo-1554295405-9ec9bc9e3a5e?q=80&w=1920&auto=format&fit=crop",
      span: "col-span-2",
    },
    {
      title: "Metabolic Tracking",
      desc: "Calories, HR zones, and readiness—live.",
      icon: <Flame className="h-6 w-6" />,
      img: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1920&auto=format&fit=crop",
    },
    {
      title: "Elite Equipment",
      desc: "Calibrated plates, platforms, and competition bars.",
      icon: <Dumbbell className="h-6 w-6" />,
      img: "https://images.unsplash.com/photo-1558611848-4061b92b0e50?q=80&w=1920&auto=format&fit=crop",
    },
    {
      title: "Community & Events",
      desc: "Comps, workshops, and member challenges.",
      icon: <Trophy className="h-6 w-6" />,
      img: "https://images.unsplash.com/photo-1546484959-f6d8a1dfcf19?q=80&w=1920&auto=format&fit=crop",
      span: "col-span-2",
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-black">Engineered to perform</h2>
          <p className="mt-3 text-neutral-300">Science, software, and sweat—designed for results.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[260px]">
          {tiles.map((t, i) => (
            <Tilt3D key={i}>
              <article className={`relative rounded-3xl overflow-hidden border border-white/10 bg-neutral-900/60 ${t.span || ""}`}>
                <img src={t.img} alt={t.title} className="absolute inset-0 h-full w-full object-cover opacity-40" />
                <div className="relative h-full w-full p-6 flex flex-col justify-end">
                  <div className="h-10 w-10 rounded-xl grid place-items-center text-white" style={{ background: BRAND.red }}>
                    {t.icon}
                  </div>
                  <h3 className="mt-3 font-bold text-lg">{t.title}</h3>
                  <p className="mt-1 text-sm text-neutral-300">{t.desc}</p>
                </div>
              </article>
            </Tilt3D>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** ===== Video ===== */
function VideoTeaser() {
  return (
    <section id="video" className="py-12">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900">
          <img
            src="https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=1920&auto=format&fit=crop"
            alt="Gym ambience"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="relative p-8 md:p-14">
            <div className="max-w-xl">
              <h3 className="text-2xl md:text-3xl font-black">Tour the club in 60 seconds</h3>
              <p className="mt-2 text-neutral-200">See how our tech and coaching come together.</p>
              <Link
                to="/videos"
                target="_blank"
                rel="noreferrer"
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

/** ===== Programs (new cards) ===== */
function Programs() {
  const items = [
    {
      title: "Strength & Conditioning",
      img: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1920&auto=format&fit=crop",
      desc: "Compound lifts + accessories for raw power.",
    },
    {
      title: "HIIT & MetCon",
      img: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1920&auto=format&fit=crop",
      desc: "Intervals that burn fat and build capacity.",
    },
    {
      title: "Mobility & Recovery",
      img: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=1920&auto=format&fit=crop",
      desc: "Move better, reduce pain, and bulletproof joints.",
    },
  ];
  return (
    <section id="classes" className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-black">Choose your path</h2>
          <p className="mt-3 text-neutral-300">Pick one focus or mix and match. New blocks monthly.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((c, i) => (
            <Tilt3D key={i}>
              <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/60">
                <img src={c.img} alt={c.title} className="h-56 w-full object-cover" />
                <div className="p-5">
                  <h3 className="font-bold text-lg">{c.title}</h3>
                  <p className="mt-1 text-sm text-neutral-300">{c.desc}</p>
                  <a href="#" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: BRAND.red }}>
                    View schedule <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            </Tilt3D>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** ===== Stats ===== */
function Stats() {
  const stats = [
    { label: "Avg. time to goal", value: "8.5 weeks" },
    { label: "Members", value: "12,000+" },
    { label: "Locations", value: "6 worldwide" },
    { label: "PR Leaderboard", value: "420 / 520 / 315" },
  ];
  return (
    <section className="py-12">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-3xl border border-white/10 bg-neutral-900/60 p-6 md:p-10">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-black">{s.value}</div>
              <div className="mt-1 text-xs md:text-sm text-neutral-300">{s.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** ===== Coaches ===== */
function Coaches() {
  const people = [
    { name: "Ava Morgan", role: "Strength Coach", img: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1200&auto=format&fit=crop" },
    { name: "Leo Carter", role: "Performance Specialist", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop" },
    { name: "Maya Khan", role: "Mobility Expert", img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=1200&auto=format&fit=crop" },
  ];
  return (
    <section id="trainers" className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-black">Meet your coaches</h2>
          <p className="mt-3 text-neutral-300">Certified pros. Human support.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {people.map((p, i) => (
            <Tilt3D key={i} max={10}>
              <figure className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/60">
                <img src={p.img} alt={p.name} className="h-72 w-full object-cover" />
                <figcaption className="p-5">
                  <div className="font-bold">{p.name}</div>
                  <div className="text-sm text-neutral-300">{p.role}</div>
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

/** ===== Testimonials ===== */
function Testimonials() {
  const quotes = [
    { body: "Added 60lbs to my deadlift in 10 weeks. The programming is gold.", name: "Sam R." },
    { body: "Coaches actually care. I feel stronger and pain-free for the first time.", name: "Priya D." },
    { body: "The vibe is immaculate. Community keeps me consistent.", name: "Luca M." },
  ];
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-black">Members love us</h2>
          <p className="mt-3 text-neutral-300">Real stories from our community.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <Tilt3D key={i} max={6}>
              <blockquote className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6">
                <p className="text-neutral-200">“{q.body}”</p>
                <footer className="mt-4 text-sm font-semibold">{q.name}</footer>
              </blockquote>
            </Tilt3D>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** ===== FAQ (new) ===== */
function Faq() {
  const faqs = [
    { q: "Can I pause or cancel anytime?", a: "Yes — manage your plan in the app. No lock-in contracts." },
    { q: "Do you have beginner programs?", a: "Absolutely. We onboard with movement screening and a 2-week ramp." },
    { q: "Is coaching included?", a: "Performance & Elite include coached classes. Elite adds weekly 1:1." },
  ];
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-black text-center">Questions, answered</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((f, i) => (
              <details key={i} className="group rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between">
                  <span className="font-semibold">{f.q}</span>
                  <span className="ml-4 h-6 w-6 grid place-items-center rounded-md border border-white/15 text-sm text-neutral-300">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-neutral-300">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** ===== Final CTA ===== */
function FinalCta() {
  return (
    <section className="relative py-16 md:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 p-8 md:p-14">
          <img
            src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1920&auto=format&fit=crop"
            alt="Weights rack"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(1000px circle at 10% 10%, rgba(223,32,78,.18), transparent 40%)" }}
          />
          <div className="relative max-w-xl">
            <h3 className="text-2xl md:text-3xl font-black">Ready to transform?</h3>
            <p className="mt-2 text-neutral-300">Book a free consult and get a personalized plan.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold text-white hover:-translate-y-0.5 transition"
                style={{ background: BRAND.red }}
              >
                Start free week
              </a>
              <a href="#" className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-5 py-3 font-semibold hover:bg-white/5">
                Talk to a coach
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
