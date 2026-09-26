import React, { useState, useEffect, useRef } from 'react';
import { useLazyImage } from '../../hooks/qb/usePerformance';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FaBuilding, FaLayerGroup, FaCube, FaFileAlt, FaImage, FaChartBar, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import ProjectModelViewer from '../../components/qb/ModelViewer';
import api from '../../api/axios';

const ProjectViewPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const modelRef = useRef(null);
  useLazyImage(modelRef);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (err) {
      toast.error('فشل تحميل المشروع');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: FaChartBar },
    { id: 'buildings', label: 'المباني', icon: FaBuilding },
    { id: 'drawings', label: 'المخططات', icon: FaFileAlt },
    { id: '3d', label: 'النموذج ثلاثي الأبعاد', icon: FaCube },
    { id: 'boq', label: 'جهاز تسعير الكميات', icon: FaLayerGroup },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">جارٍ تحميل المشروع...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">المشروع غير موجود</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-gray-400 text-sm">
              <span className="flex items-center gap-1"><FaMapMarkerAlt /> {project.location}</span>
              <span className="flex items-center gap-1"><FaClock /> {project.status}</span>
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors">
            ← الرجوع
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto p-6">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'اسم المشروع', value: project.name, color: 'blue' },
                { label: 'الموقع', value: project.location || '-', color: 'green' },
                { label: 'المساحة', value: `${project.area || 0} م²`, color: 'purple' },
                { label: 'عدد الأدوار', value: project.floors || 0, color: 'yellow' },
                { label: 'الحالة', value: project.status, color: 'orange' },
                { label: 'هامش الربح', value: `${project.profit_rate || 15}%`, color: 'red' },
              ].map((item, i) => (
                <div key={i} className={`bg-${item.color}-900/30 border border-${item.color}-700/50 rounded-xl p-5`}>
                  <p className="text-${item.color}-400 text-sm mb-1">{item.label}</p>
                  <p className={`text-xl font-bold text-${item.color}-300`}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'buildings' && (
            <div className="bg-slate-900 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">المباني</h2>
              {buildings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buildings.map((b, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <h3 className="font-bold text-lg">{b.name}</h3>
                      <p className="text-gray-400 text-sm">{b.floors_count} دور</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">لا توجد مباني مضافة بعد</p>
              )}
            </div>
          )}

          {activeTab === 'drawings' && (
            <div className="bg-slate-900 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">المخططات والرسومات</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-lg p-6 text-center">
                  <FaFileAlt className="text-blue-400 text-3xl mx-auto mb-3" />
                  <h3 className="font-bold mb-2">مخطط الهيكل</h3>
                  <p className="text-gray-400 text-sm">مخطط هيكل المبنى مع جميع الأبعاد</p>
                  <button onClick={() => navigate(`/drawings/${projectId}`)} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    عرض المخطط
                  </button>
                </div>
                <div className="bg-slate-800 rounded-lg p-6 text-center">
                  <FaFileAlt className="text-green-400 text-3xl mx-auto mb-3" />
                  <h3 className="font-bold mb-2">مخطط التشطيب</h3>
                  <p className="text-gray-400 text-sm">مخطط التشطيب الداخلي والخارجي</p>
                  <button onClick={() => navigate(`/drawings?project=${projectId}`)} className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    عرض المخطط
                  </button>
                </div>
                <div className="bg-slate-800 rounded-lg p-6 text-center">
                  <FaFileAlt className="text-purple-400 text-3xl mx-auto mb-3" />
                  <h3 className="font-bold mb-2">مخطط الأنظمة</h3>
                  <p className="text-gray-400 text-sm">مخطط الأنظمة الكهربائية والسباكة</p>
                  <button className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    عرض المخطط
                  </button>
                </div>
                <div className="bg-slate-800 rounded-lg p-6 text-center">
                  <FaFileAlt className="text-orange-400 text-3xl mx-auto mb-3" />
                  <h3 className="font-bold mb-2">مخطط الموقع</h3>
                  <p className="text-gray-400 text-sm">مخطط الموقع الخارجي والتخطيط العام</p>
                  <button className="mt-3 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    عرض المخطط
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === '3d' && (
            <ProjectModelViewer
              modelUrl={project.model_url || '/assets/villa-real.glb'}
              projectName={project.name}
              floors={project.floors || 3}
            />
          )}

          {activeTab === 'boq' && (
            <div className="bg-slate-900 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">جهاز تسعير الكميات (BOQ)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">البند</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الوصف</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الكمية</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الوحدة</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">السعر</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="px-4 py-3">الخرسانة</td>
                      <td className="px-4 py-3 text-gray-400">صب الأساسات</td>
                      <td className="px-4 py-3">0.00</td>
                      <td className="px-4 py-3">م³</td>
                      <td className="px-4 py-3">0</td>
                      <td className="px-4 py-3">0</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="px-4 py-3">الحديد</td>
                      <td className="px-4 py-3 text-gray-400">تسليح</td>
                      <td className="px-4 py-3">0.00</td>
                      <td className="px-4 py-3">كجم</td>
                      <td className="px-4 py-3">0</td>
                      <td className="px-4 py-3">0</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="px-4 py-3">البلوك</td>
                      <td className="px-4 py-3 text-gray-400">جدار</td>
                      <td className="px-4 py-3">0.00</td>
                      <td className="px-4 py-3">قطعة</td>
                      <td className="px-4 py-3">0</td>
                      <td className="px-4 py-3">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-between items-center bg-slate-800 rounded-lg p-4">
                <span className="text-lg font-bold">الإجمالي النهائي</span>
                <span className="text-2xl font-bold text-blue-400">0.00 ريال</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectViewPage;
