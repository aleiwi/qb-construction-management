import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion, useScroll, useTransform, useMotionValueEvent, useInView,
} from 'framer-motion';
import {
  Building2, FolderKanban, FileText, FileSignature, Wallet, ShieldCheck,
  HardHat, UsersRound, BarChart3, TrendingUp, History, UserCircle,
  KeyRound, Fingerprint, Lock, Database, CheckCircle2, ChevronDown, ArrowLeft,
  Menu, X, Mail, Phone, MapPin, Send, Layers, MessageSquare, Ruler,
} from 'lucide-react';

const HERO_IMG =
  'https://images.unsplash.com/photo-1623298317883-6b70254edf31?fm=jpg&q=80&w=1920&auto=format&fit=crop';
const CTA_IMG =
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?fm=jpg&q=80&w=1920&auto=format&fit=crop';

const FEATURES = [
  { icon: FolderKanban, code: 'MOD-01', title: 'المشاريع والمباني', desc: 'تقسيم المشاريع إلى مباني ومراحل بأوزان نسبية دقيقة لمتابعة التنفيذ.' },
  { icon: FileText, code: 'MOD-02', title: 'حصر الكميات BOQ (CAD)', desc: 'استخراج العناصر من ملفات DWG/DXF تلقائياً مع مراجعة يدوية للمصنفات.' },
  { icon: FileSignature, code: 'MOD-03', title: 'العقود والتعاقدات', desc: 'ربط المقاولين بالمباني وتتبع قيم العقود ونسب الإنجاز والحالات.' },
  { icon: HardHat, code: 'MOD-04', title: 'إدارة المقاولين', desc: 'سجل موحد للمقاولين مع عزل تام لبيانات كل مقاول (Row-Level Security).' },
  { icon: Wallet, code: 'MOD-05', title: 'المستحقات والضمان', desc: 'دفعات مرحلية مشروطة بمراجعة الجودة مع احتجاز الضمانات وتحريرها.' },
  { icon: ShieldCheck, code: 'MOD-06', title: 'فحوصات الجودة QC', desc: 'فحوصات إلزامية لكل مرحلة قبل اعتماد أي مستحقات مالية.' },
  { icon: UsersRound, code: 'MOD-07', title: 'الموارد البشرية HR', desc: 'الموظفون وسجل الحضور والرواتب الشهرية الثابتة.' },
  { icon: BarChart3, code: 'MOD-08', title: 'التقارير و KPIs', desc: 'مؤشرات أداء عامة ورسوم بيانية عبر جميع الوحدات.' },
  { icon: TrendingUp, code: 'MOD-09', title: 'نسب الإنجاز الشامل', desc: 'تقرير دوري شامل (58 بنداً + 9 دفعات) قابل للطباعة والتصدير PDF.' },
  { icon: History, code: 'MOD-10', title: 'سجل التتبع (Audit Log)', desc: 'سجل كامل للعمليات المالية الحساسة: من نفّذها ومتى والقيم قبل/بعد.' },
  { icon: UserCircle, code: 'MOD-11', title: 'الملف الشخصي', desc: 'إدارة حسابك وتغيير كلمة المرور بأمان تام.' },
];

const SECURITY_POINTS = [
  { icon: KeyRound, title: 'التحكم بالدخول — RBAC', desc: 'خمسة أدوار وظيفية تتحكم في كل صفحة وزر داخل النظام.' },
  { icon: Fingerprint, title: 'عزل البيانات — RLS', desc: 'المقاول يرى عقوده ومستحقاته فقط؛ والمهندس مقيد بمشاريع حسابه.' },
  { icon: Lock, title: 'الجلسات — JWT', desc: 'جلسات موثقة مع قفل الحساب بعد المحاولات الفاشلة و HTTPS إجباري.' },
  { icon: Database, title: 'سجل التتبع — Audit', desc: 'كل اعتماد دفعة أو تعديل سعر موثق: المنفذ، القيمة قبل وبعد.' },
];

const PHASES = [
  { icon: Ruler, phase: '01', title: 'التصميم والحصر', desc: 'رفع ملفات DWG/DXF واستخراج عناصر BOQ تلقائياً وتصنيفها.' },
  { icon: FileSignature, phase: '02', title: 'التعاقد', desc: 'ربط المقاولين بالمباني وتثبيت قيم العقود والضمانات.' },
  { icon: ShieldCheck, phase: '03', title: 'التنفيذ والجودة', desc: 'مراحل وأوزان نسبية مع فحوصات QC إلزامية قبل أي صرف.' },
  { icon: Wallet, phase: '04', title: 'الاعتماد والصرف', desc: 'دفعات مرحلية وتحرير ضمانات بسجل تدقيق كامل.' },
];

const FAQS = [
  { q: 'ما هي الأدوار المدعومة في النظام؟', a: 'خمسة أدوار: مدير نظام، مدير مشروع، مهندس موقع، محاسب مالي، ومقاول تنفيذ — لكل دور واجهة مخصصة وصلاحيات مضبوطة على مستوى الصفحات والأزرار والبيانات.' },
  { q: 'هل يمكن للمقاول رؤية بيانات المقاولين الآخرين؟', a: 'لا. النظام يطبق عزل البيانات (Row-Level Security) — المقاول يرى عقوده ومستحقاته وفحوصاته فقط، ولا تصل أي بيانات لمقاولين آخرين.' },
  { q: 'هل يتم استخراج حصر الكميات تلقائياً من المخططات؟', a: 'نعم، النظام يقرأ ملفات DWG/DXF ويستخرج العناصر (أعمدة، جدران، مصنفات...) ويصنفها آلياً، مع مراجعة يدوية للعناصر غير المصنفة.' },
  { q: 'كيف تتم حماية الحسابات والجلسات؟', a: 'كلمات المرور مشفرة، الجلسات عبر JWT آمن، قفل الحساب بعد محاولات فاشلة متتالية، وإجبار HTTPS في الإنتاج. كما يمكن تسجيل الدخول عبر Google أو Facebook أو Microsoft أو GitHub.' },
  { q: 'هل يتوفر سجل لما يحدث داخل النظام؟', a: 'نعم، سجل تتبع (Audit Log) كامل للعمليات المالية الحساسة يوثق من نفذ العملية ومتى وما القيم قبلها وبعدها — متاح لمدير النظام.' },
  { q: 'هل يمكن تصدير تقارير الإنجاز؟', a: 'تقرير نسب الإنجاز الشامل يغطي 58 بنداً و9 دفعات، قابل للطباعة والتصدير إلى PDF وExcel بنقرة واحدة.' },
];

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
  // — construction stages (0 → 1)
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

      {/* ==== site ground (bare soil) ==== */}
      <rect x="60" y="424" width="640" height="44" fill="#0b1a12" />

      {/* ==== excavation trench + foundation ==== */}
      <motion.g style={{ opacity: found }}>
        <rect x="172" y="416" width="416" height="14" fill="#05080f" opacity="0.9" />
        <rect x="180" y="410" width="400" height="14" fill="#2b3b55" />
        <rect x="180" y="410" width="400" height="3" fill="#3d506e" />
        <line x1="180" y1="424" x2="580" y2="424" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
      </motion.g>

      {/* ==== ground floor columns ==== */}
      <motion.g style={{ opacity: cols1, scaleY: cols1, transformOrigin: '50% 100%' }}>
        <rect x="192" y="300" width="16" height="110" fill="#31415c" />
        <rect x="248" y="300" width="16" height="110" fill="#31415c" />
        <rect x="496" y="300" width="16" height="110" fill="#31415c" />
        <rect x="552" y="300" width="16" height="110" fill="#31415c" />
        <rect x="192" y="300" width="16" height="3" fill="#47597a" />
        <rect x="552" y="300" width="16" height="3" fill="#47597a" />
      </motion.g>

      {/* ==== ground floor slab ==== */}
      <motion.g style={{ opacity: slab1, scaleX: slab1, transformOrigin: '50% 50%' }}>
        <rect x="174" y="300" width="412" height="12" fill="#33435f" />
        <rect x="174" y="300" width="412" height="3" fill="#47597a" />
      </motion.g>

      {/* ==== ground floor walls + openings ==== */}
      <motion.g style={{ opacity: wall1, scaleY: wall1, transformOrigin: '50% 100%' }}>
        <rect x="204" y="312" width="352" height="112" fill="url(#wallG)" />
        <rect x="204" y="398" width="352" height="26" fill="url(#baseG)" />
        <rect x="204" y="312" width="10" height="112" fill="#00000022" />
        <rect x="546" y="312" width="10" height="112" fill="#00000022" />
        {/* door — arched */}
        <path d="M340 424 L340 380 Q340 352 370 352 Q400 352 400 380 L400 424 Z" fill="url(#doorG)" stroke="#4a2f14" strokeWidth="3" />
        <path d="M340 424 L340 380 Q340 352 370 352 Q400 352 400 380 L400 424 Z" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
        <line x1="340" y1="398" x2="400" y2="398" stroke="#4a2f14" strokeWidth="2" />
        <line x1="340" y1="386" x2="400" y2="386" stroke="#4a2f14" strokeWidth="1" />
        <circle cx="391" cy="402" r="2.5" fill="#e8b04b" />
        {/* door fanlight */}
        <path d="M350 380 Q370 360 390 380 Z" fill="url(#glassG)" stroke="#4a2f14" strokeWidth="2" />
        {/* ground windows (frames first, glass lights later) */}
        <rect x="212" y="334" width="56" height="70" rx="4" fill="#0b1526" stroke="#6b4f2b" strokeWidth="4" />
        <rect x="472" y="334" width="56" height="70" rx="4" fill="#0b1526" stroke="#6b4f2b" strokeWidth="4" />
        <rect x="214" y="336" width="52" height="66" rx="2" fill="url(#glassG)" />
        <rect x="474" y="336" width="52" height="66" rx="2" fill="url(#glassG)" />
        <rect x="212" y="400" width="56" height="5" fill="#8a6f45" />
        <rect x="472" y="400" width="56" height="5" fill="#8a6f45" />
      </motion.g>

      {/* ==== upper floor columns ==== */}
      <motion.g style={{ opacity: cols2, scaleY: cols2, transformOrigin: '50% 100%' }}>
        <rect x="192" y="190" width="16" height="110" fill="#31415c" />
        <rect x="552" y="190" width="16" height="110" fill="#31415c" />
        <rect x="192" y="190" width="16" height="3" fill="#47597a" />
        <rect x="552" y="190" width="16" height="3" fill="#47597a" />
      </motion.g>

      {/* ==== upper floor slab + balcony slab ==== */}
      <motion.g style={{ opacity: slab2, scaleX: slab2, transformOrigin: '50% 50%' }}>
        <rect x="174" y="190" width="412" height="12" fill="#33435f" />
        <rect x="174" y="190" width="412" height="3" fill="#47597a" />
        <rect x="548" y="264" width="58" height="10" fill="#33435f" />
      </motion.g>

      {/* ==== upper floor walls + balcony ==== */}
      <motion.g style={{ opacity: wall2, scaleY: wall2, transformOrigin: '50% 100%' }}>
        <rect x="204" y="202" width="340" height="98" fill="url(#wallG)" />
        <rect x="204" y="202" width="10" height="98" fill="#00000022" />
        <rect x="534" y="202" width="10" height="98" fill="#00000022" />
        {/* cornice under roof */}
        <rect x="196" y="196" width="356" height="6" fill="#b89a6e" />
        {/* balcony */}
        <rect x="552" y="218" width="50" height="46" fill="url(#wallG)" />
        <rect x="552" y="218" width="6" height="46" fill="#00000022" />
        <rect x="552" y="214" width="50" height="4" fill="#8a6f45" />
        <line x1="556" y1="264" x2="598" y2="264" stroke="#33435f" strokeWidth="5" />
        <rect x="556" y="208" width="42" height="3" fill="#cfb28c" />
        {[563, 573, 583, 593].map((bx) => (
          <line key={bx} x1={bx} y1="211" x2={bx} y2="218" stroke="#cfb28c" strokeWidth="2.5" />
        ))}
        {/* upper windows */}
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

      {/* ==== roof + parapet ==== */}
      <motion.g style={{ opacity: roof, scaleY: roof, transformOrigin: '50% 100%' }}>
        <rect x="174" y="184" width="412" height="12" fill="url(#roofG)" />
        <rect x="168" y="168" width="424" height="16" fill="url(#roofG)" />
        <rect x="168" y="168" width="424" height="3" fill="#3d506e" />
        <line x1="176" y1="182" x2="584" y2="182" stroke="rgba(252,211,77,0.18)" strokeWidth="1" />
      </motion.g>

      {/* ==== lighting: windows glow warm ==== */}
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
        {/* door fanlight lit */}
        <path d="M350 380 Q370 360 390 380 Z" fill="url(#litG)" />
        <rect x="336" y="352" width="68" height="60" rx="34" fill="url(#glowWarm)" filter="url(#softGlow)" />
        <ellipse cx="370" cy="430" rx="55" ry="10" fill="url(#glowWarm)" filter="url(#softGlow)" />
      </motion.g>

      {/* ==== scaffolding (fades at delivery) ==== */}
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

      {/* ==== finishing: garden, palms, walkway, walls ==== */}
      <motion.g style={{ opacity: finish, scale: finish, transformOrigin: '50% 100%' }}>
        {/* lawn */}
        <rect x="70" y="424" width="620" height="44" fill="url(#lawnG)" />
        {/* walkway + steps */}
        <polygon points="318,468 422,468 406,424 354,424" fill="url(#stoneG)" />
        <line x1="336" y1="468" x2="370" y2="424" stroke="#55606b" strokeWidth="1" />
        <line x1="368" y1="468" x2="382" y2="424" stroke="#55606b" strokeWidth="1" />
        <line x1="404" y1="468" x2="392" y2="424" stroke="#55606b" strokeWidth="1" />
        <line x1="332" y1="452" x2="410" y2="452" stroke="#55606b" strokeWidth="1" />
        <line x1="325" y1="440" x2="415" y2="440" stroke="#55606b" strokeWidth="1" />
        <rect x="330" y="424" width="80" height="8" rx="2" fill="#b9a77f" />
        <rect x="322" y="432" width="96" height="8" rx="2" fill="#a8946c" />
        <rect x="314" y="440" width="112" height="9" rx="2" fill="#97835c" />
        {/* shrubs */}
        <ellipse cx="216" cy="418" rx="16" ry="10" fill="#1c5c33" />
        <ellipse cx="256" cy="422" rx="13" ry="8" fill="#256e3d" />
        <ellipse cx="300" cy="419" rx="14" ry="9" fill="#1c5c33" />
        <ellipse cx="452" cy="419" rx="14" ry="9" fill="#1c5c33" />
        <ellipse cx="496" cy="422" rx="13" ry="8" fill="#256e3d" />
        <ellipse cx="538" cy="418" rx="16" ry="10" fill="#1c5c33" />
        {/* palms */}
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
        {/* garden walls + light posts */}
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

      {/* ==== crane (leaves at delivery) ==== */}
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
        {/* cable + facade panel */}
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

/* ===== Hero: the villa constructs as you scroll ===== */
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
      <div className="sticky top-0 h-screen overflow-hidden bg-[#23282d]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.045),transparent_60%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Text */}
            <div>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="text-[10px] tracking-[0.35em] text-[#c9a227] font-semibold mb-6"
              >
                مُنشِئو المساحات المتميزة
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={1}
                className="font-serif-ar text-4xl md:text-6xl xl:text-7xl font-bold leading-[1.25] text-white"
              >
                شاهد فيلتك
                <span className="block text-[#e3c078]">تُبنى أمامك…</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={2}
                className="mt-6 text-sm md:text-base text-slate-400 leading-relaxed max-w-md"
              >
                مرّر للأسفل… وستنهض الفيلا طابقاً طابقاً: أساسات، أعمدة، جدران، سقف،
                ثم تضيء نوافذها. هكذا ندير مشروعك — مرحلة مرحلة، من الحفر حتى التسليم.
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
                <a
                  href="#modules"
                  onClick={(e) => { e.preventDefault(); document.querySelector('#modules')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="px-7 py-3.5 border border-white/15 hover:border-white/40 text-white rounded-xl text-sm font-semibold transition hover:-translate-y-0.5 text-center"
                >
                  استعرض الأجنحة
                </a>
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

            {/* Scene + stage meter */}
            <div>
              <div className="relative rounded-2xl border border-white/10 bg-[#1e2328] p-3 md:p-5 overflow-hidden shadow-2xl shadow-black/40 aspect-[19/12]">
                <VillaBuild progress={scrollYProgress} />
              </div>

              {/* stage label + progress */}
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

/* ===== Stats band ===== */
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
      <div className="font-serif-ar text-4xl md:text-5xl font-bold text-white tabular-nums">
        {display.toLocaleString('en-US')}
        <span className="text-[#c9a227] text-2xl mr-1">{suffix}</span>
      </div>
      <div className="mt-2 text-[10px] tracking-widest text-slate-500 font-semibold">{label}</div>
    </div>
  );
};

/* ===== Contact form ===== */
const ContactForm = () => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center py-10 animate-fade-in">
        <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="font-serif-ar text-xl font-bold text-white mb-2">شكراً لتواصلك معنا</h3>
        <p className="text-sm text-slate-400">تم استلام رسالتك بنجاح، وسيتواصل معك فريقنا في أقرب وقت.</p>
        <button
          onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }}
          className="mt-6 px-5 py-2.5 border border-white/15 hover:border-white/40 text-slate-300 rounded-xl text-sm font-semibold transition"
        >
          إرسال رسالة أخرى
        </button>
      </div>
    );
  }

  const inputCls = "w-full bg-transparent border-b border-white/15 focus:border-[#c9a227] px-1 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition";
  const labelCls = "block text-[10px] tracking-widest text-slate-500 font-semibold mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
        <div>
          <label className={labelCls}>الاسم الكامل</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="م. محمد خالد" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>البريد الإلكتروني</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>رسالتك</label>
        <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="كيف يمكننا مساعدتك؟" className={`${inputCls} resize-none`} />
      </div>
      <button
        type="submit"
        className="w-full px-6 py-3.5 bg-white hover:bg-slate-200 text-[#1c2126] rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
      >
        <Send className="w-4 h-4" />
        إرسال الرسالة
      </button>
    </form>
  );
};

/* ===== Section heading ===== */
const SectionHead = ({ kicker, title, desc }) => (
  <div className="text-center mb-14">
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="text-[10px] tracking-[0.35em] text-[#c9a227] font-semibold mb-5"
    >
      {kicker}
    </motion.div>
    <motion.h2
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      custom={1}
      className="font-serif-ar text-3xl md:text-5xl font-bold text-white leading-tight"
    >
      {title}
    </motion.h2>
    {desc && (
      <motion.p
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        custom={2}
        className="mt-5 text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed"
      >
        {desc}
      </motion.p>
    )}
  </div>
);

/* ===== Page ===== */
export const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const navLinks = [
    { href: '#modules', label: 'الأجنحة' },
    { href: '#phases', label: 'مراحل التنفيذ' },
    { href: '#security', label: 'الحماية' },
    { href: '#faq', label: 'الأسئلة' },
    { href: '#contact', label: 'تواصل' },
  ];

  const scrollTo = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#292f35] text-slate-100 overflow-x-clip">
      {/* ===== Navbar ===== */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/8 bg-[#292f35]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/15">
              <Building2 className="w-5 h-5 text-[#e3c078]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white leading-tight truncate">
                وِجْهة <span className="text-[#c9a227]">|</span> QB
              </h1>
              <p className="text-[10px] text-slate-500 tracking-widest truncate" dir="ltr">construction · architecture · finance</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => scrollTo(e, l.href)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-white hover:bg-slate-200 text-[#1c2126] rounded-lg text-xs font-bold transition hidden sm:block"
            >
              دخول المهندسين
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 text-slate-300 hover:bg-white/5 rounded-lg transition"
              aria-label="القائمة"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/8 bg-[#292f35]/95 backdrop-blur-xl animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => scrollTo(e, l.href)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-white transition"
                >
                  {l.label}
                </a>
              ))}
              <button
                onClick={() => { setMobileOpen(false); navigate('/login'); }}
                className="w-full mt-2 px-4 py-3 bg-white text-[#1c2126] rounded-lg text-sm font-bold transition"
              >
                دخول المهندسين
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ===== Photo hero ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src={HERO_IMG}
          alt="فيلا فاخرة عند الغسق"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#292f35]/75 via-[#292f35]/45 to-[#292f35]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24 pb-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-[10px] tracking-[0.45em] text-[#e3c078] font-semibold mb-7"
          >
            QB · نظام إدارة المشاريع الإنشائية
          </motion.div>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="font-serif-ar text-5xl md:text-7xl font-bold text-white leading-[1.15]"
          >
            نُشيّدُ مساحاتٍ
            <span className="block text-[#e3c078]">متميزة</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-7 text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed"
          >
            من التصميم الأول حتى مفتاح التسليم — منصة واحدة تدير الحصر، العقود،
            الجودة، والمستحقات المالية بدقة وبسجل موثق بالكامل.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-200 text-[#1c2126] rounded-xl text-sm font-bold transition hover:-translate-y-0.5"
            >
              ابدأ مشروعك
            </button>
            <button
              onClick={() => document.querySelector('#build')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-4 border border-white/25 hover:border-white/60 text-white rounded-xl text-sm font-semibold transition hover:-translate-y-0.5"
            >
              شاهد الفيلا تُبنى
            </button>
          </motion.div>
        </div>

        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400">
          <span className="text-[9px] tracking-[0.4em]">مرّر</span>
          <span className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ===== Scroll-building villa ===== */}
      <section id="build" className="scroll-mt-0">
        <BuildHero />
      </section>

      {/* ===== Stats ===== */}
      <section className="relative py-16 border-t border-white/8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatCounter value={58} suffix="بند" label="في تقرير الإنجاز" />
          <StatCounter value={9} suffix="دفعة" label="مستحقات مرحلية" />
          <StatCounter value={11} suffix="وحدة" label="أجنحة متكاملة" />
          <StatCounter value={5} suffix="أدوار" label="بصلاحيات RBAC" />
        </div>
      </section>

      {/* ===== Modules ===== */}
      <section id="modules" className="relative py-16 md:py-24 scroll-mt-20 border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            kicker="الأجنحة"
            title={<>أحد عشر جناحاً <span className="text-[#e3c078]">للمشروع</span></>}
            desc="تغطي دورة حياة المشروع كاملة — من التصميم والحصر حتى الاعتماد المالي النهائي."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/8 border border-white/8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.code}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                custom={i % 3}
                className="bg-[#2b3138] hover:bg-[#30373e] transition-colors duration-300 p-6 md:p-7"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-lg border border-white/10 text-[#e3c078] flex items-center justify-center">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] tracking-widest text-slate-600">{f.code}</span>
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Phases ===== */}
      <section id="phases" className="relative py-16 md:py-24 scroll-mt-20 border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            kicker="مراحل التنفيذ"
            title={<>مثلما رأيتها تُبنى… <span className="text-[#e3c078]">تدار بهذا الترتيب</span></>}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-white/8 border border-white/8">
            {PHASES.map((p, i) => (
              <motion.div
                key={p.phase}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                custom={i}
                className="bg-[#2b3138] p-7 text-center"
              >
                <div className="font-mono text-[#c9a227] text-xs tracking-widest mb-6">{p.phase}</div>
                <p.icon className="w-6 h-6 text-white/60 mx-auto mb-5" />
                <h3 className="font-bold text-white text-sm mb-2">{p.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Security ===== */}
      <section id="security" className="relative py-16 md:py-24 scroll-mt-20 border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            kicker="الحماية"
            title={<>بياناتك… <span className="text-[#e3c078]">محروسة من الأساس</span></>}
            desc="أربع طبقات حماية: لكل وصول، لكل عملية، ولكل مقاول."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8 border border-white/8">
            {SECURITY_POINTS.map((s, i) => (
              <motion.div
                key={s.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                custom={i}
                className="bg-[#2b3138] hover:bg-[#30373e] transition-colors duration-300 p-6"
              >
                <div className="w-11 h-11 mb-5 rounded-lg border border-white/10 text-[#e3c078] flex items-center justify-center">
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1.5">{s.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="relative py-16 md:py-24 scroll-mt-20 border-t border-white/8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            kicker="الأسئلة الشائعة"
            title={<>استفسارات المكاتب <span className="text-[#e3c078]">والمقاولين</span></>}
          />

          <div className="border-t border-white/8">
            {FAQS.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-30px' }}
                custom={i % 3}
                className="border-b border-white/8"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-2 py-5 text-right"
                >
                  <span className="flex items-center gap-4">
                    <span className={`font-mono text-[10px] ${openFaq === i ? 'text-[#c9a227]' : 'text-slate-600'}`}>
                      Q-{String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold text-white text-sm md:text-base">{f.q}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-[#c9a227]' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="px-2 pb-6 text-xs md:text-sm text-slate-400 leading-relaxed border-t border-white/8 pt-4">{f.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact ===== */}
      <section id="contact" className="relative py-16 md:py-24 scroll-mt-20 border-t border-white/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <div>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="text-[10px] tracking-[0.35em] text-[#c9a227] font-semibold mb-6"
              >
                تواصل معنا
              </motion.div>
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={1}
                className="font-serif-ar text-3xl md:text-5xl font-bold text-white leading-tight"
              >
                عندك مشروع على الورق؟
                <span className="block text-[#e3c078] mt-2">خليه يطلع للواقع…</span>
              </motion.h2>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={2}
                className="mt-6 text-slate-400 text-sm leading-relaxed max-w-md"
              >
                فريقنا جاهز لتجهيز النظام لمكتبك أو شركتك الإنشائية — راسلنا وسنعود خلال يوم عمل واحد.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={3}
                className="mt-10 space-y-6 text-sm"
              >
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-[#e3c078]" />
                  </div>
                  <div>
                    <div className="text-[10px] tracking-widest text-slate-500 font-semibold">البريد الإلكتروني</div>
                    info@qb-construction.sa
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[#e3c078]" />
                  </div>
                  <div>
                    <div className="text-[10px] tracking-widest text-slate-500 font-semibold">الهاتف</div>
                    +966 5X XXX XXXX
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-[#e3c078]" />
                  </div>
                  <div>
                    <div className="text-[10px] tracking-widest text-slate-500 font-semibold">الموقع</div>
                    الرياض، المملكة العربية السعودية
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={1}
              className="border border-white/8 bg-[#2b3138]/70 p-7 md:p-9"
            >
              <ContactForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <img
          src={CTA_IMG}
          alt="منزل عصري"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[#292f35]/85" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="font-serif-ar text-4xl md:text-6xl font-bold text-white leading-tight"
          >
            ابدأ مشروعك.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={1}
            className="mt-6 text-slate-300 text-sm md:text-base max-w-lg mx-auto leading-relaxed"
          >
            إدارة مشروعك بالطريقة التي يستحقها — بدقة حساب، وجودة تنفيذ، وبيانات محصّنة.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={2}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-9 py-4 bg-white hover:bg-slate-200 text-[#1c2126] rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition hover:-translate-y-0.5"
            >
              دخول المهندسين
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTo({ preventDefault: () => {} }, '#modules')}
              className="w-full sm:w-auto px-9 py-4 border border-white/25 hover:border-white/60 text-white rounded-xl text-sm font-semibold transition hover:-translate-y-0.5"
            >
              راجع الأجنحة
            </button>
          </motion.div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/8 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/15">
              <Building2 className="w-4 h-4 text-[#e3c078]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">وِجْهة QB — إدارة المقاولات المتكاملة</div>
              <div className="text-[10px] text-slate-500 tracking-widest" dir="ltr">© 2026 · QB CONSTRUCTION MANAGEMENT</div>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#modules" onClick={(e) => scrollTo(e, '#modules')} className="hover:text-white transition">الأجنحة</a>
            <a href="#phases" onClick={(e) => scrollTo(e, '#phases')} className="hover:text-white transition">مراحل التنفيذ</a>
            <a href="#security" onClick={(e) => scrollTo(e, '#security')} className="hover:text-white transition">الحماية</a>
            <a href="#contact" onClick={(e) => scrollTo(e, '#contact')} className="hover:text-white transition">تواصل</a>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 tracking-widest">
            <span className="text-white/70">RLS</span>
            <span>·</span>
            <span className="text-[#e3c078]">RBAC</span>
            <span>·</span>
            <span className="text-white/70">JWT</span>
            <span>·</span>
            <span>HTTPS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;