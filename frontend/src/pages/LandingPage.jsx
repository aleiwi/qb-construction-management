import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LANDING } from '../config/roleAccess';
import { motion, useInView } from 'framer-motion';
import {
  Building2, FolderKanban, FileText, FileSignature, Wallet, ShieldCheck,
  HardHat, UsersRound, BarChart3, TrendingUp, History, UserCircle, ScrollText,
  Lock, KeyRound, Fingerprint, Database, CheckCircle2, ChevronDown, ArrowLeft,
  Menu, X, Mail, Phone, MapPin, Send, Sparkles, Rocket, Workflow, Landmark,
  Globe, MessageSquare, Quote, Layers,
} from 'lucide-react';

const FEATURES = [
  { icon: FolderKanban, title: 'المشاريع والمباني', desc: 'تقسيم المشاريع إلى مباني ومراحل بأوزان نسبية دقيقة لمتابعة التنفيذ.', color: 'blue' },
  { icon: FileText, title: 'حصر الكميات BOQ (CAD)', desc: 'استخراج العناصر من ملفات DWG/DXF تلقائياً مع مراجعة يدوية للمصنفات.', color: 'indigo' },
  { icon: FileSignature, title: 'العقود والتعاقدات', desc: 'ربط المقاولين بالمباني وتتبع قيم العقود ونسب الإنجاز والحالات.', color: 'emerald' },
  { icon: HardHat, title: 'إدارة المقاولين', desc: 'سجل موحد للمقاولين مع عزل تام لبيانات كل مقاول (Row-Level Security).', color: 'amber' },
  { icon: Wallet, title: 'المستحقات والضمان', desc: 'دفعات مرحلية مشروطة بمراجعة الجودة مع احتجاز الضمانات وتحريرها.', color: 'purple' },
  { icon: ShieldCheck, title: 'فحوصات الجودة QC', desc: 'فحوصات إلزامية لكل مرحلة قبل اعتماد أي مستحقات مالية.', color: 'teal' },
  { icon: UsersRound, title: 'الموارد البشرية HR', desc: 'الموظفون وسجل الحضور والرواتب الشهرية الثابتة.', color: 'rose' },
  { icon: BarChart3, title: 'التقارير و KPIs', desc: 'مؤشرات أداء عامة ورسوم بيانية عبر جميع الوحدات.', color: 'cyan' },
  { icon: TrendingUp, title: 'نسب الإنجاز الشامل', desc: 'تقرير دوري شامل (58 بنداً + 9 دفعات) قابل للطباعة والتصدير PDF.', color: 'amber' },
  { icon: History, title: 'سجل التتبع (Audit Log)', desc: 'سجل كامل للعمليات المالية الحساسة: من نفّذها ومتى والقيم قبل/بعد.', color: 'orange' },
  { icon: UserCircle, title: 'الملف الشخصي', desc: 'إدارة حسابك وتغيير كلمة المرور بأمان تام.', color: 'teal' },
];

const COLOR_MAP = {
  blue: { card: 'border-blue-500/20 bg-blue-500/5', icon: 'bg-blue-500/10 text-blue-400', glow: 'hover:shadow-blue-500/10' },
  indigo: { card: 'border-indigo-500/20 bg-indigo-500/5', icon: 'bg-indigo-500/10 text-indigo-400', glow: 'hover:shadow-indigo-500/10' },
  emerald: { card: 'border-emerald-500/20 bg-emerald-500/5', icon: 'bg-emerald-500/10 text-emerald-400', glow: 'hover:shadow-emerald-500/10' },
  amber: { card: 'border-amber-500/20 bg-amber-500/5', icon: 'bg-amber-500/10 text-amber-400', glow: 'hover:shadow-amber-500/10' },
  purple: { card: 'border-purple-500/20 bg-purple-500/5', icon: 'bg-purple-500/10 text-purple-400', glow: 'hover:shadow-purple-500/10' },
  teal: { card: 'border-teal-500/20 bg-teal-500/5', icon: 'bg-teal-500/10 text-teal-400', glow: 'hover:shadow-teal-500/10' },
  rose: { card: 'border-rose-500/20 bg-rose-500/5', icon: 'bg-rose-500/10 text-rose-400', glow: 'hover:shadow-rose-500/10' },
  cyan: { card: 'border-cyan-500/20 bg-cyan-500/5', icon: 'bg-cyan-500/10 text-cyan-400', glow: 'hover:shadow-cyan-500/10' },
  orange: { card: 'border-orange-500/20 bg-orange-500/5', icon: 'bg-orange-500/10 text-orange-400', glow: 'hover:shadow-orange-500/10' },
};

const SECURITY_POINTS = [
  { icon: KeyRound, title: 'RBAC — صلاحيات حسب الدور', desc: 'خمسة أدوار وظيفية (مدير نظام، مدير مشروع، مهندس، محاسب، مقاول) تتحكم في كل صفحة وزر.' },
  { icon: Fingerprint, title: 'RLS — عزل البيانات على مستوى الصف', desc: 'المقاول يرى عقوده ومستحقاته فقط؛ والمهندس مقيد بالمشاريع المرتبطة بحسابه.' },
  { icon: Lock, title: 'JWT + قفل تسجيل الدخول', desc: 'جلسات موثقة برمز JWT مع قفل الحساب بعد المحاولات الفاشلة وحماية HTTPS إجبارية.' },
  { icon: Database, title: 'سجل تدقيق لكل عملية حساسة', desc: 'كل اعتماد دفعة أو تعديل سعر يُسجل مع هوية المنفذ والقيمة القديمة والجديدة.' },
];

const STEPS = [
  { icon: FileText, step: '١', title: 'رفع المخططات', desc: 'ارفع ملفات DWG/DXF للمباني والمشاريع دفعة واحدة.' },
  { icon: Sparkles, step: '٢', title: 'استخراج BOQ تلقائياً', desc: 'النظام يستخرج الأعمدة والجدران والعناصر ويصنّفها آلياً.' },
  { icon: ShieldCheck, step: '٣', title: 'مراجعة الجودة QC', desc: 'فحوصات إلزامية لكل مرحلة تنفيذ قبل أي صرف مالي.' },
  { icon: Wallet, step: '٤', title: 'اعتماد الدفعات', desc: 'اعتماد المستحقات المرحلية وتحرير الضمانات بسجل تدقيق كامل.' },
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
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent tabular-nums">
        {display.toLocaleString('ar-EG')}
        {suffix && <span className="text-2xl md:text-3xl text-blue-400"> {suffix}</span>}
      </div>
      <div className="mt-2 text-xs md:text-sm text-slate-400 font-semibold">{label}</div>
    </div>
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
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 outline-none transition"
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
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 outline-none transition"
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
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 outline-none transition resize-none"
        />
      </div>
      <button
        type="submit"
        className="w-full px-6 py-3.5 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
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
    { href: '#features', label: 'المميزات' },
    { href: '#workflow', label: 'سير العمل' },
    { href: '#security', label: 'الأمان' },
    { href: '#faq', label: 'الأسئلة الشائعة' },
    { href: '#contact', label: 'تواصل معنا' },
  ];

  const scrollTo = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* ===== Navbar ===== */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-white leading-tight truncate">نظام إدارة المقاولات المتكامل</h1>
              <p className="text-[10px] text-slate-400 truncate">من التصميم إلى التنفيذ والاعتماد المالي</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => scrollTo(e, l.href)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/20 hidden sm:block"
            >
              تسجيل الدخول
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
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => scrollTo(e, l.href)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                >
                  {l.label}
                </a>
              ))}
              <button
                onClick={() => { setMobileOpen(false); navigate('/login'); }}
                className="w-full mt-2 px-4 py-3 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold transition"
              >
                تسجيل الدخول
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ===== Hero ===== */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-glow" />
          <div className="absolute top-40 left-1/5 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] animate-glow-delayed" />
          <div className="absolute bottom-0 right-1/2 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-bold mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            منصة إدارة مشاريع البناء والتشييد
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="text-4xl md:text-6xl font-black leading-tight md:leading-tight text-white max-w-4xl mx-auto"
          >
            ندير مشاريعك الإنشائية
            <span className="block mt-2 bg-gradient-to-l from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              من المخطط إلى القرش الأخير
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            نظام متكامل يربط حصر الكميات من ملفات CAD، بالعقود والمقاولين، وفحوصات الجودة،
            والاعتماد المالي — في منصة واحدة موحّدة آمنة تصلح للشركات والمكاتب الهندسية.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition shadow-xl shadow-blue-600/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <Rocket className="w-4 h-4" />
              ابدأ الآن — دخول مجاني
            </button>
            <a
              href="#features"
              onClick={(e) => scrollTo(e, '#features')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-200 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition hover:-translate-y-0.5"
            >
              استكشف المميزات
              <ArrowLeft className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-500 font-semibold"
          >
            {['عزل بيانات على مستوى الصف RLS', 'صلاحيات RBAC', 'سجل تدقيق كامل', 'تصدير PDF و Excel'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={5}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            <StatCounter value={58} suffix="بنداً" label="في تقرير الإنجاز الشامل" />
            <StatCounter value={9} suffix="دفعات" label="مستحقات مرحلية مدعومة" />
            <StatCounter value={11} suffix="وحدة" label="وحدات متكاملة في المنصة" />
            <StatCounter value={5} suffix="أدوار" label="بصلاحيات مضبوطة RBAC" />
          </motion.div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="relative py-20 md:py-28 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold mb-4">
              <Layers className="w-3.5 h-3.5" />
              الوحدات
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">كل ما تحتاجه لإدارة المشروع</h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              إحدى عشرة وحدة متكاملة تغطي دورة حياة المشروع كاملة — من التصميم حتى الصرف النهائي.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const c = COLOR_MAP[f.color];
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  custom={i % 3}
                  className={`group rounded-3xl border ${c.card} p-6 hover:-translate-y-1 hover:shadow-2xl ${c.glow} transition-all duration-300 cursor-default`}
                >
                  <div className={`w-12 h-12 ${c.icon} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Workflow ===== */}
      <section id="workflow" className="relative py-20 md:py-28 scroll-mt-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold mb-4">
              <Workflow className="w-3.5 h-3.5" />
              سير العمل
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">أربع خطوات… وكل شيء تحت السيطرة</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
            <div className="hidden md:block absolute top-14 inset-x-16 h-px bg-gradient-to-l from-transparent via-slate-700 to-transparent" />
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                custom={i}
                className="relative text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm hover:border-slate-600 transition"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-2.5 right-4 w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[11px] font-black text-blue-300">
                  {s.step}
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{s.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Security ===== */}
      <section id="security" className="relative py-20 md:py-28 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                الأمان أولاً
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                بيانات مشاريعك سرّية
                <span className="block mt-2 bg-gradient-to-l from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  بمعايير مصرفية
                </span>
              </h2>
              <p className="mt-4 text-slate-400 text-sm md:text-base leading-relaxed max-w-lg">
                بنينا النظام على أربع ركائز أمنية تجعل كل مستخدم يرى بياناته فقط، وكل عملية حساسة موثقة ومحاسب عليها.
              </p>

              <div className="mt-8 space-y-4">
                {SECURITY_POINTS.map((s, i) => (
                  <motion.div
                    key={s.title}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-40px' }}
                    custom={i}
                    className="flex items-start gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/30 transition"
                  >
                    <div className="w-10 h-10 shrink-0 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm mb-1">{s.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 via-indigo-600/10 to-purple-600/20 rounded-[2rem] blur-2xl" />
              <div className="relative bg-slate-900/80 border border-slate-700/60 rounded-[2rem] p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-xl flex items-center justify-center">
                    <Quote className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">واجهة المقاول المخصصة</h3>
                    <p className="text-[10px] text-slate-500">مثال حي من النظام</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-slate-400">عقودي المرتبطة بحسابي</span>
                    <span className="font-bold text-emerald-400">1 عقد نشط</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-slate-400">مستحقاتي المالية</span>
                    <span className="font-bold text-blue-400">4,600,000 ر.س</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-slate-400">عقود المقاولين الآخرين</span>
                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      غير مرئية — RLS
                    </span>
                  </div>
                  <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 text-[10px] text-red-300/80">
                    كل محاولة وصول لبيانات خارج نطاق صلاحياتك تُسجل في Audit Log وتُرفض بـ 403.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="relative py-20 md:py-28 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              الأسئلة الشائعة
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">إجابات سريعة لأسئلتك</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                custom={i % 3}
                className={`bg-slate-900/60 border rounded-2xl overflow-hidden transition ${openFaq === i ? 'border-blue-500/40' : 'border-slate-800 hover:border-slate-600'}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-right"
                >
                  <span className="font-bold text-white text-sm md:text-base">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-blue-400' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-xs md:text-sm text-slate-400 leading-relaxed border-t border-slate-800/70 pt-4">{f.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact ===== */}
      <section id="contact" className="relative py-20 md:py-28 scroll-mt-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-bold mb-4">
                <Globe className="w-3.5 h-3.5" />
                تواصل معنا
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                لديك سؤال؟ أو مشروع
                <span className="block bg-gradient-to-l from-cyan-400 to-blue-400 bg-clip-text text-transparent">تحتاج إدارته؟</span>
              </h2>
              <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-md">
                فريقنا جاهز لمساعدتك في تجهيز النظام لمشروعك أو شركتك — راسلنا وسنعود إليك خلال يوم عمل واحد.
              </p>

              <div className="mt-8 space-y-4 text-sm">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">البريد الإلكتروني</div>
                    info@qb-construction.sa
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">الهاتف</div>
                    +966 5X XXX XXXX
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">الموقع</div>
                    الرياض، المملكة العربية السعودية
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="relative py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-blue-500/20 bg-gradient-to-br from-blue-950/60 via-slate-900 to-indigo-950/60 p-10 md:p-16 text-center">
            <div className="absolute -top-20 right-1/3 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px]" />
            <div className="relative">
              <Landmark className="w-10 h-10 text-blue-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                جاهز تنقل مشاريعك
                <span className="block bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent">للمستوى التالي؟</span>
              </h2>
              <p className="mt-5 text-slate-400 text-sm md:text-base max-w-lg mx-auto">
                انضم إلى الفرق التي تدير مشاريعها بدقة مالية وجودة تنفيذ وبيانات آمنة — من اليوم.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition shadow-xl shadow-blue-600/25 hover:-translate-y-0.5"
                >
                  <Rocket className="w-4 h-4" />
                  سجّل دخولك الآن
                </button>
                <a
                  href="#features"
                  onClick={(e) => scrollTo(e, '#features')}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-200 rounded-2xl text-sm font-bold transition hover:-translate-y-0.5"
                >
                  راجع المميزات مرة أخرى
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-slate-800/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">نظام إدارة المقاولات المتكامل</div>
              <div className="text-[10px] text-slate-500">© 2026 — جميع الحقوق محفوظة</div>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#features" onClick={(e) => scrollTo(e, '#features')} className="hover:text-slate-300 transition">المميزات</a>
            <a href="#security" onClick={(e) => scrollTo(e, '#security')} className="hover:text-slate-300 transition">الأمان</a>
            <a href="#faq" onClick={(e) => scrollTo(e, '#faq')} className="hover:text-slate-300 transition">الأسئلة الشائعة</a>
            <a href="#contact" onClick={(e) => scrollTo(e, '#contact')} className="hover:text-slate-300 transition">تواصل معنا</a>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            RLS · RBAC · JWT · HTTPS
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;