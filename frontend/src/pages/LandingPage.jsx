import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion, useScroll, useTransform, useMotionValueEvent, useInView,
} from 'framer-motion';
import { Building2, ArrowLeft, ChevronDown, Ruler, ShieldCheck, Wallet } from 'lucide-react';

const BUILD_STAGES = [
  'الحفر والأساسات',
  'هيكل الدور الأرضي',
  'جدران الدور الأرضي',
  'هيكل الدور الأول',
  'جدران الدور الأول والشرفة',
  'السقف والبارابيت',
  'التشطيب والحديقة',
  'تسليم المشروع',
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: 'easeOut' } }),
};

/* ===== The villa that builds itself as you scroll ===== */
const VillaBuild = ({ progress }) => {
  const found    = useTransform(progress, [0.02, 0.10], [0, 1]);
  const cols1    = useTransform(progress, [0.09, 0.17], [0, 1]);
  const slab1    = useTransform(progress, [0.16, 0.23], [0, 1]);
  const wall1    = useTransform(progress, [0.22, 0.31], [0, 1]);
  const cols2    = useTransform(progress, [0.30, 0.38], [0, 1]);
  const slab2    = useTransform(progress, [0.37, 0.44], [0, 1]);
  const wall2    = useTransform(progress, [0.43, 0.52], [0, 1]);
  const roof     = useTransform(progress, [0.51, 0.60], [0, 1]);
  const windows  = useTransform(progress, [0.60, 0.72], [0, 1]);
  const scaffold = useTransform(progress, [0.70, 0.86], [1, 0]);
  const finish   = useTransform(progress, [0.76, 0.92], [0, 1]);
  const craneO   = useTransform(progress, [0.86, 0.97], [1, 0]);
  const craneX   = useTransform(progress, [0.86, 1.0], [0, 110]);

  return (
    <svg viewBox="0 0 760 480" className="w-full h-full select-none" role="img" aria-label="فيلا تُبنى أثناء التمرير">
      <defs>
        <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eedbb8" />
          <stop offset="1" stopColor="#cfb28c" />
        </linearGradient>
        <linearGradient id="baseG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a3895f" />
          <stop offset="1" stopColor="#8a6f45" />
        </linearGradient>
        <linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3a52" />
          <stop offset="1" stopColor="#16202f" />
        </linearGradient>
        <linearGradient id="doorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d5428" />
          <stop offset="1" stopColor="#5d3c1c" />
        </linearGradient>
        <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f1930" />
          <stop offset="1" stopColor="#1d2f4d" />
        </linearGradient>
        <linearGradient id="litG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="lawnG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#143522" />
          <stop offset="1" stopColor="#0a2014" />
        </linearGradient>
        <linearGradient id="stoneG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9aa3ad" />
          <stop offset="1" stopColor="#6f7882" />
        </linearGradient>
        <linearGradient id="trunkG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a5731" />
          <stop offset="1" stopColor="#5c4022" />
        </linearGradient>
        <radialGradient id="glowWarm" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(252,211,77,0.30)" />
          <stop offset="1" stopColor="rgba(252,211,77,0)" />
        </radialGradient>
        <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <rect x="60" y="424" width="640" height="44" fill="#0b1a12" />

      <motion.g style={{ opacity: found }}>
        <rect x="172" y="416" width="416" height="14" fill="#05080f" opacity="0.9" />
        <rect x="180" y="410" width="400" height="14" fill="#2b3b55" />
        <rect x="180" y="410" width="400" height="3" fill="#3d506e" />
        <line x1="180" y1="424" x2="580" y2="424" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
      </motion.g>

      <motion.g style={{ opacity: cols1, scaleY: cols1, transformOrigin: '50% 100%' }}>
        <rect x="192" y="300" width="16" height="110" fill="#31415c" />
        <rect x="248" y="300" width="16" height="110" fill="#31415c" />
        <rect x="496" y="300" width="16" height="110" fill="#31415c" />
        <rect x="552" y="300" width="16" height="110" fill="#31415c" />
        <rect x="192" y="300" width="16" height="3" fill="#47597a" />
        <rect x="552" y="300" width="16" height="3" fill="#47597a" />
      </motion.g>

      <motion.g style={{ opacity: slab1, scaleX: slab1, transformOrigin: '50% 50%' }}>
        <rect x="174" y="300" width="412" height="12" fill="#33435f" />
        <rect x="174" y="300" width="412" height="3" fill="#47597a" />
      </motion.g>

      <motion.g style={{ opacity: wall1, scaleY: wall1, transformOrigin: '50% 100%' }}>
        <rect x="204" y="312" width="352" height="112" fill="url(#wallG)" />
        <rect x="204" y="398" width="352" height="26" fill="url(#baseG)" />
        <rect x="204" y="312" width="10" height="112" fill="#00000022" />
        <rect x="546" y="312" width="10" height="112" fill="#00000022" />
        <path d="M340 424 L340 380 Q340 352 370 352 Q400 352 400 380 L400 424 Z" fill="url(#doorG)" stroke="#4a2f14" strokeWidth="3" />
        <path d="M340 424 L340 380 Q340 352 370 352 Q400 352 400 380 L400 424 Z" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
        <line x1="340" y1="398" x2="400" y2="398" stroke="#4a2f14" strokeWidth="2" />
        <line x1="340" y1="386" x2="400" y2="386" stroke="#4a2f14" strokeWidth="1" />
        <circle cx="391" cy="402" r="2.5" fill="#e8b04b" />
        <path d="M350 380 Q370 360 390 380 Z" fill="url(#glassG)" stroke="#4a2f14" strokeWidth="2" />
        <rect x="212" y="334" width="56" height="70" rx="4" fill="#0b1526" stroke="#6b4f2b" strokeWidth="4" />
        <rect x="472" y="334" width="56" height="70" rx="4" fill="#0b1526" stroke="#6b4f2b" strokeWidth="4" />
        <rect x="214" y="336" width="52" height="66" rx="2" fill="url(#glassG)" />
        <rect x="474" y="336" width="52" height="66" rx="2" fill="url(#glassG)" />
        <rect x="212" y="400" width="56" height="5" fill="#8a6f45" />
        <rect x="472" y="400" width="56" height="5" fill="#8a6f45" />
      </motion.g>

      <motion.g style={{ opacity: cols2, scaleY: cols2, transformOrigin: '50% 100%' }}>
        <rect x="192" y="190" width="16" height="110" fill="#31415c" />
        <rect x="552" y="190" width="16" height="110" fill="#31415c" />
        <rect x="192" y="190" width="16" height="3" fill="#47597a" />
        <rect x="552" y="190" width="16" height="3" fill="#47597a" />
      </motion.g>

      <motion.g style={{ opacity: slab2, scaleX: slab2, transformOrigin: '50% 50%' }}>
        <rect x="174" y="190" width="412" height="12" fill="#33435f" />
        <rect x="174" y="190" width="412" height="3" fill="#47597a" />
        <rect x="548" y="264" width="58" height="10" fill="#33435f" />
      </motion.g>

      <motion.g style={{ opacity: wall2, scaleY: wall2, transformOrigin: '50% 100%' }}>
        <rect x="204" y="202" width="340" height="98" fill="url(#wallG)" />
        <rect x="204" y="202" width="10" height="98" fill="#00000022" />
        <rect x="534" y="202" width="10" height="98" fill="#00000022" />
        <rect x="196" y="196" width="356" height="6" fill="#b89a6e" />
        <rect x="552" y="218" width="50" height="46" fill="url(#wallG)" />
        <rect x="552" y="218" width="6" height="46" fill="#00000022" />
        <rect x="552" y="214" width="50" height="4" fill="#8a6f45" />
        <line x1="556" y1="264" x2="598" y2="264" stroke="#33435f" strokeWidth="5" />
        <rect x="556" y="208" width="42" height="3" fill="#cfb28c" />
        {[563, 573, 583, 593].map((bx) => (
          <line key={bx} x1={bx} y1="211" x2={bx} y2="218" stroke="#cfb28c" strokeWidth="2.5" />
        ))}
        <rect x="212" y="222" width="56" height="56" rx="4" fill="#0b1526" stroke="#6b4f2b" strokeWidth="4" />
        <rect x="352" y="222" width="56" height="56" rx="4" fill="#0b1526" stroke="#6b4f2b" strokeWidth="4" />
        <rect x="472" y="222" width="56" height="56" rx="4" fill="#0b1526" stroke="#6b4f2b" strokeWidth="4" />
        <rect x="214" y="224" width="52" height="52" rx="2" fill="url(#glassG)" />
        <rect x="354" y="224" width="52" height="52" rx="2" fill="url(#glassG)" />
        <rect x="474" y="224" width="52" height="52" rx="2" fill="url(#glassG)" />
        <rect x="212" y="274" width="56" height="5" fill="#8a6f45" />
        <rect x="352" y="274" width="56" height="5" fill="#8a6f45" />
        <rect x="472" y="274" width="56" height="5" fill="#8a6f45" />
      </motion.g>

      <motion.g style={{ opacity: roof, scaleY: roof, transformOrigin: '50% 100%' }}>
        <rect x="174" y="184" width="412" height="12" fill="url(#roofG)" />
        <rect x="168" y="168" width="424" height="16" fill="url(#roofG)" />
        <rect x="168" y="168" width="424" height="3" fill="#3d506e" />
        <line x1="176" y1="182" x2="584" y2="182" stroke="rgba(252,211,77,0.18)" strokeWidth="1" />
      </motion.g>

      <motion.g style={{ opacity: windows }}>
        {[240, 500].map((wx) => (
          <g key={wx}>
            <rect x={wx - 44} y="330" width="88" height="80" rx="40" fill="url(#glowWarm)" filter="url(#softGlow)" />
            <rect x={wx - 30} y="338" width="60" height="62" fill="url(#litG)" />
            <line x1={wx - 15} y1="338" x2={wx - 15} y2="400" stroke="#a16207" strokeWidth="1.5" />
            <line x1={wx} y1="338" x2={wx} y2="400" stroke="#a16207" strokeWidth="1.5" />
            <line x1={wx + 15} y1="338" x2={wx + 15} y2="400" stroke="#a16207" strokeWidth="1.5" />
            <line x1={wx - 30} y1="369" x2={wx + 30} y2="369" stroke="#a16207" strokeWidth="1.5" />
            <ellipse cx={wx} cy="426" rx="46" ry="9" fill="url(#glowWarm)" filter="url(#softGlow)" />
          </g>
        ))}
        {[240, 380, 500].map((wx) => (
          <g key={wx}>
            <rect x={wx - 44} y="218" width="88" height="64" rx="40" fill="url(#glowWarm)" filter="url(#softGlow)" />
            <rect x={wx - 28} y="224" width="56" height="52" fill="url(#litG)" />
            <line x1={wx - 14} y1="224" x2={wx - 14} y2="276" stroke="#a16207" strokeWidth="1.5" />
            <line x1={wx} y1="224" x2={wx} y2="276" stroke="#a16207" strokeWidth="1.5" />
            <line x1={wx + 14} y1="224" x2={wx + 14} y2="276" stroke="#a16207" strokeWidth="1.5" />
            <line x1={wx - 28} y1="250" x2={wx + 28} y2="250" stroke="#a16207" strokeWidth="1.5" />
            <ellipse cx={wx} cy="426" rx="40" ry="8" fill="url(#glowWarm)" filter="url(#softGlow)" />
          </g>
        ))}
        <path d="M350 380 Q370 360 390 380 Z" fill="url(#litG)" />
        <rect x="336" y="352" width="68" height="60" rx="34" fill="url(#glowWarm)" filter="url(#softGlow)" />
        <ellipse cx="370" cy="430" rx="55" ry="10" fill="url(#glowWarm)" filter="url(#softGlow)" />
      </motion.g>

      <motion.g style={{ opacity: scaffold }} stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" fill="none">
        <line x1="172" y1="180" x2="172" y2="412" />
        <line x1="190" y1="180" x2="190" y2="412" />
        <line x1="570" y1="180" x2="570" y2="412" />
        <line x1="588" y1="180" x2="588" y2="412" />
        {[210, 260, 310, 360, 400].map((y) => (
          <g key={y}>
            <line x1="168" y1={y} x2="194" y2={y} strokeWidth="1.2" />
            <line x1="566" y1={y} x2="592" y2={y} strokeWidth="1.2" />
          </g>
        ))}
        <path d="M172 210 L190 260 M190 210 L172 260" strokeWidth="1" />
        <path d="M570 210 L588 260 M588 210 L570 260" strokeWidth="1" />
      </motion.g>

      <motion.g style={{ opacity: finish, scale: finish, transformOrigin: '50% 100%' }}>
        <rect x="70" y="424" width="620" height="44" fill="url(#lawnG)" />
        <polygon points="318,468 422,468 406,424 354,424" fill="url(#stoneG)" />
        <line x1="336" y1="468" x2="370" y2="424" stroke="#55606b" strokeWidth="1" />
        <line x1="368" y1="468" x2="382" y2="424" stroke="#55606b" strokeWidth="1" />
        <line x1="404" y1="468" x2="392" y2="424" stroke="#55606b" strokeWidth="1" />
        <line x1="332" y1="452" x2="410" y2="452" stroke="#55606b" strokeWidth="1" />
        <line x1="325" y1="440" x2="415" y2="440" stroke="#55606b" strokeWidth="1" />
        <rect x="330" y="424" width="80" height="8" rx="2" fill="#b9a77f" />
        <rect x="322" y="432" width="96" height="8" rx="2" fill="#a8946c" />
        <rect x="314" y="440" width="112" height="9" rx="2" fill="#97835c" />
        <ellipse cx="216" cy="418" rx="16" ry="10" fill="#1c5c33" />
        <ellipse cx="256" cy="422" rx="13" ry="8" fill="#256e3d" />
        <ellipse cx="300" cy="419" rx="14" ry="9" fill="#1c5c33" />
        <ellipse cx="452" cy="419" rx="14" ry="9" fill="#1c5c33" />
        <ellipse cx="496" cy="422" rx="13" ry="8" fill="#256e3d" />
        <ellipse cx="538" cy="418" rx="16" ry="10" fill="#1c5c33" />
        <g>
          <path d="M118 424 C116 396 120 370 122 344" stroke="url(#trunkG)" strokeWidth="8" fill="none" strokeLinecap="round" />
          <ellipse cx="122" cy="338" rx="15" ry="11" fill="#2f7a44" />
          <path d="M122 338 Q104 312 84 322" stroke="#2f7a44" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M122 338 Q120 308 106 296" stroke="#2f7a44" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M122 338 Q140 308 150 318" stroke="#256e3d" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M122 338 Q150 322 156 336" stroke="#2f7a44" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M122 338 Q92 326 82 338" stroke="#256e3d" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
        <g>
          <path d="M642 424 C644 396 640 370 638 344" stroke="url(#trunkG)" strokeWidth="8" fill="none" strokeLinecap="round" />
          <ellipse cx="638" cy="338" rx="15" ry="11" fill="#2f7a44" />
          <path d="M638 338 Q656 312 676 322" stroke="#2f7a44" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M638 338 Q640 308 654 296" stroke="#2f7a44" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M638 338 Q620 308 610 318" stroke="#256e3d" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M638 338 Q610 322 604 336" stroke="#2f7a44" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M638 338 Q668 326 678 338" stroke="#256e3d" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
        <rect x="70" y="384" width="16" height="40" fill="#223046" />
        <rect x="70" y="380" width="16" height="4" fill="#3d506e" />
        <rect x="674" y="384" width="16" height="40" fill="#223046" />
        <rect x="674" y="380" width="16" height="4" fill="#3d506e" />
        <rect x="76" y="366" width="4" height="14" fill="#33435f" />
        <rect x="680" y="366" width="4" height="14" fill="#33435f" />
        <circle cx="78" cy="364" r="3.5" fill="#fcd34d" filter="url(#softGlow)" />
        <circle cx="682" cy="364" r="3.5" fill="#fcd34d" filter="url(#softGlow)" />
        <circle cx="78" cy="364" r="2" fill="#fff3c4" />
        <circle cx="682" cy="364" r="2" fill="#fff3c4" />
      </motion.g>

      <motion.g style={{ opacity: craneO, x: craneX }}>
        <rect x="706" y="156" width="16" height="268" fill="#1d2a3e" />
        <rect x="706" y="156" width="16" height="3" fill="#33435f" />
        <line x1="704" y1="196" x2="724" y2="214" stroke="#2b3b55" strokeWidth="2" />
        <line x1="724" y1="196" x2="704" y2="214" stroke="#2b3b55" strokeWidth="2" />
        <line x1="704" y1="276" x2="724" y2="294" stroke="#2b3b55" strokeWidth="2" />
        <line x1="724" y1="276" x2="704" y2="294" stroke="#2b3b55" strokeWidth="2" />
        <line x1="704" y1="356" x2="724" y2="374" stroke="#2b3b55" strokeWidth="2" />
        <line x1="724" y1="356" x2="704" y2="374" stroke="#2b3b55" strokeWidth="2" />
        <rect x="524" y="146" width="212" height="14" fill="#1d2a3e" />
        <rect x="524" y="146" width="212" height="3" fill="#33435f" />
        <rect x="724" y="160" width="22" height="18" fill="#2b3b55" />
        <polygon points="706,156 722,156 714,120" fill="#1d2a3e" />
        <circle cx="714" cy="112" r="5" fill="#fcd34d" className="beacon" />
        <circle cx="714" cy="112" r="11" fill="rgba(252,211,77,0.25)" className="beacon" />
        <g className="crane-swing">
          <g className="block-hoist">
            <line x1="622" y1="160" x2="622" y2="276" stroke="rgba(226,232,240,0.6)" strokeWidth="1.5" />
            <path d="M610 276 h 24 M610 276 l 4 -10 h 16 l 4 10" fill="none" stroke="rgba(226,232,240,0.6)" strokeWidth="2" />
            <rect x="602" y="286" width="40" height="26" fill="#e5cf9f" stroke="#b89a6e" strokeWidth="1.5" />
            <rect x="606" y="290" width="10" height="8" rx="1" fill="#0b1526" />
            <rect x="620" y="290" width="10" height="8" rx="1" fill="#0b1526" />
            <rect x="606" y="300" width="10" height="8" rx="1" fill="#0b1526" />
            <rect x="620" y="300" width="10" height="8" rx="1" fill="#0b1526" />
          </g>
        </g>
      </motion.g>
    </svg>
  );
};

/* ===== Dark beat: the villa constructs as you scroll ===== */
const BuildHero = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end end'] });
  const [stage, setStage] = useState(0);
  const progressPct = useTransform(scrollYProgress, (v) => `${Math.round(v * 100)}%`);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setStage(Math.min(BUILD_STAGES.length - 1, Math.max(0, Math.floor(v * BUILD_STAGES.length))));
  });

  return (
    <section ref={heroRef} className="relative" style={{ height: '460vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-[#1a1e24]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.045),transparent_60%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="text-[10px] tracking-[0.35em] text-[#c9a227] font-semibold mb-6"
              >
                مرّر… وشاهد كيف نُدير مشروعك
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={1}
                className="font-serif-ar text-4xl md:text-6xl xl:text-7xl font-bold leading-[1.25] text-white"
              >
                فيلتك
                <span className="block text-[#e3c078]">تُبنى أمامك…</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={2}
                className="mt-6 text-sm md:text-base text-slate-400 leading-relaxed max-w-md"
              >
                أساسات، أعمدة، جدران، سقف، ثم تضيء نوافذها — مرحلة مرحلة، من الحفر
                حتى التسليم. هكذا نُسجّل كل خطوة من مشروعك، قبل أن تُبنى فعلاً.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={3}
                className="mt-8 flex flex-col sm:flex-row items-stretch gap-3"
              >
                <button
                  onClick={() => navigate('/login')}
                  className="px-7 py-3.5 bg-white text-[#1c2126] hover:bg-slate-200 rounded-xl text-sm font-bold transition hover:-translate-y-0.5"
                >
                  ادخل إلى موقع العمل
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                </button>
                <button
                  onClick={() => document.querySelector('#core')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-7 py-3.5 border border-white/15 hover:border-white/40 text-white rounded-xl text-sm font-semibold transition hover:-translate-y-0.5 text-center"
                >
                  لماذا QB؟
                </button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={4}
                className="mt-10 flex items-center gap-3 text-[10px] tracking-[0.3em] text-slate-500"
              >
                <span className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
                مرّر
              </motion.div>
            </div>

            <div>
              <div className="relative rounded-2xl border border-white/10 bg-[#1e2328] p-3 md:p-5 overflow-hidden shadow-2xl shadow-black/40 aspect-[19/12]">
                <VillaBuild progress={scrollYProgress} />
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-[#c9a227] shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/80">{BUILD_STAGES[stage]}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      <motion.span>{progressPct}</motion.span>
                    </span>
                  </div>
                  <div className="h-px bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-l from-[#e3c078] to-[#c9a227]"
                      style={{ scaleX: scrollYProgress, transformOrigin: '100% 50%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ===== Light hero ===== */
const LightHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#f5f3ee]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(23,24,26,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,24,26,0.05) 1px, transparent 1px)',
          backgroundSize: '96px 96px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(180,83,9,0.07),transparent_55%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24 w-full">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-[10px] tracking-[0.45em] text-[#b45309] font-semibold mb-7"
        >
          QB · نظام إدارة المشاريع الإنشائية
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="font-serif-ar text-5xl md:text-7xl font-bold text-[#17181a] leading-[1.15]"
        >
          مبنىٌّ يُدار
          <span className="block text-[#b45309]">بذكاءٍ وهدوء.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="mt-7 text-sm md:text-base text-[#5c5e63] max-w-xl leading-relaxed"
        >
          من حصر الكميات حتى مفتاح التسليم — منصة واحدة: عناصر BOQ تُستخرج من
          المخططات، وكل صرف مشروط بالجودة، وكل مقاول يرى بياناته وحدها.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-9 flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-4 bg-[#17181a] hover:bg-black text-white rounded-xl text-sm font-bold transition hover:-translate-y-0.5"
          >
            ابدأ مشروعك
          </button>
          <button
            onClick={() => document.querySelector('#build')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto px-8 py-4 border border-[#17181a]/25 hover:border-[#17181a]/60 text-[#17181a] rounded-xl text-sm font-semibold transition hover:-translate-y-0.5"
          >
            شاهد الفيلا تُبنى
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#8b8d92]">
        <span className="text-[9px] tracking-[0.4em]">مرّر</span>
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </div>
    </section>
  );
};

/* ===== Stats ===== */
const StatCounter = ({ value, suffix, label }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState(0);

  React.useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-serif-ar text-4xl md:text-5xl font-bold text-[#17181a] tabular-nums">
        {display.toLocaleString('en-US')}
        <span className="text-[#b45309] text-2xl mr-1">{suffix}</span>
      </div>
      <div className="mt-2 text-[10px] tracking-widest text-[#8b8d92] font-semibold">{label}</div>
    </div>
  );
};

/* ===== Three pillars ===== */
const PILLARS = [
  {
    icon: Ruler,
    num: '01',
    title: 'الحصر أولاً',
    desc: 'عناصر BOQ تُستخرج من ملفات DWG/DXF وتُصنَّف آلياً — بلا تقديرات عشوائية ولا تفاوت في الكميات.',
  },
  {
    icon: ShieldCheck,
    num: '02',
    title: 'لا صرف بلا جودة',
    desc: 'فحص QC إلزامي لكل مرحلة قبل تحرير أي دفعة أو ضمان — المال لا يتحرك إلا بعد اكتمال البند.',
  },
  {
    icon: Wallet,
    num: '03',
    title: 'بيانات معزولة',
    desc: 'كل مقاول يرى عقوده ومستحقاته فقط، وكل اعتماد مالي موثق في سجل تدقيق لا يُمسح.',
  },
];

/* ===== Page ===== */
export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#17181a] overflow-x-clip">
      {/* ===== Minimal top bar ===== */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#17181a]/10 bg-[#f5f3ee]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#17181a]/15">
              <Building2 className="w-5 h-5 text-[#b45309]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-[#17181a] leading-tight truncate">
                وِجْهة <span className="text-[#b45309]">|</span> QB
              </h1>
              <p className="text-[10px] text-[#8b8d92] tracking-widest truncate" dir="ltr">construction · architecture · finance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-[#17181a] hover:bg-black text-white rounded-lg text-xs font-bold transition"
            >
              دخول المهندسين
            </button>
          </div>
        </div>
      </header>

      {/* ===== Light hero ===== */}
      <LightHero />

      {/* ===== Dark beat: scroll-building villa ===== */}
      <section id="build" className="scroll-mt-0">
        <BuildHero />
      </section>

      {/* ===== Stats ===== */}
      <section className="relative py-16 border-t border-[#17181a]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatCounter value={58} suffix="بند" label="في تقرير الإنجاز" />
          <StatCounter value={9} suffix="دفعة" label="مستحقات مرحلية" />
          <StatCounter value={11} suffix="وحدة" label="أجنحة متكاملة" />
          <StatCounter value={5} suffix="أدوار" label="بصلاحيات RBAC" />
        </div>
      </section>

      {/* ===== Three pillars ===== */}
      <section id="core" className="relative py-16 md:py-20 border-t border-[#17181a]/10 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="text-[10px] tracking-[0.35em] text-[#b45309] font-semibold mb-4"
            >
              لماذا QB؟
            </motion.div>
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={1}
              className="font-serif-ar text-3xl md:text-4xl font-bold text-[#17181a] leading-tight"
            >
              ثلاث قواعد… لا نُخالفها
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#17181a]/10 border border-[#17181a]/10">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.num}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="bg-[#f5f3ee] p-8 md:p-10"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="w-11 h-11 rounded-xl border border-[#17181a]/15 flex items-center justify-center">
                    <p.icon className="w-5 h-5 text-[#b45309]" />
                  </div>
                  <span className="font-serif-ar text-3xl font-bold text-[#17181a]/15">{p.num}</span>
                </div>
                <h3 className="font-bold text-lg text-[#17181a] mb-3">{p.title}</h3>
                <p className="text-sm text-[#5c5e63] leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Minimal footer ===== */}
      <footer className="border-t border-[#17181a]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-[#17181a]/15 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#b45309]" />
            </div>
            <div className="text-sm font-bold text-[#17181a]">وِجْهة QB</div>
            <div className="hidden md:block text-[10px] text-[#8b8d92]">© 2026 · QB CONSTRUCTION MANAGEMENT</div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg border border-[#17181a]/20 hover:border-[#17181a]/50 text-xs font-semibold text-[#17181a] transition"
          >
            دخول المهندسين
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;