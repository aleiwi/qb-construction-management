import { useNavigate } from 'react-router-dom';
import {
  Ruler, FileText, ShieldCheck, Wallet, BarChart3, Lock, ArrowLeft,
} from 'lucide-react';

const HEAD = "'Cairo','Tajawal',sans-serif";
const NAVY = '#10325a';
const SOFT = '#5a6b7b';
const LINE = 'rgba(14,27,44,0.12)';

const MODULES = [
  { icon: Ruler,       t: 'حصر الكميات BOQ',  d: 'استخراج آلي لعناصر DWG/DXF وتصنيفها.' },
  { icon: FileText,    t: 'العقود والتعاقدات', d: 'ربط المقاولين بالمباني وتتبع العقود.' },
  { icon: ShieldCheck, t: 'فحوصات الجودة QC', d: 'فحوصات إلزامية قبل كل صرف.' },
  { icon: Wallet,      t: 'المستحقات والضمان', d: 'دفعات مرحلية مشروطة بالأداء.' },
  { icon: BarChart3,   t: 'التقارير و KPIs',  d: 'تقرير شامل جاهز للتصدير.' },
  { icon: Lock,        t: 'الأمان والتدقيق',   d: 'صلاحيات RBAC وعزل RLS وسجل تدقيق.' },
];

export const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ background: '#fff', color: '#0e1b2c' }} dir="rtl">
      {/* Nav */}
      <header className="sticky top-0 z-40" style={{ background: '#fff', borderBottom: `1px solid ${LINE}` }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-lg font-extrabold" style={{ fontFamily: HEAD }}>وِجْهة | QB</div>
          <button onClick={() => navigate('/login')}
            className="px-5 py-2 text-sm font-bold text-white" style={{ background: '#0e1b2c' }}>
            دخول المهندسين
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight" style={{ fontFamily: HEAD }}>
          نُشيدُ المبنى،
          <br />
          <span style={{ color: NAVY }}>ونُديرُ صندوقه.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed" style={{ color: SOFT, fontFamily: 'Tajawal' }}>
          من حصر الكميات حتى مفتاح التسليم — منصة واحدة لإدارة المقاولات والعقود والجودة والمستحقات.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <button onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-8 py-4 text-white text-sm font-bold" style={{ background: '#0e1b2c' }}>
            ابدأ مشروعك <ArrowLeft className="w-4 h-4" />
          </button>
          <a href="#modules" className="px-8 py-4 text-sm font-bold border" style={{ borderColor: LINE, color: '#0e1b2c' }}>
            شاهد الأجنحة
          </a>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="border-t py-20" style={{ borderColor: LINE }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold mb-12" style={{ fontFamily: HEAD }}>الأجنحة</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: LINE }}>
            {MODULES.map((m, i) => (
              <div key={i} className="p-8 bg-white">
                <m.icon className="w-6 h-6 mb-4" style={{ color: NAVY }} strokeWidth={2.2} />
                <h3 className="text-lg font-extrabold mb-2" style={{ fontFamily: HEAD }}>{m.t}</h3>
                <p className="text-sm leading-relaxed" style={{ color: SOFT, fontFamily: 'Tajawal' }}>{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: LINE }}>
        <div className="max-w-5xl mx-auto px-6 text-sm" style={{ color: SOFT }}>
          © 2026 وِجْهة QB · CONSTRUCTION MANAGEMENT
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
