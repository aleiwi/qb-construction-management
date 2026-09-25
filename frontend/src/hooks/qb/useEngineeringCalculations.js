/**
 * React Hook للحسابات الهندسية المتقدمة
 * Advanced Engineering Calculations Hook
 */

import { useMemo } from 'react';
import { 
  advancedCalculations, 
  steelStandards,
  designStandards,
  saudiStandards,
} from '../constants/engineeringStandards';

export const useEngineeringCalculations = (projectData, items) => {
  
  return useMemo(() => {
    if (!projectData || !items || items.length === 0) {
      return null;
    }

    try {
      // ═══════════════════════════════════════════════════════
      // 1. حسابات الحديد المتقدمة
      // ═══════════════════════════════════════════════════════

      const calculateSteelAnalysis = () => {
        const totalSteelQty = items.reduce((sum, item) => {
          return sum + (parseFloat(item.steelQty) || 0);
        }, 0);

        const avgDiameter = projectData.avgSteelDiameter || 12;
        const barArea = steelStandards.diameters[avgDiameter]?.area || 1.131;
        const estimatedBarCount = Math.ceil(totalSteelQty * 1000 / barArea);

        return {
          totalQty: totalSteelQty,
          estimatedBars: estimatedBarCount,
          suggestedDiameter: avgDiameter,
          reinforcementRatio: (totalSteelQty / (items.length * 1000)).toFixed(4),
        };
      };

      // ═══════════════════════════════════════════════════════
      // 2. حسابات الخرسانة والأحمال
      // ═══════════════════════════════════════════════════════

      const calculateConcreteAnalysis = () => {
        const totalVolume = items.reduce((sum, item) => {
          return sum + (parseFloat(item.concreteQty) || 0);
        }, 0);

        const concreteType = projectData.concreteGrade || 'C30';
        const unitWeight = 2400; // كغ/م³

        const totalWeight = totalVolume * unitWeight;
        const deadLoad = totalWeight / (parseFloat(projectData.totalArea) || 1);

        return {
          totalVolume,
          totalWeight,
          deadLoadPerMeter: deadLoad.toFixed(2),
          concreteType,
          estimatedCost: (totalVolume * (parseFloat(projectData.concretePrice) || 300)).toFixed(0),
        };
      };

      // ═══════════════════════════════════════════════════════
      // 3. التحقق من معايير الأمان
      // ═══════════════════════════════════════════════════════

      const performSafetyChecks = () => {
        const checks = [];

        const steelAnalysis = calculateSteelAnalysis();
        const ratio = parseFloat(steelAnalysis.reinforcementRatio);

        // التحقق من نسبة التسليح
        if (ratio < steelStandards.ratios.min_tension) {
          checks.push({
            type: 'warning',
            message: `نسبة التسليح (${(ratio*100).toFixed(2)}%) أقل من الحد الأدنى (${(steelStandards.ratios.min_tension*100).toFixed(2)}%)`,
            severity: 'high',
            action: 'أضف المزيد من الحديد'
          });
        }

        if (ratio > steelStandards.ratios.max_tension) {
          checks.push({
            type: 'error',
            message: `نسبة التسليح (${(ratio*100).toFixed(2)}%) أعلى من الحد الأقصى (${(steelStandards.ratios.max_tension*100).toFixed(2)}%)`,
            severity: 'critical',
            action: 'قلل نسبة التسليح أو زد حجم المقطع'
          });
        }

        // التحقق من السمك الأدنى للبلاطات
        const avgThickness = items.reduce((sum, item) => {
          return sum + (parseFloat(item.thickness) || 0);
        }, 0) / items.length;

        if (avgThickness < 200) {
          checks.push({
            type: 'warning',
            message: `سمك البلاطة المتوسط (${avgThickness.toFixed(0)}ملم) قد يكون رقيقاً جداً`,
            severity: 'medium',
            action: 'تحقق من الحسابات الهندسية'
          });
        }

        return checks;
      };

      // ═══════════════════════════════════════════════════════
      // 4. حسابات الأحمال الحية والميتة
      // ═══════════════════════════════════════════════════════

      const calculateLoads = () => {
        const buildingType = projectData.buildingType || 'residential';
        const liveLoad = designStandards.liveLoads[buildingType] || 1.5;
        const totalArea = parseFloat(projectData.totalArea) || 1;

        const concreteAnalysis = calculateConcreteAnalysis();
        const deadLoad = parseFloat(concreteAnalysis.deadLoadPerMeter);

        const designLoad = (deadLoad * designStandards.designStandards?.safetyFactors?.dead_load || 1.4) +
                          (liveLoad * designStandards.designStandards?.safetyFactors?.live_load || 1.6);

        return {
          deadLoad: deadLoad.toFixed(2),
          liveLoad: liveLoad.toFixed(2),
          designLoad: designLoad.toFixed(2),
          totalLoadOnBase: (designLoad * totalArea).toFixed(0),
          loadUnit: 'كيلو نيوتن/م²'
        };
      };

      // ═══════════════════════════════════════════════════════
      // 5. المؤشرات الهندسية المتقدمة
      // ═══════════════════════════════════════════════════════

      const calculateAdvancedMetrics = () => {
        const steelAnalysis = calculateSteelAnalysis();
        const concreteAnalysis = calculateConcreteAnalysis();
        const loads = calculateLoads();

        const steelToConcreteRatio = (steelAnalysis.totalQty / concreteAnalysis.totalVolume * 100).toFixed(2);

        return {
          steelToConcreteRatio: `${steelToConcreteRatio}%`,
          loadCapacityFactor: (parseFloat(loads.designLoad) / parseFloat(loads.deadLoad)).toFixed(2),
          constructionComplexity: steelToConcreteRatio > 2 ? 'عالية جداً' : 
                                  steelToConcreteRatio > 1.5 ? 'عالية' : 
                                  steelToConcreteRatio > 1 ? 'متوسطة' : 'منخفضة',
          estimatedConstructionTime: (concreteAnalysis.totalVolume / 10 + steelAnalysis.estimatedBars / 100).toFixed(1),
          timeUnit: 'أيام'
        };
      };

      // ═══════════════════════════════════════════════════════
      // 6. توصيات التحسين
      // ═══════════════════════════════════════════════════════

      const generateRecommendations = () => {
        const recommendations = [];
        const steelAnalysis = calculateSteelAnalysis();
        const checks = performSafetyChecks();

        if (checks.length > 0) {
          recommendations.push({
            priority: 'عالي',
            title: 'معالجة المشاكل الهندسية',
            items: checks.map(c => c.message)
          });
        }

        if (steelAnalysis.totalQty > 100) {
          recommendations.push({
            priority: 'متوسط',
            title: 'تحسينات اقتصادية',
            items: [
              'استخدم أقطار حديد أكبر لتقليل عدد القضبان',
              'استخدم خرسانة ذات مقاومة أعلى لتقليل الحديد',
            ]
          });
        }

        return recommendations;
      };

      // ═══════════════════════════════════════════════════════
      // 7. معلومات إضافية
      // ═══════════════════════════════════════════════════════
      const getSeismicInfo = () => {
        const zone = projectData.seismicZone || 'zone_1';
        return saudiStandards.seismicZone[zone] || null;
      };


      // جمع جميع النتائج
      return {
        steelAnalysis: calculateSteelAnalysis(),
        concreteAnalysis: calculateConcreteAnalysis(),
        loads: calculateLoads(),
        safetyChecks: performSafetyChecks(),
        advancedMetrics: calculateAdvancedMetrics(),
        recommendations: generateRecommendations(),
        seismicInfo: getSeismicInfo(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('خطأ في الحسابات الهندسية:', error);
      return null;
    }
  }, [projectData, items]);
};

export default useEngineeringCalculations;
