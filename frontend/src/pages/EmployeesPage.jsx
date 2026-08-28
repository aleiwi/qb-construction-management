import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { employeesApi, attendanceApi } from '../features/hr/employeesApi';
import {
  Users, Plus, RefreshCw, X, CheckCircle2, AlertCircle,
  UserCheck, Calendar, Clock, Phone, Briefcase, Wallet
} from 'lucide-react';

const formatCurrency = (val) => {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 2 }).format(val);
};

const EmployeeModal = ({ employee, onSave, onClose }) => {
  const [form, setForm] = useState({
    full_name: employee?.full_name || '',
    national_id: employee?.national_id || '',
    phone: employee?.phone || '',
    job_title: employee?.job_title || '',
    monthly_salary: employee?.monthly_salary || 0,
    hire_date: employee?.hire_date ? employee.hire_date.split('T')[0] : '',
    is_active: employee?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError('اسم الموظف مطلوب'); return; }
    setSaving(true);
    const data = {
      ...form,
      hire_date: form.hire_date ? new Date(form.hire_date).toISOString() : null,
    };
    const result = await onSave(data);
    setSaving(false);
    if (!result.success) setError(result.error?.message || 'فشل الحفظ');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-lg font-bold text-white">{employee ? 'تعديل موظف' : 'موظف جديد'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم الكامل</label>
            <input type="text" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="أحمد محمد العلي"
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">رقم الهوية</label>
              <input type="text" value={form.national_id} onChange={e => setForm(f => ({ ...f, national_id: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الهاتف</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">المسمى الوظيفي</label>
              <input type="text" value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
                placeholder="مهندس مدني"
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الراتب الشهري (ر.س)</label>
              <input type="number" min="0" step="0.01" value={form.monthly_salary} onChange={e => setForm(f => ({ ...f, monthly_salary: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تاريخ التعيين</label>
              <input type="date" value={form.hire_date} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الحالة</label>
              <select value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition">
                <option value="true">نشط</option>
                <option value="false">معطل</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ATTENDANCE_STATUS = {
  present: { label: 'حاضر', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  absent: { label: 'غائب', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  leave: { label: 'إجازة', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

const AttendanceModal = ({ employees, onSave, onClose }) => {
  const [form, setForm] = useState({
    employee_id: '', date: new Date().toISOString().split('T')[0],
    status: 'present', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id) { setError('اختر الموظف'); return; }
    setSaving(true);
    const result = await onSave({
      employee_id: parseInt(form.employee_id),
      date: form.date,
      status: form.status,
      notes: form.notes,
    });
    setSaving(false);
    if (!result.success) setError(result.error?.message || 'فشل الحفظ');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">تسجيل حضور</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الموظف</label>
            <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition">
              <option value="">اختر الموظف</option>
              {employees.map(em => <option key={em.id} value={em.id}>{em.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">التاريخ</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الحالة</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition">
              <option value="present">حاضر</option>
              <option value="absent">غائب</option>
              <option value="leave">إجازة</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملاحظات</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="ملاحظات..."
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EmployeesPage = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ total_employees: 0, active_employees: 0, monthly_payroll: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, statsRes] = await Promise.all([
        employeesApi.list(),
        employeesApi.stats(),
      ]);
      if (empRes.success) setEmployees(empRes.data);
      if (statsRes.success) setStats(statsRes.data);
      if (activeTab === 'attendance') {
        const attRes = await attendanceApi.list();
        if (attRes.success) setAttendance(attRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleSaveEmployee = async (form) => {
    if (editingEmployee) {
      const res = await employeesApi.update(editingEmployee.id, form);
      if (res.success) { showSuccess('تم تحديث بيانات الموظف'); fetchData(); }
      return res;
    } else {
      const res = await employeesApi.create(form);
      if (res.success) { showSuccess('تم إضافة الموظف بنجاح'); fetchData(); }
      return res;
    }
  };

  const handleDeleteEmployee = async (id) => {
    const res = await employeesApi.delete(id);
    if (res.success) { showSuccess('تم حذف الموظف'); fetchData(); }
  };

  const handleCreateAttendance = async (form) => {
    const res = await attendanceApi.create(form);
    if (res.success) { showSuccess('تم تسجيل الحضور'); fetchData(); }
    return res;
  };

  const handleDeleteAttendance = async (id) => {
    const res = await attendanceApi.delete(id);
    if (res.success) { showSuccess('تم حذف السجل'); fetchData(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="الموارد البشرية HR"
        subtitle="الموظفين والحضور والرواتب"
        actions={
          <>
            <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {(permissions.isAdmin || permissions.isProjectManager) && (
              activeTab === 'employees' ? (
                <button onClick={() => { setEditingEmployee(null); setShowEmployeeModal(true); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20">
                  <Plus className="w-4 h-4" /><span>موظف جديد</span>
                </button>
              ) : (
                <button onClick={() => setShowAttendanceModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20">
                  <Plus className="w-4 h-4" /><span>تسجيل حضور</span>
                </button>
              )
            )}
          </>
        }
      />

      <div className="space-y-6">
        {actionMsg && (
          <div className="p-4 rounded-2xl border flex items-center gap-3 text-sm bg-emerald-950/40 border-emerald-800/50 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{actionMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الموظفين', value: stats.total_employees, color: 'text-white' },
            { label: 'نشط', value: stats.active_employees, color: 'text-emerald-400' },
            { label: 'الرواتب الشهرية', value: `${formatCurrency(stats.monthly_payroll)} ر.س`, color: 'text-amber-400', isText: true },
            { label: 'سجلات الحضور', value: attendance.length, color: 'text-blue-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-1.5 w-fit">
          {[['employees', 'الموظفين'], ['attendance', 'الحضور']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ التحميل...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-2xl text-red-300 text-center text-sm">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />{error}
          </div>
        ) : activeTab === 'employees' ? (
          employees.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-300 mb-2">لا يوجد موظفين</h3>
              <p className="text-sm text-slate-500 mb-6">أضف أول موظف لبدء إدارة الموارد البشرية</p>
              {(permissions.isAdmin || permissions.isProjectManager) && (
                <button onClick={() => { setEditingEmployee(null); setShowEmployeeModal(true); }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />إضافة موظف
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((em) => (
                <div key={em.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-white text-base">{em.full_name}</h3>
                        {em.job_title && <span className="text-slate-500 text-xs flex items-center gap-1"><Briefcase className="w-3 h-3" />{em.job_title}</span>}
                        {em.is_active ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">نشط</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">معطل</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {em.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{em.phone}</span>}
                        {em.national_id && <span className="font-mono">هوية: {em.national_id}</span>}
                        {em.hire_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(em.hire_date).toLocaleDateString('ar-SA-u-nu-latn')}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-center">
                        <div className="text-sm font-bold text-amber-400 flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" />{formatCurrency(em.monthly_salary)}
                        </div>
                        <div className="text-[10px] text-slate-500">ر.س / شهر</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(permissions.isAdmin || permissions.isProjectManager) && (
                          <button onClick={() => { setEditingEmployee(em); setShowEmployeeModal(true); }}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition border border-transparent hover:border-blue-500/20" title="تعديل">
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {permissions.isAdmin && (
                          <button onClick={() => handleDeleteEmployee(em.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20" title="حذف">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          attendance.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد سجلات حضور</h3>
              <p className="text-sm text-slate-500 mb-6">ابدأ بتسجيل أول سجل حضور</p>
              {(permissions.isAdmin || permissions.isProjectManager) && (
                <button onClick={() => setShowAttendanceModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />تسجيل حضور
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.map((r) => {
                const cfg = ATTENDANCE_STATUS[r.status] || ATTENDANCE_STATUS.present;
                return (
                  <div key={r.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-bold text-white text-base">{r.employee_name || `موظف #${r.employee_id}`}</h3>
                          <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(r.date).toLocaleDateString('ar-SA-u-nu-latn')}</span>
                          {r.check_in && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-400" />دخول: {new Date(r.check_in).toLocaleTimeString('ar-SA-u-nu-latn')}</span>}
                          {r.check_out && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-red-400" />خروج: {new Date(r.check_out).toLocaleTimeString('ar-SA-u-nu-latn')}</span>}
                        </div>
                        {r.notes && <p className="text-xs text-slate-500 mt-2">{r.notes}</p>}
                      </div>
                      {permissions.isAdmin && (
                        <button onClick={() => handleDeleteAttendance(r.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20" title="حذف">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {showEmployeeModal && (
        <EmployeeModal
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          onClose={() => { setShowEmployeeModal(false); setEditingEmployee(null); }}
        />
      )}

      {showAttendanceModal && (
        <AttendanceModal
          employees={employees.filter(e => e.is_active)}
          onSave={handleCreateAttendance}
          onClose={() => setShowAttendanceModal(false)}
        />
      )}
    </div>
  );
};