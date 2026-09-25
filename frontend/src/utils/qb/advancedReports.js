/**
 * Advanced Data & Reports Module
 * وحدة البيانات والتقارير المتقدمة
 */

import React from 'react';

// ═══════════════════════════════════════════════════════
// 1. Excel Export Utilities
// ═══════════════════════════════════════════════════════
export class ExcelExporter {
  static exportToExcel(data, filename = 'export.xlsx') {
    // Using SheetJS (xlsx) library - would need to be installed
    // npm install xlsx
    
    try {
      const XLSX = require('xlsx');
      
      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      
      // Style the worksheet
      const wscols = [{ wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }];
      ws['!cols'] = wscols;
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      return { success: true, message: 'Excel exported successfully' };
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      return { success: false, message: 'Error exporting to Excel' };
    }
  }

  static exportWithFormatting(data, columns, filename = 'export.xlsx') {
    try {
      const XLSX = require('xlsx');
      
      // Prepare formatted data
      const formattedData = data.map(row => {
        const formattedRow = {};
        columns.forEach(col => {
          formattedRow[col.header] = row[col.field];
        });
        return formattedRow;
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);
      
      // Apply styles
      const borderStyle = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      };

      // Set column widths and header styles
      const colWidths = columns.map(col => ({ wch: col.width || 12 }));
      ws['!cols'] = colWidths;

      // Create workbook and save
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, filename);

      return { success: true, message: 'Formatted Excel exported successfully' };
    } catch (error) {
      console.error('Error exporting formatted Excel:', error);
      return { success: false, message: 'Error exporting Excel' };
    }
  }
}

// ═══════════════════════════════════════════════════════
// 2. PDF Report Generator
// ═══════════════════════════════════════════════════════
export class PDFReportGenerator {
  static generateReport(reportData, options = {}) {
    const { jsPDF } = require('jspdf');
    const html2canvas = require('html2canvas');

    const {
      title = 'Report',
      orientation = 'portrait',
      format = 'a4',
      margin = 10,
    } = options;

    try {
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      // Add title
      doc.setFontSize(16);
      doc.text(title, margin, margin + 10);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, margin + 20);

      // Add content
      let yPosition = margin + 30;

      if (reportData.sections) {
        reportData.sections.forEach(section => {
          // Section title
          doc.setFontSize(12);
          doc.text(section.title, margin, yPosition);
          yPosition += 8;

          // Section content
          if (section.content) {
            doc.setFontSize(10);
            const contentLines = doc.splitTextToSize(section.content, 190);
            contentLines.forEach(line => {
              if (yPosition > 270) {
                doc.addPage();
                yPosition = margin;
              }
              doc.text(line, margin, yPosition);
              yPosition += 6;
            });
          }

          yPosition += 5;
        });
      }

      return doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  }

  static async generateFromHTML(htmlElement, filename = 'report.pdf') {
    try {
      const { jsPDF } = require('jspdf');
      const html2canvas = require('html2canvas');

      // Capture HTML as image
      const canvas = await html2canvas(htmlElement);
      const imgData = canvas.toDataURL('image/png');

      // Create PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(filename);
      return { success: true };
    } catch (error) {
      console.error('Error generating PDF from HTML:', error);
      return { success: false };
    }
  }
}

// ═══════════════════════════════════════════════════════
// 3. Project Comparison
// ═══════════════════════════════════════════════════════
export class ProjectComparison {
  static compareProjects(projects) {
    if (!projects || projects.length < 2) {
      return { error: 'At least 2 projects required for comparison' };
    }

    const comparison = {
      projects: projects.map(p => ({ name: p.name, id: p.id })),
      metrics: this.calculateMetrics(projects),
      differences: this.calculateDifferences(projects),
      recommendations: this.getRecommendations(projects),
    };

    return comparison;
  }

  static calculateMetrics(projects) {
    return projects.map(project => ({
      name: project.name,
      totalCost: project.totalCost || 0,
      totalArea: project.totalArea || 0,
      costPerUnit: (project.totalCost || 0) / (project.totalArea || 1),
      itemCount: project.items?.length || 0,
      materialBreakdown: this.getMaterialBreakdown(project),
    }));
  }

  static getMaterialBreakdown(project) {
    const breakdown = {
      concrete: 0,
      steel: 0,
      blocks: 0,
      other: 0,
    };

    project.items?.forEach(item => {
      if (item.type === 'concrete') breakdown.concrete += item.cost || 0;
      else if (item.type === 'steel') breakdown.steel += item.cost || 0;
      else if (item.type === 'blocks') breakdown.blocks += item.cost || 0;
      else breakdown.other += item.cost || 0;
    });

    return breakdown;
  }

  static calculateDifferences(projects) {
    if (projects.length < 2) return {};

    const base = projects[0];
    const differences = {};

    projects.slice(1).forEach((project, index) => {
      differences[`vs_project_${index + 2}`] = {
        costDifference: (project.totalCost || 0) - (base.totalCost || 0),
        percentageDifference: (((project.totalCost || 0) - (base.totalCost || 0)) / (base.totalCost || 1)) * 100,
        areaDifference: (project.totalArea || 0) - (base.totalArea || 0),
        itemCountDifference: (project.items?.length || 0) - (base.items?.length || 0),
      };
    });

    return differences;
  }

  static getRecommendations(projects) {
    const metrics = this.calculateMetrics(projects);
    const recommendations = [];

    // Find cheapest project
    const cheapest = metrics.reduce((min, curr) => 
      curr.totalCost < min.totalCost ? curr : min
    );

    recommendations.push({
      type: 'cost_optimization',
      message: `${cheapest.name} offers the lowest cost at ${cheapest.totalCost}`,
      priority: 'high',
    });

    // Find best cost per unit
    const bestCPU = metrics.reduce((min, curr) => 
      curr.costPerUnit < min.costPerUnit ? curr : min
    );

    recommendations.push({
      type: 'efficiency',
      message: `${bestCPU.name} has the best cost per unit area`,
      priority: 'high',
    });

    return recommendations;
  }
}

// ═══════════════════════════════════════════════════════
// 4. Change History Tracking
// ═══════════════════════════════════════════════════════
export class ChangeHistory {
  constructor() {
    this.history = [];
    this.maxEntries = 100; // Limit history size
  }

  addChange(action, data, metadata = {}) {
    const change = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      data,
      metadata,
    };

    this.history.unshift(change); // Add to beginning

    // Limit history size
    if (this.history.length > this.maxEntries) {
      this.history.pop();
    }

    return change;
  }

  getHistory(limit = 10) {
    return this.history.slice(0, limit);
  }

  getChangesByAction(action) {
    return this.history.filter(h => h.action === action);
  }

  getChangesSince(timestamp) {
    return this.history.filter(h => new Date(h.timestamp) > new Date(timestamp));
  }

  revert(changeId) {
    const changeIndex = this.history.findIndex(h => h.id === changeId);
    if (changeIndex !== -1) {
      const change = this.history[changeIndex];
      return {
        success: true,
        reverted: change,
        message: `Reverted: ${change.action}`,
      };
    }
    return { success: false, message: 'Change not found' };
  }

  export() {
    return {
      totalChanges: this.history.length,
      entries: this.history,
      exportDate: new Date().toISOString(),
    };
  }
}

// ═══════════════════════════════════════════════════════
// 5. Advanced Analytics
// ═══════════════════════════════════════════════════════
export class ProjectAnalytics {
  static analyzeProject(project) {
    return {
      summary: this.getSummary(project),
      trends: this.analyzeTrends(project),
      distribution: this.getDistribution(project),
      performance: this.evaluatePerformance(project),
      insights: this.generateInsights(project),
    };
  }

  static getSummary(project) {
    const items = project.items || [];
    return {
      totalItems: items.length,
      totalCost: items.reduce((sum, item) => sum + (item.cost || 0), 0),
      totalArea: items.reduce((sum, item) => sum + (item.area || 0), 0),
      averageItemCost: items.length > 0 
        ? items.reduce((sum, item) => sum + (item.cost || 0), 0) / items.length 
        : 0,
      mostExpensiveItem: items.reduce((max, item) => 
        (item.cost || 0) > (max.cost || 0) ? item : max
      ),
    };
  }

  static analyzeTrends(project) {
    const items = project.items || [];
    const trends = {
      costTrend: 'stable',
      volumeTrend: 'stable',
    };

    if (items.length > 1) {
      const costs = items.map(item => item.cost || 0);
      const avgFirstHalf = costs.slice(0, Math.ceil(costs.length / 2))
        .reduce((a, b) => a + b, 0) / Math.ceil(costs.length / 2);
      const avgSecondHalf = costs.slice(Math.ceil(costs.length / 2))
        .reduce((a, b) => a + b, 0) / (costs.length - Math.ceil(costs.length / 2));

      trends.costTrend = avgSecondHalf > avgFirstHalf ? 'increasing' : 'decreasing';
    }

    return trends;
  }

  static getDistribution(project) {
    const items = project.items || [];
    const distribution = {};

    items.forEach(item => {
      const type = item.type || 'other';
      distribution[type] = (distribution[type] || 0) + (item.cost || 0);
    });

    return distribution;
  }

  static evaluatePerformance(project) {
    const summary = this.getSummary(project);
    return {
      costEfficiency: summary.totalArea > 0 
        ? (summary.totalCost / summary.totalArea).toFixed(2)
        : 0,
      itemOptimization: summary.totalItems > 0
        ? (summary.totalCost / summary.totalItems).toFixed(2)
        : 0,
      dataQuality: this.calculateDataQuality(project),
    };
  }

  static calculateDataQuality(project) {
    const items = project.items || [];
    let quality = 100;

    items.forEach(item => {
      if (!item.name) quality -= 5;
      if (!item.cost) quality -= 5;
      if (!item.quantity) quality -= 3;
    });

    return Math.max(0, quality);
  }

  static generateInsights(project) {
    const insights = [];
    const summary = this.getSummary(project);
    const performance = this.evaluatePerformance(project);

    // Cost insight
    if (summary.mostExpensiveItem) {
      insights.push({
        type: 'cost',
        message: `Most expensive item: ${summary.mostExpensiveItem.name}`,
        priority: 'medium',
      });
    }

    // Efficiency insight
    if (performance.costEfficiency > 5000) {
      insights.push({
        type: 'efficiency',
        message: 'High cost per unit area - consider optimization',
        priority: 'high',
      });
    }

    // Data quality insight
    if (performance.dataQuality < 80) {
      insights.push({
        type: 'quality',
        message: 'Project data is incomplete - add missing information',
        priority: 'medium',
      });
    }

    return insights;
  }
}

// ═══════════════════════════════════════════════════════
// 6. Report Template System
// ═══════════════════════════════════════════════════════
export const reportTemplates = {
  summary: {
    name: 'Project Summary',
    description: 'Quick overview of project metrics',
    sections: ['overview', 'costs', 'timeline'],
  },
  detailed: {
    name: 'Detailed Project Report',
    description: 'Comprehensive project analysis',
    sections: ['overview', 'items', 'costs', 'materials', 'timeline', 'risks'],
  },
  financial: {
    name: 'Financial Report',
    description: 'Financial breakdown and analysis',
    sections: ['budget', 'costs', 'profit', 'cashflow'],
  },
  technical: {
    name: 'Technical Report',
    description: 'Technical specifications and requirements',
    sections: ['specifications', 'materials', 'requirements', 'standards'],
  },
};

// ═══════════════════════════════════════════════════════
// 7. Data Validation for Reports
// ═══════════════════════════════════════════════════════
export const validateProjectData = (project) => {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!project.name) errors.push('Project name is required');
  if (!project.items || project.items.length === 0) errors.push('Project must have at least one item');

  // Item validation
  project.items?.forEach((item, index) => {
    if (!item.name) warnings.push(`Item ${index + 1}: Missing name`);
    if (!item.cost) warnings.push(`Item ${index + 1}: Missing cost`);
    if (!item.quantity) warnings.push(`Item ${index + 1}: Missing quantity`);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export default {
  ExcelExporter,
  PDFReportGenerator,
  ProjectComparison,
  ChangeHistory,
  ProjectAnalytics,
  reportTemplates,
  validateProjectData,
};
