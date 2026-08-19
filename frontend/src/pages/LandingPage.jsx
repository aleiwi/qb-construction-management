import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LANDING } from '../config/roleAccess';
import { motion, useInView } from 'framer-motion';
import {
  Building2, FolderKanban, FileText, FileSignature, Wallet, ShieldCheck,
  HardHat, UsersRound, BarChart3, TrendingUp, History, UserCircle,
  Lock, KeyRound, Fingerprint, Database, CheckCircle2, ChevronDown, ArrowLeft,
  Menu, X, Mail, Phone, MapPin, Send, Compass, Ruler, DraftingCompass,
  Layers, MessageSquare, HardHat as HardHatIcon,
} from 'lucide-react';

const FEATURES = [
  { icon: FolderKanban, code: 'MOD-01', title: 'المشاريع والمباني', desc: 'تقسيم المشاريع إلى مباني ومراحل بأوزان نسبية دقيقة لمتابعة التنفيذ.' },
  { icon: FileText, code: 'MOD-02', title: 'حصر الكميات BOQ (CAD)', desc: 'استخراج العناصر من ملفات DWG/DXF تلقائياً مع مراجعة يدوية للمصنفات.' },
  { icon: FileSignature, code: 'MOD-03', title: 'العقود والتعاقدات', desc: 'ربط المقاولين بالمباني وتتبع قيم العقود ونسب الإنجاز والحالات.' },
  { icon: HardHatIcon, code: 'MOD-04', title: 'إدارة المقاولين', desc: 'سجل موحد للمقاولين مع عزل تام لبيانات كل مقاول (Row-Level Security).' },
  { icon: Wallet, code: 'MOD-05', title: 'المستحقات والضمان', desc: 'دفعات مرحلية مشروطة بمراجعة الجودة مع احتجاز الضمانات وتحريرها.' },
  { icon: ShieldCheck, code: 'MOD-06', title: 'فحوصات الجودة QC', desc: 'فحوصات إلزامية لكل مرحلة قبل اعتماد أي مستحقات مالية.' },
  { icon: UsersRound, code: 'MOD-07', title: 'الموارد البشرية HR', desc: 'الموظفون وسجل الحضور والرواتب الشهرية الثابتة.' },
  { icon: BarChart3, code: 'MOD-08', title: 'التقارير و KPIs', desc: 'مؤشرات أداء عامة ورسوم بيانية عبر جميع الوحدات.' },
  { icon: TrendingUp, code: 'MOD-09', title: 'نسب الإنجاز الشامل', desc: 'تقرير دوري شامل (58 بنداً + 9 دفعات) قابل للطباعة والتصدير PDF.' },
  { icon: History, code: 'MOD-10', title: 'سجل التتبع (Audit Log)', desc: 'سجل كامل للعمليات المالية الحساسة: من نفّذها ومتى والقيم قبل/بعد.' },
  { icon: UserCircle, code: 'MOD-11', title: 'الملف الشخصي', desc: 'إدارة حسابك وتغيير كلمة المرور بأمان تام.' },
];

const SECURITY_POINTS = [
  { icon: KeyRound, title: 'الأعمدة — صلاحيات RBAC', desc: 'خمسة أدوار وظيفية تتحكم في كل صفحة وزر، كالأعمدة الحاملة للهيكل.' },
  { icon: Fingerprint, title: 'الجدران — عزل البيانات RLS', desc: 'المقاول يرى عقوده ومستحقاته فقط؛ والمهندس مقيد بمشاريع حسابه.' },
  { icon: Lock, title: 'الأساس — JWT وحماية الدخول', desc: 'جلسات موثقة مع قفل الحساب بعد المحاولات الفاشلة و HTTPS إجباري.' },
  { icon: Database, title: 'الرافعة — سجل تدقيق', desc: 'كل اعتماد دفعة أو تعديل سعر موثق: المنفذ، القيمة قبل وبعد.' },
];

const PHASES = [
  { icon: DraftingCompass, phase: '01', title: 'التصميم والحصر', desc: 'رفع ملفات DWG/DXF واستخراج عناصر BOQ تلقائياً وتصنيفها.' },
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

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: 'easeOut' } }),
};

/* CAD-style corner brackets for cards */
const Corners = () => (
  <>
    <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400/60 rounded-tr" />
    <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
    <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/60 rounded-br" />
    <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400/60 rounded-bl" />
  </>
);

const StatCounter = ({ value, suffix, label }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
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
    <div ref={ref} className="text-center border border-dashed border-cyan-500/25 rounded-xl px-3 py-4">
      <div className="text-2xl md:text-3xl font-black text-cyan-300 font-mono tabular-nums">
        {display.toLocaleString('en-US')}
        <span className="text-sm text-amber-400"> {suffix}</span>
      </div>
      <div className="mt-1 text-[10px] text-slate-400 font-semibold">{label}</div>
    </div>
  );
};

/* ===== Animated construction site scene (SVG) ===== */
const ConstructionScene = () => {
  const floors = [0, 1, 2, 3, 4, 5];
  const floorPitch = 46;
  const floorY = (i) => 440 - i * floorPitch; // bottom edge of floor i

  return (
    <svg viewBox="0 0 760 500" className="w-full h-auto select-none" role="img" aria-label="مشهد إنشائي متحرك — رافعة ومبنى قيد الإنشاء">
      {/* sheet frame */}
      <rect x="6" y="6" width="748" height="488" fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="1.5" strokeDasharray="8 6" className="dash-flow" />
      <path d="M 6 6 h 22 M 6 6 v 22" stroke="rgba(56,189,248,0.6)" strokeWidth="2" fill="none" />
      <path d="M 754 6 h -22 M 754 6 v 22" stroke="rgba(56,189,248,0.6)" strokeWidth="2" fill="none" />
      <path d="M 6 494 h 22 M 6 494 v -22" stroke="rgba(56,189,248,0.6)" strokeWidth="2" fill="none" />
      <path d="M 754 494 h -22 M 754 494 v -22" stroke="rgba(56,189,248,0.6)" strokeWidth="2" fill="none" />

      {/* top dimension line */}
      <line x1="70" y1="48" x2="690" y2="48" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      <line x1="70" y1="42" x2="70" y2="54" stroke="rgba(56,189,248,0.6)" strokeWidth="1.2" />
      <line x1="690" y1="42" x2="690" y2="54" stroke="rgba(56,189,248,0.6)" strokeWidth="1.2" />
      <polygon points="70,48 82,44 82,52" fill="rgba(56,189,248,0.6)" />
      <polygon points="690,48 678,44 678,52" fill="rgba(56,189,248,0.6)" />
      <text x="380" y="38" textAnchor="middle" fontSize="12" fill="#67e8f9" fontFamily="monospace">45.00 m</text>

      {/* ground line */}
      <line x1="60" y1="440" x2="700" y2="440" stroke="rgba(56,189,248,0.8)" strokeWidth="1.5" strokeDasharray="10 8" className="dash-flow" />
      <line x1="60" y1="452" x2="700" y2="452" stroke="rgba(125,211,252,0.15)" strokeWidth="1" />

      {/* ===== Crane ===== */}
      {/* tower mast */}
      <rect x="130" y="170" width="20" height="270" fill="#0e2a4a" stroke="rgba(56,189,248,0.9)" strokeWidth="1.5" />
      <line x1="130" y1="195" x2="150" y2="220" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      <line x1="150" y1="195" x2="130" y2="220" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      <line x1="130" y1="245" x2="150" y2="270" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      <line x1="150" y1="245" x2="130" y2="270" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      <line x1="130" y1="295" x2="150" y2="320" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      <line x1="150" y1="295" x2="130" y2="320" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      <line x1="130" y1="345" x2="150" y2="370" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      <line x1="150" y1="345" x2="130" y2="370" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      {/* apex */}
      <polygon points="130,170 150,170 140,132" fill="#0e2a4a" stroke="rgba(56,189,248,0.9)" strokeWidth="1.5" />
      {/* jib + counter jib */}
      <rect x="60" y="150" width="370" height="16" fill="#0e2a4a" stroke="rgba(56,189,248,0.9)" strokeWidth="1.5" />
      <rect x="46" y="150" width="18" height="16" fill="#0e2a4a" stroke="rgba(56,189,248,0.9)" strokeWidth="1.5" />
      <rect x="40" y="166" width="28" height="22" fill="#122f54" stroke="rgba(56,189,248,0.7)" strokeWidth="1.2" />
      {/* tie line to apex */}
      <line x1="80" y1="150" x2="140" y2="132" stroke="rgba(56,189,248,0.5)" strokeWidth="1.2" />
      {/* trolley */}
      <rect x="348" y="146" width="18" height="6" fill="#1a3a5f" stroke="rgba(56,189,248,0.9)" strokeWidth="1.2" />

      {/* pendulum load */}
      <g className="crane-swing">
        <g className="block-hoist">
          <line x1="357" y1="152" x2="357" y2="290" stroke="rgba(226,232,240,0.85)" strokeWidth="1.5" />
          <path d="M 345 290 h 24 M 345 290 l 4 -12 h 16 l 4 12" fill="none" stroke="rgba(226,232,240,0.85)" strokeWidth="2" />
          <rect x="337" y="302" width="40" height="26" fill="#14335c" stroke="#f59e0b" strokeWidth="1.6" />
          <line x1="337" y1="310" x2="377" y2="310" stroke="rgba(245,158,11,0.5)" strokeWidth="1" />
          <line x1="337" y1="318" x2="377" y2="318" stroke="rgba(245,158,11,0.5)" strokeWidth="1" />
        </g>
      </g>

      {/* foundation */}
      <rect x="455" y="440" width="190" height="14" fill="#0e2a4a" stroke="rgba(56,189,248,0.7)" strokeWidth="1.2" />
      <line x1="470" y1="440" x2="470" y2="454" stroke="rgba(56,189,248,0.4)" strokeWidth="1" />
      <line x1="500" y1="440" x2="500" y2="454" stroke="rgba(56,189,248,0.4)" strokeWidth="1" />
      <line x1="530" y1="440" x2="530" y2="454" stroke="rgba(56,189,248,0.4)" strokeWidth="1" />
      <line x1="560" y1="440" x2="560" y2="454" stroke="rgba(56,189,248,0.4)" strokeWidth="1" />
      <line x1="590" y1="440" x2="590" y2="454" stroke="rgba(56,189,248,0.4)" strokeWidth="1" />
      <line x1="620" y1="440" x2="620" y2="454" stroke="rgba(56,189,248,0.4)" strokeWidth="1" />

      {/* ===== Building: floors rise one by one ===== */}
      {floors.map((i) => {
        const bottom = floorY(i);
        const top = bottom - 40;
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.22, type: 'spring', stiffness: 90, damping: 15 }}
          >
            <rect x="470" y={top} width="160" height="40" fill="#0d2240" stroke="rgba(56,189,248,0.75)" strokeWidth="1.5" />
            <rect x="470" y={bottom - 3} width="160" height="3" fill="rgba(56,189,248,0.35)" />
            {[0, 1, 2, 3].map((k) => (
              <rect
                key={k}
                x={480 + k * 36}
                y={top + 8}
                width="24"
                height="20"
                fill="#1b4e6b"
                stroke="rgba(56,189,248,0.3)"
                strokeWidth="0.8"
                className={(k * 7 + i * 3) % 5 === 0 ? 'blink' : ((k * 5 + i * 2) % 7 === 0 ? 'blink-delayed' : '')}
              />
            ))}
          </motion.g>
        );
      })}

      {/* scaffolding on top */}
      <g opacity="0.85">
        <line x1="470" y1="196" x2="470" y2="158" stroke="#f59e0b" strokeWidth="1.6" />
        <line x1="502" y1="196" x2="502" y2="148" stroke="#f59e0b" strokeWidth="1.6" />
        <line x1="534" y1="196" x2="534" y2="158" stroke="#f59e0b" strokeWidth="1.6" />
        <line x1="566" y1="196" x2="566" y2="148" stroke="#f59e0b" strokeWidth="1.6" />
        <line x1="598" y1="196" x2="598" y2="158" stroke="#f59e0b" strokeWidth="1.6" />
        <line x1="630" y1="196" x2="630" y2="158" stroke="#f59e0b" strokeWidth="1.6" />
        <line x1="468" y1="178" x2="632" y2="178" stroke="#f59e0b" strokeWidth="1.4" />
        <line x1="468" y1="162" x2="632" y2="162" stroke="#f59e0b" strokeWidth="1.4" />
      </g>

      {/* vertical dimension (right) */}
      <line x1="694" y1="120" x2="694" y2="436" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      <line x1="688" y1="120" x2="700" y2="120" stroke="rgba(56,189,248,0.6)" strokeWidth="1.2" />
      <line x1="688" y1="436" x2="700" y2="436" stroke="rgba(56,189,248,0.6)" strokeWidth="1.2" />
      <polygon points="694,120 690,132 698,132" fill="rgba(56,189,248,0.6)" />
      <polygon points="694,436 690,424 698,424" fill="rgba(56,189,248,0.6)" />
      <text x="706" y="282" fontSize="12" fill="#67e8f9" fontFamily="monospace">24.00 m</text>

      {/* dimension under building */}
      <line x1="470" y1="468" x2="630" y2="468" stroke="rgba(56,189,248,0.5)" strokeWidth="1" />
      <line x1="470" y1="462" x2="470" y2="474" stroke="rgba(56,189,248,0.6)" strokeWidth="1.2" />
      <line x1="630" y1="462" x2="630" y2="474" stroke="rgba(56,189,248,0.6)" strokeWidth="1.2" />
      <text x="550" y="486" textAnchor="middle" fontSize="12" fill="#67e8f9" fontFamily="monospace">16.00 m</text>

      {/* annotation chips */}
      <g>
        <circle cx="420" cy="130" r="22" fill="none" stroke="rgba(56,189,248,0.6)" strokeWidth="1.2" strokeDasharray="4 4" className="dash-flow" />
        <text x="420" y="134" textAnchor="middle" fontSize="9" fill="#a5f3fc" fontFamily="monospace">R12</text>
        <polyline points="420,152 420,170 470,170" fill="none" stroke="rgba(56,189,248,0.4)" strokeWidth="1" />
      </g>
      <g>
        <rect x="640" y="180" width="78" height="20" fill="#0d2240" stroke="rgba(56,189,248,0.6)" strokeWidth="1.2" strokeDasharray="4 4" className="dash-flow" />
        <text x="649" y="193" fontSize="9" fill="#a5f3fc" fontFamily="monospace">قطاع 45×45</text>
        <line x1="640" y1="200" x2="630" y2="210" stroke="rgba(56,189,248,0.4)" strokeWidth="1" />
      </g>

      {/* level marker */}
      <text x="455" y="436" fontSize="10" fill="#f59e0b" fontFamily="monospace" transform="rotate(-90 455 436)">أرضية +0.00</text>
    </svg>
  );
};

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
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 outline-none transition"
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
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 outline-none transition"
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
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 outline-none transition resize-none"
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

  useEffect(() => {
    if (user) navigate(ROLE_LANDING[user.role] || '/dashboard', { replace: true });
  }, [user, navigate]);

  const navLinks = [
    { href: '#features', label: 'الوحدات' },
    { href: '#phases', label: 'مراحل التنفيذ' },
    { href: '#security', label: 'سلامة البيانات' },
    { href: '#faq', label: 'الأسئلة الشائعة' },
    { href: '#contact', label: 'تواصل معنا' },
  ];

  const scrollTo = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bp-bg text-slate-100 overflow-x-hidden bp-grid">
      <div className="absolute inset-0 bp-grid-fine pointer-events-none" />

      {/* ===== Navbar ===== */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-cyan-500/15 bg-[#081426]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-xl border border-cyan-400/50" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
              <Building2 className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-white leading-tight truncate">
                وِجْهَة <span className="text-cyan-300 font-mono text-sm">|</span> QB
              </h1>
              <p className="text-[10px] text-slate-500 font-mono truncate" dir="ltr">architecture · quantity · construction</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => scrollTo(e, l.href)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/5 transition"
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
          <div className="md:hidden border-t border-cyan-500/15 bg-[#081426]/95 backdrop-blur-xl animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => scrollTo(e, l.href)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/5 transition"
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

      {/* ===== Hero ===== */}
      <section className="relative pt-28 md:pt-32 pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          {/* Text column */}
          <div className="relative z-10">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-dashed border-cyan-500/40 bg-cyan-500/5 text-cyan-300 text-xs font-bold mb-6"
            >
              <Compass className="w-3.5 h-3.5" />
              منصة معمارية وإنشائية لإدارة المشاريع
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="text-4xl md:text-5xl xl:text-6xl font-black leading-[1.15] text-white"
            >
              من أول خطٍ في
              <span className="block bg-gradient-to-l from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                المخطط الهندسي
              </span>
              <span className="block text-2xl md:text-3xl xl:text-4xl font-extrabold text-slate-300 mt-3">
                إلى آخر لبنة في التنفيذ…
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-6 text-sm md:text-base text-slate-400 leading-relaxed max-w-lg"
            >
              وِجْهة نظام إدارة المقاولات المتكامل: حصر كميات من ملفات CAD، عقود ومقاولين،
              فحوصات جودة، واعتماد مالي — كلها في هيكل واحد محكم، بدقة المهندس وسلامة المنشأة.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-8 flex flex-col sm:flex-row items-stretch gap-4"
            >
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition shadow-xl shadow-amber-600/25 hover:-translate-y-0.5"
              >
                ابدأ مشروعك الآن
                <ArrowLeft className="w-4 h-4" />
              </button>
              <a
                href="#features"
                onClick={(e) => scrollTo(e, '#features')}
                className="px-8 py-4 border border-dashed border-cyan-500/40 hover:border-cyan-400/70 text-cyan-300 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition hover:-translate-y-0.5 bg-cyan-500/5"
              >
                <Layers className="w-4 h-4" />
                استعرض الوحدات
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <StatCounter value={58} suffix="بند" label="في تقرير الإنجاز" />
              <StatCounter value={9} suffix="دفعة" label="مستحقات مرحلية" />
              <StatCounter value={11} suffix="وحدة" label="وحدات متكاملة" />
              <StatCounter value={5} suffix="أدوار" label="بصلاحيات RBAC" />
            </motion.div>
          </div>

          {/* Scene column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            <ConstructionScene />
          </motion.div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="relative py-16 md:py-24 scroll-mt-20 border-t border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-dashed border-cyan-500/40 bg-cyan-500/5 text-cyan-300 text-xs font-bold mb-4"
            >
              <Ruler className="w-3.5 h-3.5" />
              الوحدات
            </motion.div>
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={1}
              className="text-3xl md:text-5xl font-black text-white"
            >
              أجنحة المشروع <span className="text-cyan-300 font-mono text-2xl md:text-4xl">/</span> إحدى عشرة وحدة
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
                className="relative group rounded-2xl border border-cyan-500/15 bg-[#0b1c36]/70 p-6 hover:border-cyan-400/40 hover:bg-[#0d2040] transition-all duration-300 cursor-default overflow-hidden"
              >
                <Corners />
                <span className="absolute top-3 left-4 font-mono text-[10px] tracking-widest text-cyan-500/50 group-hover:text-cyan-300/80 transition">
                  {f.code}
                </span>
                <div className="w-12 h-12 mb-4 rounded-xl border border-cyan-500/25 bg-cyan-500/5 text-cyan-300 flex items-center justify-center group-hover:border-amber-400/50 group-hover:text-amber-300 transition-colors">
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
      <section id="phases" className="relative py-16 md:py-24 scroll-mt-20 border-t border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-300 text-xs font-bold mb-4"
            >
              <DraftingCompass className="w-3.5 h-3.5" />
              مراحل التنفيذ
            </motion.div>
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={1}
              className="text-3xl md:text-5xl font-black text-white"
            >
              من الجدول الزمني… إلى التسليم
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
                className="relative text-center bg-[#0b1c36]/70 border border-cyan-500/15 rounded-2xl p-6 hover:border-amber-400/40 transition"
              >
                <div className="relative w-12 h-12 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-xl border border-amber-400/40 bg-amber-500/5" />
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                    <p.icon className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0d2040] border border-amber-400/50 flex items-center justify-center font-mono text-[10px] font-bold text-amber-300">
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
      <section id="security" className="relative py-16 md:py-24 scroll-mt-20 border-t border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-cyan-500/20 bg-[#0b1c36]/60 p-8 md:p-12 overflow-hidden">
            <Corners />
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-cyan-500/60 via-amber-400/60 to-orange-500/60" />

            <div className="text-center mb-12">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-300 text-xs font-bold mb-4"
              >
                <HardHatIcon className="w-3.5 h-3.5" />
                سلامة المنشأة — بياناتك
              </motion.div>
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={1}
                className="text-3xl md:text-5xl font-black text-white"
              >
                هيكل حماية <span className="text-amber-300">إنشائي</span>
              </motion.h2>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={2}
                className="mt-4 text-slate-400 max-w-xl mx-auto text-sm md:text-base"
              >
                كل ركيزة في النظام مبنية كعنصر إنشائي: عمود، جدار، أساس، ورافعة — يحمل سلامة بياناتك.
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
                  className="bg-[#0d2040]/70 border border-amber-500/15 rounded-2xl p-6 hover:border-amber-400/40 transition"
                >
                  <div className="w-11 h-11 mb-4 rounded-xl border border-amber-400/30 bg-amber-500/5 text-amber-300 flex items-center justify-center">
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
      <section id="faq" className="relative py-16 md:py-24 scroll-mt-20 border-t border-cyan-500/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-dashed border-cyan-500/40 bg-cyan-500/5 text-cyan-300 text-xs font-bold mb-4"
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
              className="text-3xl md:text-4xl font-black text-white"
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
                className={`relative rounded-2xl border transition overflow-hidden ${openFaq === i ? 'border-cyan-400/40 bg-[#0d2040]/70' : 'border-cyan-500/15 bg-[#0b1c36]/50 hover:border-cyan-400/30'}`}
              >
                {openFaq === i && <Corners />}
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-right"
                >
                  <span className="flex items-center gap-3">
                    <span className={`font-mono text-[10px] ${openFaq === i ? 'text-cyan-300' : 'text-slate-600'}`}>
                      Q-{String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-bold text-white text-sm md:text-base">{f.q}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-cyan-300' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-xs md:text-sm text-slate-400 leading-relaxed border-t border-cyan-500/10 pt-4">{f.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact ===== */}
      <section id="contact" className="relative py-16 md:py-24 scroll-mt-20 border-t border-cyan-500/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-300 text-xs font-bold mb-4"
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
                className="text-3xl md:text-4xl font-black text-white leading-tight"
              >
                عندك مشروع على الورق؟
                <span className="block bg-gradient-to-l from-amber-300 to-orange-400 bg-clip-text text-transparent">
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
                  <div className="w-10 h-10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">البريد الإلكتروني</div>
                    info@qb-construction.sa
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-10 h-10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Phone className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">الهاتف</div>
                    +966 5X XXX XXXX
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-10 h-10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">الموقع</div>
                    الرياض، المملكة العربية السعودية
                  </div>
                </div>
              </div>
            </div>

            <div className="relative rounded-3xl border border-cyan-500/20 bg-[#0b1c36]/60 p-6 md:p-8">
              <Corners />
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="relative py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-dashed border-amber-400/30 bg-gradient-to-br from-[#0d2040] via-[#0b1c36] to-[#122f54] p-10 md:p-16 text-center">
            <Corners />
            <div className="absolute -top-16 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px]" />
            <div className="absolute -bottom-16 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[90px]" />
            <div className="relative">
              <div className="w-14 h-14 mx-auto mb-6 rounded-2xl border border-amber-400/40 bg-amber-500/5 flex items-center justify-center">
                <HardHatIcon className="w-7 h-7 text-amber-300" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                جاهز نبدأ <span className="bg-gradient-to-l from-amber-300 to-orange-400 bg-clip-text text-transparent">صبّ الخرسانة</span>؟
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
                  href="#features"
                  onClick={(e) => scrollTo(e, '#features')}
                  className="w-full sm:w-auto px-8 py-4 border border-dashed border-cyan-500/40 hover:border-cyan-400/70 text-cyan-300 rounded-2xl text-sm font-bold transition hover:-translate-y-0.5"
                >
                  راجع الوحدات
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-cyan-500/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center">
              <div className="absolute inset-0 rounded-xl border border-cyan-400/50" />
              <Building2 className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">وِجْهَة QB — إدارة المقاولات المتكاملة</div>
              <div className="text-[10px] text-slate-500 font-mono" dir="ltr">© 2026 · QB CONSTRUCTION MANAGEMENT</div>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#features" onClick={(e) => scrollTo(e, '#features')} className="hover:text-cyan-300 transition">الوحدات</a>
            <a href="#phases" onClick={(e) => scrollTo(e, '#phases')} className="hover:text-cyan-300 transition">مراحل التنفيذ</a>
            <a href="#security" onClick={(e) => scrollTo(e, '#security')} className="hover:text-cyan-300 transition">سلامة البيانات</a>
            <a href="#contact" onClick={(e) => scrollTo(e, '#contact')} className="hover:text-cyan-300 transition">تواصل معنا</a>
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