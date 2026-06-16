import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, useAnimationFrame } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

function useSearchParam(key: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

function HologramOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);

  useAnimationFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    angleRef.current += 0.008;
    const t = angleRef.current;

    const cx = W / 2;
    const cy = H / 2;
    const r = W * 0.38;

    // Outer glow ring
    for (let i = 3; i >= 0; i--) {
      const grad = ctx.createRadialGradient(cx, cy, r - 4, cx, cy, r + 6 + i * 10);
      grad.addColorStop(0, `rgba(0,255,240,${0.18 - i * 0.04})`);
      grad.addColorStop(1, "rgba(0,255,240,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r + 6 + i * 10, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Rotating arcs
    const arcCount = 4;
    for (let a = 0; a < arcCount; a++) {
      const offset = (a / arcCount) * Math.PI * 2;
      const start = t + offset;
      const end = start + Math.PI * 1.1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, end);
      ctx.strokeStyle = `rgba(0,255,240,${0.5 + 0.4 * Math.sin(t * 2 + a)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Inner orb fill
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.85);
    innerGrad.addColorStop(0, "rgba(0,255,240,0.07)");
    innerGrad.addColorStop(0.6, "rgba(80,0,200,0.04)");
    innerGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad;
    ctx.fill();

    // Scan lines inside orb
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.clip();
    const scanY = ((t * 60) % (r * 2)) - r;
    for (let i = -5; i <= 5; i++) {
      const y = cy + scanY + i * 22;
      ctx.beginPath();
      ctx.moveTo(cx - r, y);
      ctx.lineTo(cx + r, y);
      ctx.strokeStyle = `rgba(0,255,240,${0.04 + 0.02 * Math.abs(Math.sin(i))})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Bright scan line
    const brightY = cy + scanY;
    const scanGrad = ctx.createLinearGradient(cx - r, brightY, cx + r, brightY);
    scanGrad.addColorStop(0, "rgba(0,255,240,0)");
    scanGrad.addColorStop(0.5, "rgba(0,255,240,0.3)");
    scanGrad.addColorStop(1, "rgba(0,255,240,0)");
    ctx.beginPath();
    ctx.moveTo(cx - r, brightY);
    ctx.lineTo(cx + r, brightY);
    ctx.strokeStyle = scanGrad;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Orbiting dots
    const dotCount = 6;
    for (let d = 0; d < dotCount; d++) {
      const dotAngle = t * 1.4 + (d / dotCount) * Math.PI * 2;
      const dotR = r + 18;
      const dx = cx + Math.cos(dotAngle) * dotR;
      const dy = cy + Math.sin(dotAngle) * dotR * 0.35;
      const alpha = 0.3 + 0.7 * ((Math.sin(dotAngle) + 1) / 2);
      ctx.beginPath();
      ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,240,${alpha})`;
      ctx.fill();
    }

    // Vertical axis line
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 20);
    ctx.lineTo(cx, cy + r + 20);
    ctx.strokeStyle = "rgba(0,255,240,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Horizontal axis line
    ctx.beginPath();
    ctx.moveTo(cx - r - 20, cy);
    ctx.lineTo(cx + r + 20, cy);
    ctx.strokeStyle = "rgba(0,255,240,0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center dot
    const dotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
    dotGrad.addColorStop(0, "rgba(0,255,240,1)");
    dotGrad.addColorStop(1, "rgba(0,255,240,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = dotGrad;
    ctx.fill();
  });

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className="pointer-events-none"
    />
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0
              ? "rgba(0,255,240,0.8)"
              : i % 3 === 1
              ? "rgba(180,0,255,0.6)"
              : "rgba(255,50,80,0.5)",
          }}
          animate={{
            y: [0, -60 - Math.random() * 80, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const authError = useSearchParam("error");

  useEffect(() => {
    if (!loading && user) {
      setLocation("/worlds");
    }
  }, [user, loading, setLocation]);

  function handleLogin() {
    window.location.href = "/api/login";
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-black">

      {/* Deep space background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(0,60,80,0.5)_0%,rgba(20,0,40,0.6)_50%,#000_100%)]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,240,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,255,240,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Horizontal scan line sweeping down */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <FloatingParticles />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-10">

        {/* Auth error banner */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 w-max max-w-sm px-4 py-2 border border-red-500/50 bg-red-900/30 font-mono text-xs text-red-400 tracking-wider text-center"
          >
            ⚠ LỖI XÁC THỰC: {decodeURIComponent(authError)}
          </motion.div>
        )}

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.p
            className="font-mono text-xs tracking-[0.5em] text-cyan-500/60 uppercase mb-3"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            ◈ NEURAL_GATEWAY v4.0.1 ◈
          </motion.p>
          <h1
            className="font-orbitron text-5xl md:text-6xl font-black tracking-wider"
            style={{
              background: "linear-gradient(135deg, #fff 0%, #00fff0 40%, #b000ff 80%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 20px rgba(0,255,240,0.4))",
            }}
          >
            AI WORLD SYSTEM
          </h1>
          <motion.div
            className="h-px mt-3 mx-auto"
            style={{
              background: "linear-gradient(90deg, transparent, #00fff0, #b000ff, transparent)",
            }}
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />
        </motion.div>

        {/* Hologram orb + button */}
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          {/* Orb */}
          <div className="relative">
            <HologramOrb />

            {/* Glow beneath orb */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-6 rounded-full"
              style={{
                background: "radial-gradient(ellipse, rgba(0,255,240,0.25) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
          </div>

          {/* Hologram button */}
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <motion.div
                className="w-10 h-10 rounded-full border-2 border-cyan-400/40 border-t-cyan-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span className="font-mono text-xs text-cyan-500/60 tracking-widest">ĐANG KẾT NỐI...</span>
            </div>
          ) : (
            <motion.button
              onClick={handleLogin}
              className="relative group cursor-pointer select-none"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >
              {/* Button outer glow */}
              <motion.div
                className="absolute -inset-2 rounded-sm"
                style={{
                  background: "linear-gradient(135deg, rgba(0,255,240,0.3), rgba(180,0,255,0.3))",
                  filter: "blur(12px)",
                }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Button body */}
              <div
                className="relative px-12 py-4 border"
                style={{
                  background: "linear-gradient(135deg, rgba(0,255,240,0.08) 0%, rgba(100,0,200,0.12) 100%)",
                  borderColor: "rgba(0,255,240,0.5)",
                  boxShadow: "0 0 20px rgba(0,255,240,0.2), inset 0 0 20px rgba(0,255,240,0.05)",
                }}
              >
                {/* Top-left corner */}
                <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                {/* Top-right corner */}
                <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                {/* Bottom-left corner */}
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                {/* Bottom-right corner */}
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

                {/* Shimmer sweep */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: "linear-gradient(105deg, transparent 30%, rgba(0,255,240,0.15) 50%, transparent 70%)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Google icon + text */}
                <div className="relative flex items-center gap-4">
                  {/* Google G */}
                  <div
                    className="w-7 h-7 flex items-center justify-center rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>

                  <span
                    className="font-orbitron text-sm tracking-[0.2em] font-bold"
                    style={{ color: "#00fff0", textShadow: "0 0 10px rgba(0,255,240,0.8)" }}
                  >
                    ĐĂNG NHẬP GMAIL
                  </span>

                  {/* Arrow */}
                  <motion.span
                    className="text-cyan-400 text-lg leading-none"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    ›
                  </motion.span>
                </div>
              </div>

              {/* Scanline over button */}
              <motion.div
                className="absolute left-0 right-0 h-px pointer-events-none opacity-40"
                style={{ background: "rgba(0,255,240,0.6)" }}
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.button>
          )}

          {/* Sub label */}
          <motion.p
            className="font-mono text-[10px] text-cyan-500/40 tracking-[0.3em] uppercase text-center"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Xác thực thần kinh để vào vũ trụ ảo
          </motion.p>
        </motion.div>

        {/* Bottom decorative stats */}
        <motion.div
          className="flex gap-8 font-mono text-[10px] text-cyan-500/30 tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {["SYS_ONLINE", "DB_LINKED", "AI_READY"].map((label) => (
            <div key={label} className="flex items-center gap-1.5">
              <motion.span
                className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: Math.random() }}
              />
              {label}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom back link */}
      <motion.a
        href="/"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-cyan-500/30 hover:text-cyan-400 transition-colors tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        ← QUAY LẠI
      </motion.a>
    </div>
  );
}
