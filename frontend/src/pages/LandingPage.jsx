import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LANDING } from '../config/roleAccess';
import {
  motion, useScroll, useTransform, useMotionValueEvent, useInView,
} from 'framer-motion';
import {
  Building2, FolderKanban, FileText, FileSignature, Wallet, ShieldCheck,
  HardHat, UsersRound, BarChart3, TrendingUp, History, UserCircle,
  KeyRound, Fingerprint, Lock, Database, CheckCircle2, ChevronDown, ArrowLeft,
  Menu, X, Mail, Phone, MapPin, Send, Moon, Compass, Layers, MessageSquare, Ruler,
} from 'lucide-react';

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
  { icon: KeyRound, title: 'برج الحراسة — RBAC', desc: 'خمسة أدوار وظيفية تتحكم في كل صفحة وزر، كأبراج مراقبة في كل واجهة.' },
  { icon: Fingerprint, title: 'الأسوار — عزل البيانات RLS', desc: 'المقاول يرى عقوده ومستحقاته فقط؛ والمهندس مقيد بمشاريع حسابه.' },
  { icon: Lock, title: 'البوابات — JWT والحماية', desc: 'جلسات موثقة مع قفل الحساب بعد المحاولات الفاشلة و HTTPS إجباري.' },
  { icon: Database, title: 'كاميرات التتبع — Audit', desc: 'كل اعتماد دفعة أو تعديل سعر موثق: المنفذ، القيمة قبل وبعد.' },
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
  'صبّ الأعمدة',
  'بلاطة الدور الأرضي',
  'الجدران والواجهة',
  'الدور الأول',
  'السقف والبارابيت',
  'الإضاءة والتشطيب',
  'تسليم المشروع',
];

const STARS = Array.from({ length: 30 }, (_, i) => ({
  top: (i * 37) % 55 + 3,
  left: (i * 53) % 94 + 3,
  size: (i % 3) + 1,
  cls: i % 3 === 0 ? 'twinkle' : (i % 3 === 1 ? 'twinkle-delayed' : ''),
}));

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: 'easeOut' } }),
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
    <svg viewBox="0 0 700 460" className="w-full h-full select-none" role="img" aria-label="فيلا تُبنى أثناء التمرير">
      {/* ground */}
      <line x1="70" y1="420" x2="650" y2="420" stroke="rgba(251,191,36,0.5)" strokeWidth="2" />
      <line x1="70" y1="430" x2="650" y2="430" stroke="rgba(251,191,36,0.12)" strokeWidth="1" />
      <g stroke="rgba(251,191,36,0.15)" strokeWidth="1">
        {[90, 130, 170, 210, 250, 290, 330, 370, 410, 450, 490, 530, 570, 610].map((x) => (
          <line key={x} x1={x} y1="420" x2={x - 6} y2="430" />
        ))}
      </g>

      {/* ===== foundation ===== */}
      <motion.g style={{ opacity: found, scaleX: found, transformOrigin: '50% 100%' }}>
        <rect x="140" y="404" width="380" height="16" fill="#101d33" stroke="rgba(251,191,36,0.6)" strokeWidth="1.5" />
        <line x1="140" y1="412" x2="520" y2="412" stroke="rgba(251,191,36,0.2)" strokeWidth="1" />
      </motion.g>

      {/* ===== ground floor: columns ===== */}
      <motion.g style={{ opacity: cols1, scaleY: cols1, transformOrigin: '50% 100%' }}>
        <rect x="180" y="300" width="14" height="104" fill="#16283f" stroke="rgba(251,191,36,0.45)" strokeWidth="1.2" />
        <rect x="466" y="300" width="14" height="104" fill="#16283f" stroke="rgba(251,191,36,0.45)" strokeWidth="1.2" />
      </motion.g>

      {/* ===== ground floor: slab ===== */}
      <motion.g style={{ opacity: slab1, scaleX: slab1, transformOrigin: '50% 50%' }}>
        <rect x="162" y="300" width="336" height="12" fill="#0f1d33" stroke="rgba(251,191,36,0.55)" strokeWidth="1.4" />
      </motion.g>

      {/* ===== ground floor: wall + door frame ===== */}
      <motion.g style={{ opacity: wall1, scaleY: wall1, transformOrigin: '50% 100%' }}>
        <rect x="200" y="312" width="280" height="92" fill="#0d1b31" stroke="rgba(251,191,36,0.3)" strokeWidth="1.2" />
        {/* door */}
        <rect x="310" y="336" width="62" height="68" fill="#0a1526" stroke="rgba(251,191,36,0.45)" strokeWidth="1.2" strokeDasharray="4 3" />
        <line x1="372" y1="336" x2="372" y2="404" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
        {/* window frame */}
        <rect x="222" y="338" width="70" height="60" fill="#0a1526" stroke="rgba(251,191,36,0.45)" strokeWidth="1.2" strokeDasharray="4 3" />
      </motion.g>

      {/* ===== upper floor: columns ===== */}
      <motion.g style={{ opacity: cols2, scaleY: cols2, transformOrigin: '50% 100%' }}>
        <rect x="180" y="190" width="14" height="110" fill="#16283f" stroke="rgba(251,191,36,0.45)" strokeWidth="1.2" />
        <rect x="466" y="190" width="14" height="110" fill="#16283f" stroke="rgba(251,191,36,0.45)" strokeWidth="1.2" />
      </motion.g>

      {/* ===== upper floor: slab + balcony ===== */}
      <motion.g style={{ opacity: slab2, scaleX: slab2, transformOrigin: '50% 50%' }}>
        <rect x="162" y="190" width="336" height="12" fill="#0f1d33" stroke="rgba(251,191,36,0.55)" strokeWidth="1.4" />
        <rect x="486" y="250" width="58" height="8" fill="#0f1d33" stroke="rgba(251,191,36,0.4)" strokeWidth="1" />
      </motion.g>

      {/* ===== upper floor: wall + balcony rail ===== */}
      <motion.g style={{ opacity: wall2, scaleY: wall2, transformOrigin: '50% 100%' }}>
        <rect x="200" y="202" width="286" height="88" fill="#0d1b31" stroke="rgba(251,191,36,0.3)" strokeWidth="1.2" />
        <rect x="490" y="258" width="50" height="50" fill="#0d1b31" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
        <line x1="490" y1="258" x2="540" y2="258" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2" />
        <line x1="500" y1="258" x2="500" y2="308" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <line x1="515" y1="258" x2="515" y2="308" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <line x1="530" y1="258" x2="530" y2="308" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        {/* window frames */}
        <rect x="222" y="218" width="66" height="56" fill="#0a1526" stroke="rgba(251,191,36,0.45)" strokeWidth="1.2" strokeDasharray="4 3" />
        <rect x="398" y="218" width="66" height="56" fill="#0a1526" stroke="rgba(251,191,36,0.45)" strokeWidth="1.2" strokeDasharray="4 3" />
      </motion.g>

      {/* ===== roof ===== */}
      <motion.g style={{ opacity: roof, scaleY: roof, transformOrigin: '50% 100%' }}>
        <rect x="162" y="190" width="336" height="10" fill="#101d33" stroke="rgba(251,191,36,0.55)" strokeWidth="1.4" />
        <rect x="152" y="176" width="356" height="14" fill="#0f1d33" stroke="rgba(251,191,36,0.5)" strokeWidth="1.3" />
      </motion.g>

      {/* ===== lit windows ===== */}
      <motion.g style={{ opacity: windows }}>
        <rect x="226" y="342" width="62" height="52" fill="#fcd34d" opacity="0.95" />
        <line x1="257" y1="342" x2="257" y2="394" stroke="#d97706" strokeWidth="1.2" />
        <rect x="226" y="222" width="58" height="48" fill="#fcd34d" opacity="0.95" />
        <line x1="255" y1="222" x2="255" y2="270" stroke="#d97706" strokeWidth="1.2" />
        <rect x="402" y="222" width="58" height="48" fill="#fcd34d" opacity="0.95" />
        <line x1="431" y1="222" x2="431" y2="270" stroke="#d97706" strokeWidth="1.2" />
        {/* warm glow halos */}
        <rect x="222" y="338" width="70" height="60" fill="rgba(252,211,77,0.12)" className="blink" />
        <rect x="218" y="218" width="66" height="56" fill="rgba(252,211,77,0.12)" className="blink-delayed" />
        <rect x="398" y="218" width="66" height="56" fill="rgba(252,211,77,0.12)" className="blink" />
      </motion.g>

      {/* ===== scaffolding (fades at delivery) ===== */}
      <motion.g style={{ opacity: scaffold }} stroke="rgba(251,191,36,0.55)" strokeWidth="2">
        <line x1="150" y1="170" x2="150" y2="412" />
        <line x1="162" y1="170" x2="162" y2="412" />
        <line x1="538" y1="170" x2="538" y2="412" />
        <line x1="550" y1="170" x2="550" y2="412" />
        <line x1="146" y1="200" x2="166" y2="200" strokeWidth="1.4" />
        <line x1="146" y1="260" x2="166" y2="260" strokeWidth="1.4" />
        <line x1="146" y1="320" x2="166" y2="320" strokeWidth="1.4" />
        <line x1="146" y1="380" x2="166" y2="380" strokeWidth="1.4" />
        <line x1="534" y1="200" x2="554" y2="200" strokeWidth="1.4" />
        <line x1="534" y1="260" x2="554" y2="260" strokeWidth="1.4" />
        <line x1="534" y1="320" x2="554" y2="320" strokeWidth="1.4" />
        <line x1="534" y1="380" x2="554" y2="380" strokeWidth="1.4" />
      </motion.g>

      {/* ===== crane (leaves at delivery) ===== */}
      <motion.g style={{ opacity: craneO, x: craneX }}>
        <rect x="608" y="140" width="16" height="280" fill="#101d33" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2" />
        <line x1="608" y1="170" x2="624" y2="190" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <line x1="624" y1="170" x2="608" y2="190" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <line x1="608" y1="240" x2="624" y2="260" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <line x1="624" y1="240" x2="608" y2="260" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <line x1="608" y1="310" x2="624" y2="330" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <line x1="624" y1="310" x2="608" y2="330" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <rect x="470" y="122" width="230" height="14" fill="#101d33" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2" />
        <rect x="676" y="136" width="26" height="20" fill="#16283f" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
        <polygon points="608,140 624,140 616,104" fill="#101d33" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2" />
        {/* beacon */}
        <circle cx="616" cy="94" r="5" fill="#fcd34d" className="beacon" />
        <circle cx="616" cy="94" r="10" fill="rgba(252,211,77,0.25)" className="beacon" />
        {/* cable + load */}
        <g className="crane-swing">
          <g className="block-hoist">
            <line x1="560" y1="136" x2="560" y2="252" stroke="rgba(226,232,240,0.7)" strokeWidth="1.5" />
            <path d="M 548 252 h 24 M 548 252 l 4 -10 h 16 l 4 10" fill="none" stroke="rgba(226,232,240,0.7)" strokeWidth="2" />
            <rect x="540" y="262" width="40" height="24" fill="#16283f" stroke="#f59e0b" strokeWidth="1.4" />
            <line x1="540" y1="270" x2="580" y2="270" stroke="rgba(245,158,11,0.4)" strokeWidth="1" />
            <line x1="540" y1="278" x2="580" y2="278" stroke="rgba(245,158,11,0.4)" strokeWidth="1" />
          </g>
        </g>
      </motion.g>

      {/* ===== finishing: trees + walkway ===== */}
      <motion.g style={{ opacity: finish, scale: finish, transformOrigin: '50% 100%' }}>
        {/* left tree */}
        <rect x="106" y="356" width="8" height="64" fill="#16283f" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
        <circle cx="110" cy="336" r="26" fill="#12301f" stroke="rgba(52,211,153,0.4)" strokeWidth="1" />
        <circle cx="90" cy="350" r="16" fill="#12301f" stroke="rgba(52,211,153,0.35)" strokeWidth="1" />
        <circle cx="132" cy="352" r="15" fill="#12301f" stroke="rgba(52,211,153,0.35)" strokeWidth="1" />
        {/* right tree */}
        <rect x="566" y="356" width="8" height="64" fill="#16283f" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
        <circle cx="570" cy="336" r="26" fill="#12301f" stroke="rgba(52,211,153,0.4)" strokeWidth="1" />
        <circle cx="590" cy="350" r="16" fill="#12301f" stroke="rgba(52,211,153,0.35)" strokeWidth="1" />
        <circle cx="550" cy="352" r="15" fill="#12301f" stroke="rgba(52,211,153,0.35)" strokeWidth="1" />
        {/* walkway */}
        <rect x="314" y="420" width="52" height="10" fill="#16283f" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <rect x="324" y="430" width="32" height="10" fill="#16283f" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <rect x="330" y="440" width="20" height="8" fill="#16283f" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
      </motion.g>

      {/* level markers */}
      <text x="140" y="446" fontSize="10" fill="rgba(251,191,36,0.7)" fontFamily="monospace">مستوى +0.00</text>
      <text x="140" y="180" fontSize="10" fill="rgba(251,191,36,0.7)" fontFamily="monospace">+6.40</text>
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
      <div className="sticky top-0 h-screen overflow-hidden night-sky">
        {/* stars */}
        {STARS.map((s, i) => (
          <span
            key={i}
            className={`absolute rounded-full bg-slate-100 ${s.cls}`}
            style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size }}
          />
        ))}
        {/* moon */}
        <div className="absolute top-14 right-[8%] moon-drift">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-amber-100 via-yellow-50 to-slate-300 shadow-[0_0_60px_rgba(252,211,77,0.35)]" />
        </div>
        {/* fog */}
        <div className="absolute bottom-28 inset-x-0 h-40 fog-drift bg-gradient-to-t from-transparent via-amber-200/5 to-transparent blur-2xl" />
        {/* horizon glow */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-amber-500/8 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center gap-6 md:gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Text */}
            <div>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300 text-xs font-bold"
              >
                <Compass className="w-3.5 h-3.5" />
                وِجْهة — منصة إدارة المشاريع الإنشائية
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={1}
                className="mt-6 font-serif-ar text-4xl md:text-6xl xl:text-7xl font-bold leading-[1.2] text-white"
              >
                شاهد فيلتك
                <span className="block bg-gradient-to-l from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                  تُبنى أمامك…
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={2}
                className="mt-5 text-sm md:text-base text-slate-400 leading-relaxed max-w-md"
              >
                مرّر للأسفل… وستنهض الفيلا طابقاً طابقاً: أساسات، أعمدة، جدران، سقف، ثم تضيء نوافذها.
                هكذا تدير وِجْهة مشروعك — مرحلة مرحلة، من الحفر حتى التسليم.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={3}
                className="mt-7 flex flex-col sm:flex-row items-stretch gap-3"
              >
                <button
                  onClick={() => navigate('/login')}
                  className="px-7 py-3.5 bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl text-sm font-black transition shadow-xl shadow-amber-600/25 hover:-translate-y-0.5"
                >
                  ادخل إلى موقع العمل
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                </button>
                <a
                  href="#modules"
                  onClick={(e) => { e.preventDefault(); document.querySelector('#modules')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="px-7 py-3.5 border border-amber-400/30 hover:border-amber-300/60 text-amber-300 rounded-2xl text-sm font-bold transition hover:-translate-y-0.5 text-center"
                >
                  استعرض الأجنحة
                </a>
              </motion.div>
            </div>

            {/* Scene + stage meter */}
            <div>
              <div className="relative rounded-3xl border border-amber-400/15 bg-[#070d1c]/60 backdrop-blur-sm p-3 md:p-5 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-amber-400/40 to-transparent" />
                <VillaBuild progress={scrollYProgress} />
              </div>

              {/* stage label + progress */}
              <div className="mt-4 flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-amber-400 beacon shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-bold text-amber-300">{BUILD_STAGES[stage]}</span>
                    <span className="font-mono text-slate-500">
                      <motion.span>{progressPct}</motion.span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-l from-amber-400 to-orange-500"
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
    <div ref={ref} className="text-center border border-amber-400/15 bg-[#0a1428]/70 rounded-2xl px-3 py-5 backdrop-blur-sm">
      <div className="text-3xl md:text-4xl font-black text-amber-300 font-mono tabular-nums">
        {display.toLocaleString('en-US')}
        <span className="text-sm text-amber-400"> {suffix}</span>
      </div>
      <div className="mt-1.5 text-[10px] text-slate-400 font-semibold">{label}</div>
    </div>
  );
};

const Corners = () => (
  <>
    <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400/50 rounded-tr" />
    <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400/50 rounded-tl" />
    <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400/50 rounded-br" />
    <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400/50 rounded-bl" />
  </>
);

const ContactForm = () => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-3xl p-10 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">شكراً لتواصلك معنا</h3>
        <p className="text-sm text-slate-400">تم استلام رسالتك بنجاح، وسيتواصل معك فريقنا في أقرب وقت.</p>
        <button
          onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }}
          className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
        >
          إرسال رسالة أخرى
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1.5">الاسم الكامل</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="م. محمد خالد"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-400 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1.5">البريد الإلكتروني</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="name@company.com"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-400 outline-none transition"
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-bold text-slate-300 mb-1.5">رسالتك</label>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="كيف يمكننا مساعدتك؟"
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-400 outline-none transition resize-none"
        />
      </div>
      <button
        type="submit"
        className="w-full px-6 py-3.5 bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition shadow-lg shadow-amber-600/20"
      >
        <Send className="w-4 h-4" />
        إرسال الرسالة
      </button>
    </form>
  );
};

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  React.useEffect(() => {
    if (user) navigate(ROLE_LANDING[user.role] || '/dashboard', { replace: true });
  }, [user, navigate]);

  const navLinks = [
    { href: '#modules', label: 'الأجنحة' },
    { href: '#phases', label: 'مراحل التنفيذ' },
    { href: '#security', label: 'حراسة الموقع' },
    { href: '#faq', label: 'الأسئلة الشائعة' },
    { href: '#contact', label: 'تواصل معنا' },
  ];

  const scrollTo = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070d1c] text-slate-100 overflow-x-hidden">
      {/* ===== Navbar ===== */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-amber-400/10 bg-[#070d1c]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-xl border border-amber-400/40" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-amber-400" />
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-white leading-tight truncate">
                وِجْهة <span className="text-amber-300 font-mono text-sm">|</span> QB
              </h1>
              <p className="text-[10px] text-slate-500 font-mono truncate" dir="ltr">construction · architecture · finance</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => scrollTo(e, l.href)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-amber-300 hover:bg-amber-500/5 transition"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-amber-600/20 hidden sm:block"
            >
              دخول المهندسين
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-xl transition"
              aria-label="القائمة"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-amber-400/10 bg-[#070d1c]/95 backdrop-blur-xl animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => scrollTo(e, l.href)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-amber-300 hover:bg-amber-500/5 transition"
                >
                  {l.label}
                </a>
              ))}
              <button
                onClick={() => { setMobileOpen(false); navigate('/login'); }}
                className="w-full mt-2 px-4 py-3 bg-gradient-to-l from-amber-500 to-orange-600 text-white rounded-xl text-sm font-black transition"
              >
                دخول المهندسين
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ===== Scroll-building hero ===== */}
      <BuildHero />

      {/* ===== Stats ===== */}
      <section className="relative py-14 border-t border-amber-400/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCounter value={58} suffix="بند" label="في تقرير الإنجاز" />
          <StatCounter value={9} suffix="دفعة" label="مستحقات مرحلية" />
          <StatCounter value={11} suffix="وحدة" label="أجنحة متكاملة" />
          <StatCounter value={5} suffix="أدوار" label="بصلاحيات RBAC" />
        </div>
      </section>

      {/* ===== Modules ===== */}
      <section id="modules" className="relative py-16 md:py-24 scroll-mt-20 border-t border-amber-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 text-amber-300 text-xs font-bold mb-4"
            >
              <Layers className="w-3.5 h-3.5" />
              الأجنحة
            </motion.div>
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={1}
              className="font-serif-ar text-3xl md:text-5xl font-bold text-white"
            >
              أحد عشر جناحاً <span className="text-amber-300">للمشروع</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={2}
              className="mt-4 text-slate-400 max-w-xl mx-auto text-sm md:text-base"
            >
              تغطي دورة حياة المشروع كاملة — من التصميم والحصر حتى الاعتماد المالي النهائي.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.code}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                custom={i % 3}
                className="relative group rounded-2xl border border-amber-400/10 bg-[#0a1428]/70 p-6 hover:border-amber-400/40 hover:bg-[#0d1b31] transition-all duration-300 cursor-default overflow-hidden"
              >
                <Corners />
                <span className="absolute top-3 left-4 font-mono text-[10px] tracking-widest text-amber-500/40 group-hover:text-amber-300/80 transition">
                  {f.code}
                </span>
                <div className="w-12 h-12 mb-4 rounded-xl border border-amber-400/20 bg-amber-500/5 text-amber-300 flex items-center justify-center group-hover:bg-amber-400/10 transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Phases ===== */}
      <section id="phases" className="relative py-16 md:py-24 scroll-mt-20 border-t border-amber-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 text-amber-300 text-xs font-bold mb-4"
            >
              <Ruler className="w-3.5 h-3.5" />
              مراحل التنفيذ
            </motion.div>
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={1}
              className="font-serif-ar text-3xl md:text-5xl font-bold text-white"
            >
              مثلما رأيتها تُبنى… <span className="text-amber-300">تدار بهذا الترتيب</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
            <div className="hidden md:block absolute top-[2.4rem] inset-x-8 h-0.5 dash-line" />
            {PHASES.map((p, i) => (
              <motion.div
                key={p.phase}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                custom={i}
                className="relative text-center bg-[#0a1428]/70 border border-amber-400/10 rounded-2xl p-6 hover:border-amber-400/40 transition"
              >
                <div className="relative w-12 h-12 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-xl border border-amber-400/30 bg-amber-500/5" />
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                    <p.icon className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0d1b31] border border-amber-400/40 flex items-center justify-center font-mono text-[10px] font-bold text-amber-300">
                    {p.phase}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{p.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Security ===== */}
      <section id="security" className="relative py-16 md:py-24 scroll-mt-20 border-t border-amber-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-amber-400/15 bg-[#0a1428]/60 p-8 md:p-12 overflow-hidden">
            <Corners />
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-amber-500/60 via-yellow-400/60 to-orange-500/60" />

            <div className="text-center mb-12">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 text-amber-300 text-xs font-bold mb-4"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                حراسة الموقع — بياناتك
              </motion.div>
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={1}
                className="font-serif-ar text-3xl md:text-5xl font-bold text-white"
              >
                موقع لا يُنسى… <span className="text-amber-300">لأن بياناته محروسة</span>
              </motion.h2>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={2}
                className="mt-4 text-slate-400 max-w-xl mx-auto text-sm md:text-base"
              >
                أربع طبقات حماية: أبراج مراقبة، أسوار، بوابات، وكاميرات — لكل وصول وكل عملية.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SECURITY_POINTS.map((s, i) => (
                <motion.div
                  key={s.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-40px' }}
                  custom={i}
                  className="bg-[#0d1b31]/70 border border-amber-400/15 rounded-2xl p-6 hover:border-amber-400/40 transition"
                >
                  <div className="w-11 h-11 mb-4 rounded-xl border border-amber-400/25 bg-amber-500/5 text-amber-300 flex items-center justify-center">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1.5">{s.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="relative py-16 md:py-24 scroll-mt-20 border-t border-amber-400/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 text-amber-300 text-xs font-bold mb-4"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              الأسئلة الشائعة
            </motion.div>
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={1}
              className="font-serif-ar text-3xl md:text-4xl font-bold text-white"
            >
              استفسارات المكاتب والمقاولين
            </motion.h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-30px' }}
                custom={i % 3}
                className={`relative rounded-2xl border transition overflow-hidden ${openFaq === i ? 'border-amber-400/40 bg-[#0d1b31]/70' : 'border-amber-400/10 bg-[#0a1428]/50 hover:border-amber-400/30'}`}
              >
                {openFaq === i && <Corners />}
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-right"
                >
                  <span className="flex items-center gap-3">
                    <span className={`font-mono text-[10px] ${openFaq === i ? 'text-amber-300' : 'text-slate-600'}`}>
                      Q-{String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-bold text-white text-sm md:text-base">{f.q}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-amber-300' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-xs md:text-sm text-slate-400 leading-relaxed border-t border-amber-400/10 pt-4">{f.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact ===== */}
      <section id="contact" className="relative py-16 md:py-24 scroll-mt-20 border-t border-amber-400/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 text-amber-300 text-xs font-bold mb-4"
              >
                <Compass className="w-3.5 h-3.5" />
                تواصل معنا
              </motion.div>
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={1}
                className="font-serif-ar text-3xl md:text-4xl font-bold text-white leading-tight"
              >
                عندك مشروع على الورق؟
                <span className="block bg-gradient-to-l from-amber-200 to-orange-400 bg-clip-text text-transparent">
                  خليه يطلع للواقع…
                </span>
              </motion.h2>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={2}
                className="mt-4 text-slate-400 text-sm leading-relaxed max-w-md"
              >
                فريقنا جاهز لتجهيز النظام لمكتبك أو شركتك الإنشائية — راسلنا وسنعود خلال يوم عمل واحد.
              </motion.p>

              <div className="mt-8 space-y-4 text-sm">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-10 h-10 border border-amber-400/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">البريد الإلكتروني</div>
                    info@qb-construction.sa
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-10 h-10 border border-amber-400/20 rounded-xl flex items-center justify-center">
                    <Phone className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">الهاتف</div>
                    +966 5X XXX XXXX
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-10 h-10 border border-amber-400/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">الموقع</div>
                    الرياض، المملكة العربية السعودية
                  </div>
                </div>
              </div>
            </div>

            <div className="relative rounded-3xl border border-amber-400/15 bg-[#0a1428]/60 p-6 md:p-8">
              <Corners />
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="relative py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-amber-400/25 bg-gradient-to-br from-[#0d1b31] via-[#0a1428] to-[#101d33] p-10 md:p-16 text-center">
            <Corners />
            <div className="absolute -top-16 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px]" />
            <div className="absolute -bottom-16 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-[90px]" />
            <div className="relative">
              <div className="w-14 h-14 mx-auto mb-6 rounded-2xl border border-amber-400/40 bg-amber-500/5 flex items-center justify-center">
                <Moon className="w-7 h-7 text-amber-300" />
              </div>
              <h2 className="font-serif-ar text-3xl md:text-5xl font-bold text-white leading-tight">
                المدينة لا تنام…
                <span className="block bg-gradient-to-l from-amber-200 to-orange-400 bg-clip-text text-transparent">ومشروعك يُبنى الآن</span>
              </h2>
              <p className="mt-5 text-slate-400 text-sm md:text-base max-w-lg mx-auto">
                ابدأ بإدارة مشروعك بالطريقة التي يستحقها — بدقة حساب، وجودة تنفيذ، وبيانات محصّنة.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition shadow-xl shadow-amber-600/25 hover:-translate-y-0.5"
                >
                  دخول المهندسين
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <a
                  href="#modules"
                  onClick={(e) => scrollTo(e, '#modules')}
                  className="w-full sm:w-auto px-8 py-4 border border-amber-400/30 hover:border-amber-300/60 text-amber-300 rounded-2xl text-sm font-bold transition hover:-translate-y-0.5"
                >
                  راجع الأجنحة
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-amber-400/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center">
              <div className="absolute inset-0 rounded-xl border border-amber-400/40" />
              <Building2 className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">وِجْهة QB — إدارة المقاولات المتكاملة</div>
              <div className="text-[10px] text-slate-500 font-mono" dir="ltr">© 2026 · QB CONSTRUCTION MANAGEMENT</div>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#modules" onClick={(e) => scrollTo(e, '#modules')} className="hover:text-amber-300 transition">الأجنحة</a>
            <a href="#phases" onClick={(e) => scrollTo(e, '#phases')} className="hover:text-amber-300 transition">مراحل التنفيذ</a>
            <a href="#security" onClick={(e) => scrollTo(e, '#security')} className="hover:text-amber-300 transition">حراسة الموقع</a>
            <a href="#contact" onClick={(e) => scrollTo(e, '#contact')} className="hover:text-amber-300 transition">تواصل معنا</a>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <span className="text-emerald-400">RLS</span>
            <span>·</span>
            <span className="text-amber-300">RBAC</span>
            <span>·</span>
            <span className="text-cyan-300">JWT</span>
            <span>·</span>
            <span>HTTPS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;