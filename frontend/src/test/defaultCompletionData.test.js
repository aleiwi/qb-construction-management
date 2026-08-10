import { describe, it, expect } from 'vitest';
import {
  defaultCompletionData,
  createEmptyCompletionData,
  calcStructureProgress,
  calcFinishingProgress,
  calcOverallProgress,
  calcSectorProgress,
  formatCurrency,
} from '../components/completion/defaultCompletionData';

describe('defaultCompletionData (reference: cp.pdf — مسقا 32)', () => {
  it('has the approved project name', () => {
    expect(defaultCompletionData.projectName).toBe('مشروع مسقا 32');
  });

  it('has 29 structure items', () => {
    expect(defaultCompletionData.structureItems).toHaveLength(29);
  });

  it('has 29 finishing items', () => {
    expect(defaultCompletionData.finishingItems).toHaveLength(29);
  });

  it('has 8 finishing sectors', () => {
    expect(defaultCompletionData.finishingSectors).toHaveLength(8);
  });

  it('has 9 payment schedules', () => {
    expect(defaultCompletionData.paymentsSchedule).toHaveLength(9);
  });

  it('each structure item has id, name, progress', () => {
    defaultCompletionData.structureItems.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(typeof item.progress).toBe('number');
    });
  });

  it('each finishing item references a valid sector', () => {
    const sectorIds = defaultCompletionData.finishingSectors.map(s => s.id);
    defaultCompletionData.finishingItems.forEach(item => {
      expect(sectorIds).toContain(item.sectorId);
    });
  });

  it('payments ratios sum to 100', () => {
    const total = defaultCompletionData.paymentsSchedule.reduce((s, p) => s + p.ratio, 0);
    expect(total).toBe(100);
  });

  it('payments have required fields', () => {
    defaultCompletionData.paymentsSchedule.forEach(p => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('ratio');
      expect(p).toHaveProperty('contractorVal');
      expect(p).toHaveProperty('paid');
    });
  });

  it('has budget fields matching cp.pdf', () => {
    expect(defaultCompletionData.contractorBudget).toBe(49452000);
    expect(defaultCompletionData.developerBudget).toBe(7417500);
    expect(defaultCompletionData.totalBudget).toBe(56869500);
  });

  it('sector item counts match cp.pdf (7/5/2/1/6/6/1/1)', () => {
    const counts = defaultCompletionData.finishingSectors.map(
      (s) => defaultCompletionData.finishingItems.filter((f) => f.sectorId === s.id).length
    );
    expect(counts).toEqual([7, 5, 2, 1, 6, 6, 1, 1]);
  });

  it('all structure items are 100% complete (cp.pdf page 4)', () => {
    expect(defaultCompletionData.structureItems.every((it) => it.progress === 100)).toBe(true);
  });

  it('paid payments total matches cp.pdf (39,807,250)', () => {
    const paid = defaultCompletionData.paymentsSchedule
      .filter((p) => p.paid)
      .reduce((s, p) => s + (p.totalVal || p.contractorVal + p.devVal), 0);
    expect(paid).toBe(39807250);
  });

  it('paid count is 5 (cp.pdf page 6)', () => {
    expect(defaultCompletionData.paymentsSchedule.filter((p) => p.paid)).toHaveLength(5);
  });
});

describe('createEmptyCompletionData', () => {
  it('pre-fills with cp.pdf reference data', () => {
    const empty = createEmptyCompletionData();
    expect(empty.projectName).toBe('مشروع مسقا 32');
    expect(empty.structureItems).toHaveLength(29);
    expect(empty.finishingItems).toHaveLength(29);
    expect(empty.paymentsSchedule).toHaveLength(9);
    expect(empty.structureItems.every((it) => it.progress === 100)).toBe(true);
    expect(empty.photoGallery).toEqual([]);
  });

  it('returns a deep copy (no shared references)', () => {
    const a = createEmptyCompletionData();
    const b = createEmptyCompletionData();
    a.structureItems[0].progress = 55;
    a.paymentsSchedule[0].paid = false;
    a.finishingSectors[0].progress = 0;
    expect(b.structureItems[0].progress).toBe(100);
    expect(b.paymentsSchedule[0].paid).toBe(true);
    expect(b.finishingSectors[0].progress).toBe(51);
    expect(a).not.toBe(b);
    expect(a.structureItems).not.toBe(b.structureItems);
  });
});

describe('calcStructureProgress', () => {
  it('returns 0 for empty array', () => {
    expect(calcStructureProgress([])).toBe(0);
  });

  it('returns 0 when all progress is 0', () => {
    expect(calcStructureProgress([{ progress: 0 }, { progress: 0 }])).toBe(0);
  });

  it('returns 100 when all progress is 100', () => {
    expect(calcStructureProgress([{ progress: 100 }, { progress: 100 }])).toBe(100);
  });

  it('averages partial progress correctly', () => {
    expect(calcStructureProgress([{ progress: 0 }, { progress: 100 }])).toBe(50);
  });

  it('calculates real data average correctly', () => {
    const avg = calcStructureProgress(defaultCompletionData.structureItems);
    expect(avg).toBeGreaterThan(0);
    expect(avg).toBeLessThanOrEqual(100);
  });
});

describe('calcFinishingProgress', () => {
  it('returns 0 for empty array', () => {
    expect(calcFinishingProgress([])).toBe(0);
  });

  it('averages correctly', () => {
    expect(calcFinishingProgress([{ progress: 75 }, { progress: 25 }])).toBe(50);
  });

  it('calculates real data average', () => {
    const avg = calcFinishingProgress(defaultCompletionData.finishingItems);
    expect(avg).toBeGreaterThanOrEqual(0);
    expect(avg).toBeLessThanOrEqual(100);
  });
});

describe('calcOverallProgress', () => {
  it('returns 0 when both are empty', () => {
    expect(calcOverallProgress([], [])).toBe(0);
  });

  it('returns 50 when structure is 100 and finishing is 0', () => {
    const result = calcOverallProgress([{ progress: 100 }], [{ progress: 0 }]);
    expect(result).toBe(50);
  });

  it('returns 100 when both are 100', () => {
    const result = calcOverallProgress([{ progress: 100 }], [{ progress: 100 }]);
    expect(result).toBe(100);
  });
});

describe('calcSectorProgress', () => {
  it('returns 0 for unknown sector', () => {
    expect(calcSectorProgress('unknown', [])).toBe(0);
  });

  it('averages items within a sector', () => {
    const items = [
      { sectorId: 's1', progress: 10 },
      { sectorId: 's1', progress: 30 },
      { sectorId: 's2', progress: 100 },
    ];
    expect(calcSectorProgress('s1', items)).toBe(20);
  });
});

describe('formatCurrency', () => {
  it('formats numbers with Arabic locale', () => {
    const result = formatCurrency(1250000);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBeTruthy();
  });

  it('handles undefined', () => {
    expect(formatCurrency(undefined)).toBeTruthy();
  });
});
