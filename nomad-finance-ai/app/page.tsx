"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LoginModal } from "@/components/auth/login-modal";
import { handleDemoLogin } from "@/components/auth/demo-login-button";

const gold = "#cd9e3c";
const bg = "#0a0a0a";
const text = "#f5f0e8";

const spring = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.7, ease: spring },
  }),
};

const cardReveal = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay, duration: 0.8, ease: spring },
  }),
};

const gridBg = `repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(205,158,60,0.025) 59px, rgba(205,158,60,0.025) 60px),
repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(205,158,60,0.025) 59px, rgba(205,158,60,0.025) 60px)`;

const shimmerGradient =
  "linear-gradient(90deg, #cd9e3c 0%, #f5d080 40%, #cd9e3c 80%, #f5d080 100%)";

const tickerItems = [
  { pair: "USD/EUR", rate: "0.9234", up: true },
  { pair: "USD/VND", rate: "25,420", up: true },
  { pair: "EUR/THB", rate: "39.12", up: false },
  { pair: "USD/JPY", rate: "149.8", up: true },
  { pair: "GBP/USD", rate: "1.2720", up: false },
];

const flags = ["🇺🇸", "🇩🇪", "🇻🇳", "🇧🇷"];

function Blob({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 340,
        height: 340,
        background: "radial-gradient(circle, rgba(205,158,60,0.08), transparent 70%)",
        filter: "blur(60px)",
        animation: "morphBlob 12s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function PulsingRing({ delay, size }: { delay: number; size: number }) {
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        border: "1px solid rgba(205,158,60,0.07)",
        borderRadius: "50%",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        animation: `pulseRing 5s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

function OrbitDot({
  radius,
  duration,
  dotSize,
  startAngle,
}: {
  radius: number;
  duration: number;
  dotSize: number;
  startAngle: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 0,
        height: 0,
        animation: `orbit ${duration}s linear infinite`,
        animationDelay: `${-(duration * startAngle) / 360}s`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: gold,
          boxShadow: `0 0 8px ${gold}`,
          transform: `translateX(${radius}px) translateY(-${dotSize / 2}px)`,
        }}
      />
    </div>
  );
}

function FloatingTriangle() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      style={{
        position: "absolute",
        top: "12%",
        left: "8%",
        opacity: 0.3,
        animation: "floatShape 6s ease-in-out infinite",
      }}
    >
      <path d="M14 4L24 24H4L14 4Z" stroke={gold} strokeWidth="1" />
    </svg>
  );
}

function FloatingSquare() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      style={{
        position: "absolute",
        bottom: "14%",
        right: "10%",
        opacity: 0.3,
        transform: "rotate(45deg)",
        animation: "floatShape 7s ease-in-out infinite reverse",
      }}
    >
      <rect x="1" y="1" width="20" height="20" stroke={gold} strokeWidth="1" />
    </svg>
  );
}

function TickerContent() {
  return (
    <div style={{ display: "flex", gap: 32, alignItems: "center", whiteSpace: "nowrap" }}>
      {tickerItems.map((t) => (
        <span key={t.pair} style={{ fontSize: 11, color: "rgba(245,240,232,0.2)" }}>
          {t.pair}{" "}
          <span style={{ letterSpacing: "0.02em" }}>{t.rate}</span>{" "}
          <span style={{ color: t.up ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.5)" }}>
            {t.up ? "↑" : "↓"}
          </span>
        </span>
      ))}
    </div>
  );
}

const barHeights = [14, 22, 18, 28, 20];
const barOpacities = [0.15, 0.25, 0.2, 0.35, 0.25];

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100svh",
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes morphBlob {
          0%, 100% { border-radius: 40% 60% 60% 40% / 60% 40% 60% 40%; transform: translate(0, 0); }
          33% { border-radius: 60% 40% 40% 60% / 40% 60% 40% 60%; transform: translate(10px, -10px); }
          66% { border-radius: 50% 50% 40% 60% / 60% 50% 50% 40%; transform: translate(-8px, 8px); }
        }
        @keyframes pulseRing {
          0%, 100% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.12; }
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes floatShape {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes floatCard1 { 0%, 100% { transform: translateY(0px) rotate(-4deg); } 50% { transform: translateY(-10px) rotate(-4deg); } }
        @keyframes floatCard2 { 0%, 100% { transform: translateY(0px) rotate(2deg); } 50% { transform: translateY(-14px) rotate(2deg); } }
        @keyframes floatCard3 { 0%, 100% { transform: translateY(0px) rotate(-2deg); } 50% { transform: translateY(-8px) rotate(-2deg); } }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ── Background layer (z-0) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage: gridBg,
          backgroundSize: "60px 60px",
        }}
      />
      <Blob style={{ top: "-8%", left: "-6%" }} />
      <Blob style={{ bottom: "-8%", right: "-6%", animationDelay: "-6s" }} />

      <PulsingRing delay={0} size={320} />
      <PulsingRing delay={1.5} size={440} />
      <PulsingRing delay={3} size={560} />

      <OrbitDot radius={200} duration={22} dotSize={5} startAngle={0} />
      <OrbitDot radius={260} duration={30} dotSize={4} startAngle={120} />
      <OrbitDot radius={230} duration={18} dotSize={6} startAngle={240} />

      <FloatingTriangle />
      <FloatingSquare />

      {/* ── Hero content (z-3) ── */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: 600,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        {/* Badge */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid rgba(205,158,60,0.3)",
            borderRadius: 100,
            padding: "6px 16px",
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: gold,
              animation: "blink 1.4s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(205,158,60,0.85)",
              fontWeight: 500,
            }}
          >
            Now with AI Advisor
          </span>
        </motion.div>

        {/* Headline line 1 */}
        <motion.h1
          custom={0.1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            fontSize: "clamp(34px, 5.5vw, 52px)",
            fontWeight: 700,
            color: text,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Your money.
        </motion.h1>

        {/* Headline line 2 — shimmer */}
        <motion.h1
          custom={0.18}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            fontSize: "clamp(34px, 5.5vw, 52px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: "2px 0 0",
            background: shimmerGradient,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "shimmer 4s linear infinite",
          }}
          aria-label="Every country."
        >
          Every country.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={0.28}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            fontSize: 16,
            color: "rgba(245,240,232,0.45)",
            lineHeight: 1.7,
            margin: "20px 0 0",
            maxWidth: 480,
          }}
        >
          Multi-currency tracking, AI-powered insights, built for the life you actually live.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          custom={0.38}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            display: "flex",
            gap: 12,
            marginTop: 32,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={handleDemoLogin}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: gold,
              color: bg,
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 100,
              padding: "14px 30px",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Try free demo
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "1px solid rgba(245,240,232,0.12)",
              color: "rgba(245,240,232,0.55)",
              fontWeight: 500,
              fontSize: 14,
              borderRadius: 100,
              padding: "14px 30px",
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(245,240,232,0.3)";
              e.currentTarget.style.color = "rgba(245,240,232,0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(245,240,232,0.12)";
              e.currentTarget.style.color = "rgba(245,240,232,0.55)";
            }}
          >
            Sign in
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          custom={0.48}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 28,
          }}
        >
          <div style={{ display: "flex" }}>
            {flags.map((flag, i) => (
              <span
                key={flag}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(20,20,20,0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  marginRight: i < flags.length - 1 ? -6 : 0,
                  border: `1px solid ${bg}`,
                  position: "relative",
                  zIndex: flags.length - i,
                }}
              >
                {flag}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "rgba(245,240,232,0.3)" }}>
            Trusted by nomads in 40+ countries
          </span>
        </motion.div>

        {/* ── Floating UI cards ── */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 50,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Card 1 — Balance */}
          <motion.div
            custom={0.55}
            variants={cardReveal}
            initial="hidden"
            animate="visible"
            style={{
              width: 160,
              background: "rgba(18,18,18,0.9)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              padding: "16px 14px",
              textAlign: "left",
              animation: "floatCard1 5s ease-in-out infinite",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: gold,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Balance
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: text }}>$24,830</div>
            <div style={{ fontSize: 11, color: "rgba(74,222,128,0.7)", marginTop: 4 }}>
              ↑ 8.2% this month
            </div>
            <div
              style={{
                display: "flex",
                gap: 3,
                alignItems: "flex-end",
                height: 32,
                marginTop: 10,
              }}
            >
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: h,
                    borderRadius: 3,
                    background: `rgba(205,158,60,${barOpacities[i]})`,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Card 2 — AI Insight */}
          <motion.div
            custom={0.65}
            variants={cardReveal}
            initial="hidden"
            animate="visible"
            style={{
              width: 168,
              background: "rgba(205,158,60,0.08)",
              border: "1px solid rgba(205,158,60,0.18)",
              borderRadius: 18,
              padding: "16px 14px",
              textAlign: "left",
              marginTop: -10,
              animation: "floatCard2 6s ease-in-out infinite",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: "rgba(205,158,60,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: gold,
                }}
              >
                ✦
              </span>
              <span style={{ fontSize: 11, color: gold, fontWeight: 600 }}>AI Insight</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(245,240,232,0.6)", lineHeight: 1.5 }}>
              You spend <span style={{ fontWeight: 700, color: text }}>34% less</span> in Vietnam
              vs Thailand 🇻🇳
            </div>
            <div style={{ fontSize: 10, color: "rgba(245,240,232,0.2)", marginTop: 8 }}>
              Updated 2 min ago
            </div>
          </motion.div>

          {/* Card 3 — Currencies */}
          <motion.div
            custom={0.75}
            variants={cardReveal}
            initial="hidden"
            animate="visible"
            style={{
              width: 152,
              background: "rgba(18,18,18,0.9)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              padding: "16px 14px",
              textAlign: "left",
              animation: "floatCard3 5.5s ease-in-out infinite",
            }}
          >
            {[
              { code: "USD", amount: "$12,400" },
              { code: "EUR", amount: "€6,200" },
              { code: "VND", amount: "₫142M" },
            ].map((c, i) => (
              <div
                key={c.code}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  padding: "5px 0",
                  borderBottom:
                    i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <span style={{ color: "rgba(245,240,232,0.4)", fontWeight: 500 }}>
                  {c.code}
                </span>
                <span style={{ color: text, fontWeight: 600 }}>{c.amount}</span>
              </div>
            ))}
            <div
              style={{
                marginTop: 10,
                fontSize: 10,
                color: gold,
                background: "rgba(205,158,60,0.1)",
                borderRadius: 100,
                padding: "3px 10px",
                display: "inline-block",
                fontWeight: 600,
              }}
            >
              +28 more
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Ticker bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 3,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          overflow: "hidden",
          padding: "10px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "max-content",
            animation: "ticker 18s linear infinite",
          }}
        >
          <TickerContent />
          <div style={{ width: 32 }} />
          <TickerContent />
        </div>
      </div>

      <LoginModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
