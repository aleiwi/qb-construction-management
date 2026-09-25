import React, { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

// Components
import Header from "./Header";
import NavigationBar from "./NavigationBar";
import ProjectSettings from "./ProjectSettings";
import AdditionalDataSection from "./AdditionalDataSection";
import CalculatorItemSelector from "./CalculatorItemSelector";
import CalculatorItemsTable from "./CalculatorItemsTable";
import CalculatorResults from "./CalculatorResults";
import AdvancedEngineeringStandards from "./AdvancedEngineeringStandards.js";


// Hooks
import useEngineeringCalculations from "../../hooks/useEngineeringCalculations.js";
import { usePdfGenerator } from "../../hooks/usePdfGenerator";

// Services & Utils
import projectService from "../../services/projectService.js";

import { validateProjectData, calculateItem, calculateTotals, getConversionFactor, getSteelRatio, safeDivide, formatNumber } from '../../utils/qb/calculatorLogic";

import {
  FaCalculator,
  FaSave,
  FaPlus,
  FaEdit,
  FaBuilding,
  FaLayerGroup,
  FaChevronDown,
  FaInfoCircle,
  FaCog,
  FaDatabase,
  FaFileExport,
  FaHistory,
  FaSort,
  FaSync,
  FaExpand,
  FaCompress,
  FaLightbulb,
  FaQuestionCircle,
  FaAtom,
  FaRocket,
  FaMagic,
  FaBolt,
  FaExclamationTriangle,
  FaFolderOpen,
  FaFlag,
  FaFileAlt,
  FaCalendarAlt,
  FaGem,
  FaFire,
  FaCrown,
  FaStar,
  FaChartBar,
  FaCoins,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaPercentage,
  FaBalanceScale,
  FaBrain,
  FaFlask,
  FaEye,
  FaBars,
  FaTable,
  FaBook,
  FaRegStar
} from "react-icons/fa";

const QuantumBuildCalculator = () => {
  const { id: projectId } = useParams();
  const location = useLocation();
  const supabase = api.get;
  
  // قراءة projectId من query parameters أيضاً (للوحة التحكم)
  const urlParams = new URLSearchParams(location.search);
  const queryProjectId = urlParams.get('projectId');
  const mode = urlParams.get('mode');
  
  // استخدام projectId من useParams أو من query parameters
  const finalProjectId = projectId || queryProjectId;
  
  // Helper function to safely divide and handle NaN


  // حالة البيانات الرئيسية
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    concretePrice: "", // ريال/م³
    steelPrice: "", // ريال/طن
    blockPrice: "", // ريال/قطعة
    factoryRate: "", // سعر المصنعيات (ريال/م²)
    overheadRate: "", // المصاريف الإدارية
    profitRate: "", // نسبة الربح للمتر المربع %
  });

  // حالة بنود المشروع
  const [items, setItems] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // الميزات الاحترافية الجديدة
  const [viewMode, setViewMode] = useState("dashboard"); // dashboard, calculator, analysis
  const [savedProjects, setSavedProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [showEngineeringStandards, setShowEngineeringStandards] =
    useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [marketRates, setMarketRates] = useState({
    concrete: { min: 250, max: 350, current: 300 },
    steel: { min: 2800, max: 3200, current: 3000 },
    block: { min: 1.2, max: 2.0, current: 1.5 },
  });

  // حالة بيانات الدفان والعزل المدمجة
  const [additionalData, setAdditionalData] = useState({
    backfillQuantity: "", // كمية الدفان (م³_
    backfillPrice: "", // سعر الدفان (ريال/م³_
    insulationQuantity: "", // كمية العزل (م²_
    insulationPrice: "", // سعر العزل (ريال/م²_
    startDate: "",
    deliveryDate: "",
    projectType: "سكني",
    status: "قيد التنفيذ"
  });

  // حالة العرض الكامل
  const [isFullscreen, setIsFullscreen] = useState(false);

  // حالة التمرير السلس
  const [activeSection, setActiveSection] = useState("project");



  // حالة الأخطاء في الإدخال
  const [errors, setErrors] = useState({});

  // حالة مقارنة المشاريع
  const [projectComparison, setProjectComparison] = useState(null);

  // الحسابات الهندسية المتقدمة
  const engineeringData = useEngineeringCalculations(projectData, items);

  const { generatePdf } = usePdfGenerator();

  // المؤشرات المالية المتقدمة
  const advancedMetrics = useMemo(() => {
    if (!results) return null;

    // التحقق من نوع البيانات قبل استخدام replace
    const totalCostAsNumber =
      typeof results.totalCost === "string"
        ? parseInt(results.totalCost.replace(/,/g, "")) || 0
        : parseInt(results.totalCost) || 0;
    const finalPriceAsNumber =
      typeof results.finalPrice === "string"
        ? parseInt(results.finalPrice.replace(/,/g, "")) || 0
        : parseInt(results.finalPrice) || 0;

    // حساب نسب متقدمة - استخدام safeDivide لتجنب NaN
    const materialCostRatio = formatNumber(
      safeDivide(totalCostAsNumber, finalPriceAsNumber) * 100,
      1
    );
    const profitMargin = formatNumber(
      safeDivide(finalPriceAsNumber - totalCostAsNumber, finalPriceAsNumber) *
        100,
      1
    );
    const efficiency =
      (results.totalArea || 0) > 0
        ? formatNumber(safeDivide(totalCostAsNumber, results.totalArea), 0)
        : 0;

    // مقارنة مع السوق
    const marketComparison = {
      concrete: formatNumber(
        safeDivide(
          projectData.concretePrice - marketRates.concrete.current,
          marketRates.concrete.current
        ) * 100,
        1
      ),
      steel: formatNumber(
        safeDivide(
          projectData.steelPrice - marketRates.steel.current,
          marketRates.steel.current
        ) * 100,
        1
      ),
      block: formatNumber(
        safeDivide(
          projectData.blockPrice - marketRates.block.current,
          marketRates.block.current
        ) * 100,
        1
      ),
    };

    // تقييم المخاطر
    const riskLevel = () => {
      const avgDeviation =
        (Math.abs(marketComparison.concrete) +
          Math.abs(marketComparison.steel) +
          Math.abs(marketComparison.block)) /
        3;
      if (avgDeviation > 15) return { level: "عالي", color: "red" };
      if (avgDeviation > 8) return { level: "متوسط", color: "yellow" };
      return { level: "منخفض", color: "green" };
    };

    return {
      materialCostRatio,
      profitMargin,
      efficiency,
      marketComparison,
      riskLevel: riskLevel(),
      costPerSquareMeter: results.costPerSquareMeter || 0,
      totalArea: results.totalArea || 0,
      savingsPotential: Math.max(0, (totalCostAsNumber * 0.05).toFixed(0)), // إمكانية التوفير 5%
    };
  }, [results, projectData, marketRates]);

  // =================================================================
  // NEW: Save, Load, and New Project Functions
  // =================================================================

  const saveProject = async () => {
    try {
      // التحقق من تسجيل الدخول أولاً
      const { data: { user }, error: authError } = await api.get('/auth/me');
      
      if (authError || !user) {
        toast.error('🔒 يجب تسجيل الدخول أولاً لحفظ المشروع', {
          style: {
            background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
            color: "#fff",
            borderRadius: "12px",
            fontWeight: "bold",
          },
        });
        return;
      }

      // التحقق من وجود النتائج - تم إلغاء الشرط للسماح بوضع "التتبع فقط"
      // يسمح للمهندس بحفظ البيانات الأساسية وتواريخ المشروع دون الحاجة لحساب الكميات
      let finalResults = results;
      
      if (!results || !results.finalPrice) {
          console.log('ℹ️ جاري الحفظ في وضع التتبع (بدون حسابات)');
          finalResults = {
              finalPrice: 0,
              totalCost: 0,
              concreteQty: 0,
              steelQty: 0,
              blockQty: 0,
              totalArea: 0
          };
      }

      // إنشاء بيانات المشروع
      const projectDataToSave = {
        name: projectData.name || "مشروع جديد",
        description: projectData.description || additionalData.projectDescription || "",
        location: additionalData.projectLocation || "",
        start_date: additionalData.startDate || null,
        delivery_date: additionalData.deliveryDate || null,
        project_type: additionalData.projectType || "سكني",
        status: additionalData.status || "قيد التنفيذ",
        estimated_cost: parseFloat(finalResults.finalPrice) || 0,
      };

      // إنشاء بيانات الحاسبة
      const calculatorData = {
        projectData,
        additionalData,
        items,
        results: finalResults,
        savedAt: new Date().toISOString(),
      };

      console.log('📝 بيانات المشروع للحفظ:', projectDataToSave);
      console.log('📊 بيانات الحاسبة:', calculatorData);

      // تجهيز بيانات موحدة تُمرر لخدمة المشاريع (أسعار + بيانات إضافية)
      const projectPayload = {
        ...projectDataToSave,
        // إضافة الأسعار من projectData
        concretePrice: projectData.concretePrice,
        steelPrice: projectData.steelPrice,
        blockPrice: projectData.blockPrice,
        plasterPrice: projectData.plasterPrice,
        factoryRate: projectData.factoryRate,
        overheadRate: projectData.overheadRate,
        profitRate: projectData.profitRate,
        // إضافة بيانات العزل والدفان من additionalData
        backfillQuantity: additionalData.backfillQuantity,
        backfillPrice: additionalData.backfillPrice,
        insulationQuantity: additionalData.insulationQuantity,
        insulationPrice: additionalData.insulationPrice,
      };

      let savedProject;

      // إذا كان هناك projectId نهتم بالتحديث بدلاً من الإنشاء
      if (finalProjectId) {
        console.log('📝 حفظ مشروع في وضع التعديل، سيتم التحديث وليس الإنشاء الجديد', finalProjectId);
        savedProject = await projectService.updateProjectWithCalculator(
          finalProjectId,
          projectPayload,
          items,
          items,
          finalResults
        );
      } else {
        console.log('🚀 حفظ مشروع جديد مع الحاسبة');
        savedProject = await projectService.createProjectWithCalculator(
          projectPayload,
          items,
          items,
          finalResults
        );
      }

      toast.success("تم حفظ المشروع بنجاح! 💾", {
        style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
        },
      });
      console.log('✅ تم حفظ / تحديث المشروع:', savedProject);
      
    } catch (error) {
      console.error("خطأ في حفظ المشروع:", error);
      
      let errorMessage = "حدث خطأ أثناء حفظ المشروع";
      if (error.message.includes('تسجيل الدخول')) {
        errorMessage = "🔒 يجب تسجيل الدخول أولاً";
      } else if (error.message.includes('RLS')) {
        errorMessage = "⚠️ مشكلة في قاعدة البيانات - يرجى المحاولة مرة أخرى";
      }
      
      toast.error(errorMessage, {
        style: {
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
        },
      });
    }
  };

  const loadProject = async (projectId) => {
    try {
      console.log('🔄 جاري تحميل المشروع:', projectId);
      setLoading(true);
      
      // جلب بيانات المشروع
      const project = await projectService.getProjectById(projectId);
      const calculatorData = await projectService.getCalculatorData(projectId);
      
      console.log('📊 بيانات المشروع المحملة:', project);
      console.log('📊 بيانات الحاسبة المحملة:', calculatorData);
      
      if (project && calculatorData) {
        // استخراج البيانات من البنية الصحيحة
        // البيانات تأتي من قاعدة البيانات بهذه البنية:
        // calculatorData.calculation_results = results
        // calculatorData.calculator_data.prices = prices
        // calculatorData.calculator_data.items = items
        // calculatorData.project_settings = projectData
        const results = calculatorData?.calculation_results || calculatorData?.results || {};
        const prices = calculatorData?.calculator_data?.prices || calculatorData?.prices || {};
        const items = calculatorData?.calculator_data?.items || calculatorData?.items || [];
        const projectSettings = calculatorData?.project_settings || calculatorData?.projectData || {};
        
        console.log('🔍 البيانات المستخرجة:', {
          results: Object.keys(results),
          prices: Object.keys(prices),
          items: items.length,
          projectSettings: Object.keys(projectSettings)
        });
        
        // تحديث projectData (الأسعار وبيانات المشروع الأساسية)
        setProjectData({
          name: project.name || projectSettings.name || "",
          description: project.description || projectSettings.description || "",
          concretePrice: prices.concretePrice || projectSettings.concretePrice || "",
          steelPrice: prices.steelPrice || projectSettings.steelPrice || "",
          blockPrice: prices.blockPrice || projectSettings.blockPrice || "",
          factoryRate: prices.factoryRate || projectSettings.factoryRate || "",
          overheadRate: prices.overheadRate || projectSettings.overheadRate || "",
          profitRate: prices.profitRate || projectSettings.profitRate || "",
        });
        
        // تحديث additionalData (البيانات الإضافية)
        setAdditionalData({
          backfillQuantity: projectSettings.backfillQuantity || "",
          backfillPrice: prices.backfillPrice || projectSettings.backfillPrice || "",
          insulationQuantity: projectSettings.insulationQuantity || "",
          insulationPrice: prices.insulationPrice || projectSettings.insulationPrice || "",
          startDate: project.start_date || projectSettings.start_date || "",
          deliveryDate: project.delivery_date || projectSettings.delivery_date || "",
          projectType: project.project_type || projectSettings.project_type || "سكني",
          status: project.status || projectSettings.status || "قيد التنفيذ",
          projectDescription: project.description || projectSettings.description || "",
          projectLocation: project.location || projectSettings.location || "",
        });
        
        // تحديث البنود
        if (items && items.length > 0) {
          setItems(items);
        }
        
        // تحديث النتائج
        if (results && Object.keys(results).length > 0) {
          setResults(results);
        }
        
        console.log('✅ تم تحميل المشروع بنجاح!');
        toast.success("تم تحميل المشروع بنجاح! 🎉", {
          style: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            borderRadius: "12px",
            fontWeight: "bold",
          },
        });
      } else {
        console.warn('⚠️ لم يتم العثور على بيانات المشروع');
        toast.error("لم يتم العثور على بيانات المشروع", {
          style: {
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "#fff",
            borderRadius: "12px",
            fontWeight: "bold",
          },
        });
      }
      
    } catch (error) {
      console.error('❌ خطأ في تحميل المشروع:', error);
      toast.error("حدث خطأ أثناء تحميل المشروع: " + (error.message || 'خطأ غير معروف'), {
        style: {
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    if (
      window.confirm(
        "هل أنت متأكد أنك تريد بدء مشروع جديد؟ سيتم حذف جميع البيانات الحالية."
      )
    ) {
      const initialProjectData = {
        name: "",
        description: "",
        concretePrice: "",
        steelPrice: "",
        blockPrice: "",
        factoryRate: "",
        overheadRate: "",
        profitRate: "",
      };
      const initialAdditionalData = {
        backfillQuantity: "",
        backfillPrice: "",
        insulationQuantity: "",
        insulationPrice: "",
        startDate: "",
        deliveryDate: "",
        projectType: "سكني",
        status: "قيد التنفيذ"
      };

      setProjectData(initialProjectData);
      setAdditionalData(initialAdditionalData);
      setItems([]);
      setResults(null);

      localStorage.removeItem("quantumBuildProject");

      toast.success("تم بدء مشروع جديد.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Load project from local storage on component mount
  // Load project if in edit mode
  useEffect(() => {
    if (finalProjectId) {
      const loadProjectData = async () => {
        try {
          console.log('🔄 جاري تحميل المشروع للتعديل:', finalProjectId, 'من', projectId ? 'useParams' : 'query params');
          await loadProject(finalProjectId);
          // toast.success('تم تحميل بيانات المشروع للتعديل');
        } catch (error) {
          console.error('خطأ في تحميل المشروع:', error);
          toast.error('فشل في تحميل بيانات المشروع');
        }
      };
      loadProjectData();
    }
  }, [finalProjectId]);

  // EFFECT DISABLED: Auto-loading from localStorage caused unwanted default values to reappear.
  // Uncomment the following block to re-enable restoring the last session.
  /*
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("quantumBuildProject");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const initialProjectData = {
          name: "",
          description: "",
          concretePrice: "",
          steelPrice: "",
          blockPrice: "",
          factoryRate: "",
          overheadRate: "",
          profitRate: "",
        };
        const initialAdditionalData = {
          backfillQuantity: "",
          backfillPrice: "",
          insulationQuantity: "",
          insulationPrice: "",
        };

        setProjectData(parsedData.projectData || initialProjectData);
        setAdditionalData(parsedData.additionalData || initialAdditionalData);
        setItems(parsedData.items || []);
        setResults(parsedData.results || null);
        toast.success("تم تحميل مشروعك المحفوظ بنجاح!", {
          icon: <FaFolderOpen />,
        });
      }
    } catch (error) {
      console.error("Failed to load project from local storage", error);
      toast.error("لم نتمكن من تحميل مشروعك المحفوظ.");
    }
  }, []); // The empty dependency array ensures this effect runs only once on mount
  */

  // =================================================================



  // مراقبة التمرير لتحديث القسم النشط (مع تحسين الأداء)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = ["project", "additionalData", "items", "results"];
          const scrollPosition = window.scrollY + 100;

          for (const section of sections) {
            const element = document.getElementById(section);
            if (element) {
              const offsetTop = element.offsetTop;
              const offsetBottom = offsetTop + element.offsetHeight;

              if (
                scrollPosition >= offsetTop &&
                scrollPosition < offsetBottom
              ) {
                setActiveSection(section);
                break;
              }
            }
          }
          ticking = false;
        });

        ticking = true;
      }
    };

    // استخدام { passive: true } لتحسين أداء التمرير
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);



  // دالة للتحقق من اسم المشروع (يمنع الأرقام فقط)
  const handleProjectNameInput = (e) => {
    const value = e.target.value;

    // السماح بالأحرف العربية والإنجليزية والأرقام والمسافات والرموز
    if (/^[\p{L}\d\s\-_.()]+$/u.test(value) || value === "") {
      setProjectData({ ...projectData, name: value });

      // إزالة الخطأ إذا كان الإدخال صحيحًا
      if (errors.name) {
        setErrors({ ...errors, name: null });
      }
    }
  };



  // إضافة بند جديد
  const addItem = (category, itemDef) => {
    // التحقق من صحة بيانات المشروع قبل إضافة البنود
    if (!validateProjectData()) {
      toast.error("يرجى إكمال إعدادات المشروع بشكل صحيح", {
        style: {
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
        },
      });
      // التمرير إلى قسم إعدادات المشروع
      document.getElementById("project").scrollIntoView({ behavior: "smooth" });
      return;
    }

    const newItem = {
      id: Date.now(),
      category: category,
      itemType: itemDef.id,
      name: itemDef.name,
      length: "",
      width: "",
      thickness: "",
      conversionFactor: getConversionFactor(itemDef.name),
      preArea: "",
      steelRatio: getSteelRatio(itemDef.name),
      concreteQty: 0,
      steelQty: 0,
      blockQty: 0,
      area: 0,
      volume: 0,
      totalCost: 0,
    };
    setItems([...items, newItem]);
    toast.success(`تمت إضافة ${itemDef.name} بنجاح`, {
      style: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        borderRadius: "12px",
        fontWeight: "bold",
      },
    });
  };



  const calculateAll = () => {
    if (items.length === 0) {
      toast.error("يرجى إضافة بنود للمشروع أولاً", {
        style: {
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
        },
      });
      return;
    }

    // التحقق من صحة بيانات المشروع قبل الحساب
    // Pass projectData to the pure validation function
    const validationErrors = validateProjectData(projectData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("يرجى إكمال إعدادات المشروع بشكل صحيح", {
        style: {
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
        },
      });
      // التمرير إلى قسم إعدادات المشروع
      document.getElementById("project").scrollIntoView({ behavior: "smooth" });
      return;
    }

    setLoading(true);

    // محاكاة تأثير التحميل
    setTimeout(() => {
      // Use imported calculateItem with projectData
      const updatedItems = items.map((item) => calculateItem(item, projectData));
      setItems(updatedItems);

      // Use imported calculateTotals
      const totals = calculateTotals(updatedItems, projectData, additionalData);

      setResults(totals);

      setLoading(false);

      toast.success("تم حساب التكاليف بنجاح! 🎉", {
        style: {
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          color: "#fff",
          borderRadius: "12px",
          fontWeight: "bold",
        },
      });
    }, 1500);
  };

  const deleteItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
    toast.success("تم حذف البند بنجاح", {
      style: {
        background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        color: "#fff",
        borderRadius: "12px",
        fontWeight: "bold",
      },
    });
  };

  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const updateAdditionalData = (field, value) => {
    setAdditionalData({
      ...additionalData,
      [field]: value,
    });
  };

  const generateExcel = () => {
    // This is a placeholder. Implementing Excel export requires a library like 'xlsx'.
    toast.error("ميزة تصدير Excel قيد التطوير حاليًا.");
  };







  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      } ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
    >
      <Header 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        isFullscreen={isFullscreen} 
        setIsFullscreen={setIsFullscreen} 
      />
      <NavigationBar 
        darkMode={darkMode} 
        handleNewProject={handleNewProject} 
        saveProject={saveProject} 
        results={results} 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 space-x-reverse mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-blue-600 p-3 rounded-full">
                <FaRocket className="text-white text-xl" />
              </div>
            </div>
            <h1
              className={`text-4xl font-bold ${
                darkMode
                  ? "bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
                  : "text-gray-800"
              }`}
            >
              🏗️ QUANTUM BUILD
            </h1>
          </div>
          <p
            className={`text-xl ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            حساب دقيق لكميات وتكاليف مواد البناء حسب المواصفات الهندسية المتقدمة
          </p>
        </div>

        {/* المعايير الهندسية المتقدمة */}
        {results && engineeringData && (
          <div
            className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm transition-all duration-300 ${
              darkMode
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/80 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-green-600 to-emerald-700 p-3 rounded-full">
                    <FaBook className="text-white text-xl" />
                  </div>
                </div>
                <h2
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  📐 المعايير الهندسية المتقدمة
                </h2>
              </div>
              <button
                onClick={() =>
                  setShowEngineeringStandards(!showEngineeringStandards)
                }
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  showEngineeringStandards
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                    : darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {showEngineeringStandards ? "إخفاء المعايير" : "عرض المعايير"}
              </button>
            </div>

            {showEngineeringStandards && (
              <AdvancedEngineeringStandards
                engineeringData={engineeringData}
                projectData={projectData}
                darkMode={darkMode}
                onExportStandards={() => {
                  toast.success("تم إعداد التقرير للتصدير!");
                }}
              />
            )}
          </div>
        )}

        {/* إعدادات المشروع */}
        <ProjectSettings
          darkMode={darkMode}
          projectData={projectData}
          setProjectData={setProjectData}
          additionalData={additionalData}
          setAdditionalData={setAdditionalData}
          errors={errors}
          setErrors={setErrors}
          marketRates={marketRates}
          handleProjectNameInput={handleProjectNameInput}
        />

        {/* بيانات الدفان والعزل المدمجة */}
        <AdditionalDataSection
          darkMode={darkMode}
          additionalData={additionalData}
          setAdditionalData={setAdditionalData}
        />

        {/* نظام إضافة البنود مع الفلترة */}
        {/* نظام إضافة البنود مع الفلترة */}
        <CalculatorItemSelector
          darkMode={darkMode}
          onAddItem={addItem}
        />

        {/* جدول البنود */}
        <CalculatorItemsTable
          items={items}
          darkMode={darkMode}
          updateItem={updateItem}
          deleteItem={deleteItem}
          results={results}
        />

        {/* زر حساب التكاليف */}
        {items.length > 0 && (
          <div
            className={`rounded-2xl p-8 mb-8 text-center backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${
              darkMode ? "bg-gray-800/50" : "bg-white/80"
            }`}
          >
            <button
              onClick={calculateAll}
              disabled={loading}
              className="relative group inline-flex items-center px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-75"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-12 py-6 rounded-2xl flex items-center">
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    جاري الحساب...
                  </>
                ) : (
                  <>
                    <FaCalculator className="inline ml-3 text-2xl" />
                    احسب التكاليف
                  </>
                )}
              </div>
            </button>
            <p
              className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              اضغط هنا لحساب جميع التكاليف بعد إدخال البنود
            </p>
          </div>
        )}

        {/* النتائج */}
        {results && (
          <CalculatorResults
            results={results}
            items={items}
            projectData={projectData}
            darkMode={darkMode}
            onPdf={generatePdf}
            onExcel={generateExcel}
          />
        )}

        {/* المرحلة الأولى: إدارة المشاريع المتقدمة */}


        {/* قسم مقارنة المشاريع المتقدم */}
        {savedProjects.length > 0 && (
          <div
            className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${
              darkMode
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/80 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-lg opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-full">
                    <FaBalanceScale className="text-white text-lg" />
                  </div>
                </div>
                <h2
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  ⚖️ مقارنة المشاريع
                </h2>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {savedProjects.length} مشروع محفوظ
                </span>
                <div
                  className={`w-3 h-3 rounded-full ${
                    savedProjects.length > 5
                      ? "bg-red-400"
                      : savedProjects.length > 2
                      ? "bg-yellow-400"
                      : "bg-green-400"
                  } animate-pulse`}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProjects.slice(-6).map((project, index) => {
                const projectCost = parseInt(
                  (typeof project.results?.totalCost === "string"
                    ? project.results?.totalCost?.replace(/,/g, "")
                    : project.results?.totalCost) || "0"
                );
                const currentCost = results
                  ? parseInt(
                      (typeof results.totalCost === "string"
                        ? results.totalCost.replace(/,/g, "")
                        : results.totalCost) || "0"
                    )
                  : 0;
                const difference = projectCost - currentCost;
                const diffPercentage =
                  currentCost > 0
                    ? ((difference / currentCost) * 100).toFixed(1)
                    : 0;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      darkMode
                        ? "bg-gray-700/50 border-gray-600 hover:border-gray-500"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setProjectComparison(project)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4
                        className={`font-semibold truncate ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        🏗️{" "}
                        {project.projectData?.projectName ||
                          `مشروع ${index + 1}`}
                      </h4>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          difference > 0
                            ? "bg-red-100 text-red-600"
                            : difference < 0
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {difference > 0 ? "+" : ""}
                        {diffPercentage}%
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div
                        className={`flex justify-between ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <span>📍 الموقع:</span>
                        <span className="font-medium">
                          {project.projectData?.location || "غير محدد"}
                        </span>
                      </div>
                      <div
                        className={`flex justify-between ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <span>💰 التكلفة:</span>
                        <span className="font-bold">
                          {Number(projectCost).toLocaleString()} ريال
                        </span>
                      </div>
                      <div
                        className={`flex justify-between ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <span>📊 المساحة:</span>
                        <span className="font-medium">
                          {project.results?.totalArea || 0} م²
                        </span>
                      </div>
                      <div
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        💾{" "}
                        {new Date(project.savedAt).toLocaleDateString("ar-SA")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* مقارنة مفصلة */}
            {projectComparison && (
              <div
                className={`mt-6 p-6 border rounded-lg ${
                  darkMode
                    ? "bg-gray-700/30 border-gray-600"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4
                    className={`text-lg font-bold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    📋 مقارنة مفصلة مع:{" "}
                    {projectComparison.projectData?.projectName}
                  </h4>
                  <button
                    onClick={() => setProjectComparison(null)}
                    className={`text-sm px-3 py-1 rounded hover:bg-gray-200 ${
                      darkMode
                        ? "text-gray-400 hover:bg-gray-600"
                        : "text-gray-600"
                    }`}
                  >
                    ✖️ إغلاق
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5
                      className={`font-semibold mb-3 ${
                        darkMode ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      🆕 المشروع الحالي
                    </h5>
                    {results && (
                      <div className="space-y-2 text-sm">
                        <div
                          className={`flex justify-between ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <span>🏗️ الخرسانة:</span>
                          <span>{results.concreteQty} م³</span>
                        </div>
                        <div
                          className={`flex justify-between ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <span>⚒️ الحديد:</span>
                          <span>{results.steelQty} طن</span>
                        </div>
                        <div
                          className={`flex justify-between ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <span>🧱 البلوك:</span>
                          <span>{results.blockQty} قطعة</span>
                        </div>
                        <div
                          className={`flex justify-between font-bold ${
                            darkMode ? "text-green-400" : "text-green-600"
                          }`}
                        >
                          <span>💰 التكلفة الإجمالية:</span>
                          <span>{results.totalCost} ريال</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h5
                      className={`font-semibold mb-3 ${
                        darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    >
                      📂 المشروع المقارن
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div
                        className={`flex justify-between ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        <span>🏗️ الخرسانة:</span>
                        <span>
                          {projectComparison.results?.concreteQty || 0} م³
                        </span>
                      </div>
                      <div
                        className={`flex justify-between ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        <span>⚒️ الحديد:</span>
                        <span>
                          {projectComparison.results?.steelQty || 0} طن
                        </span>
                      </div>
                      <div
                        className={`flex justify-between ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        <span>🧱 البلوك:</span>
                        <span>
                          {projectComparison.results?.blockQty || 0} قطعة
                        </span>
                      </div>
                      <div
                        className={`flex justify-between font-bold ${
                          darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                      >
                        <span>💰 التكلفة الإجمالية:</span>
                        <span>
                          {projectComparison.results?.totalCost || "0"} ريال
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* نصائح التحسين */}
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <FaLightbulb
                      className={`text-lg ${
                        darkMode ? "text-yellow-400" : "text-yellow-600"
                      }`}
                    />
                    <h6
                      className={`font-bold ${
                        darkMode ? "text-yellow-400" : "text-yellow-600"
                      }`}
                    >
                      💡 نصائح للتحسين
                    </h6>
                  </div>
                  <ul
                    className={`text-sm space-y-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <li>
                      • 📊 اعتمد على المشروع ذو التكلفة الأقل كمرجع للتحسين
                    </li>
                    <li>
                      • 🔄 راجع أسعار المواد بين المشاريع للحصول على أفضل سعر
                    </li>
                    <li>• ⚖️ احسب نسبة التكلفة إلى المساحة لتقييم الكفاءة</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
};

export default QuantumBuildCalculator;
