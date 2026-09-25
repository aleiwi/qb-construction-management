// Concrete calculations
export const calculateConcrete = (length, width, height, ratio = { cement: 1, sand: 2, aggregate: 4 }) => {
  const volume = length * width * height;
  
  // Calculate materials based on ratio (1:2:4 is standard)
  const cement = volume * ratio.cement * 7; // 7 bags per cubic meter
  const sand = volume * ratio.sand * 0.42; // 0.42 m³ per cubic meter
  const aggregate = volume * ratio.aggregate * 0.84; // 0.84 m³ per cubic meter
  const water = volume * 200; // 200 liters per cubic meter
  
  return {
    volume: volume,
    materials: {
      cement: {
        quantity: cement,
        unit: 'bags'
      },
      sand: {
        quantity: sand,
        unit: 'm³'
      },
      aggregate: {
        quantity: aggregate,
        unit: 'm³'
      },
      water: {
        quantity: water,
        unit: 'liters'
      }
    }
  };
};

// Steel calculations
export const calculateSteel = (length, width, height, type = 'default') => {
  const volume = length * width * height;
  
  // Steel weight per cubic meter based on type
  const steelRates = {
    beam: 120, // kg per cubic meter
    column: 150,
    slab: 80,
    foundation: 70,
    default: 100
  };
  
  const steelWeight = volume * (steelRates[type] || steelRates.default);
  
  // Calculate number of bars (assuming 12mm diameter, 12m length)
  const barWeight = 0.888; // kg per meter for 12mm bar
  const barLength = 12; // meters
  const numberOfBars = Math.ceil(steelWeight / (barWeight * barLength));
  
  return {
    volume: volume,
    steelWeight: steelWeight,
    numberOfBars: numberOfBars,
    details: {
      barDiameter: '12mm',
      barLength: barLength + 'm',
      barWeight: barWeight + 'kg/m'
    }
  };
};

// Brick calculations
export const calculateBrick = (length, height, thickness, brickSize = { length: 0.23, height: 0.075, width: 0.112 }) => {
  // Default brick size in meters (standard red brick)
  const brickLength = brickSize.length;
  const brickHeight = brickSize.height;
  const brickWidth = brickSize.width;
  
  // Calculate wall area
  const wallArea = length * height;
  
  // Calculate brick volume with mortar (assume 10mm mortar)
  const brickWithMortarLength = brickLength + 0.01;
  const brickWithMortarHeight = brickHeight + 0.01;
  const brickVolume = brickWithMortarLength * brickWithMortarHeight * brickWidth;
  
  // Calculate number of bricks
  const numberOfBricks = Math.ceil(wallArea / (brickWithMortarLength * brickWithMortarHeight));
  
  // Calculate mortar volume
  const mortarVolume = (wallArea * thickness) - (numberOfBricks * brickLength * brickHeight * brickWidth);
  
  // Calculate cement and sand for mortar (1:6 ratio)
  const cement = mortarVolume * 1.5 / 0.0347; // 1.5 bags per cubic meter
  const sand = mortarVolume * 0.06; // 0.06 m³ per cubic meter
  
  return {
    wallArea: wallArea,
    numberOfBricks: numberOfBricks,
    mortar: {
      volume: mortarVolume,
      cement: {
        quantity: cement,
        unit: 'bags'
      },
      sand: {
        quantity: sand,
        unit: 'm³'
      }
    }
  };
};

// Finishing calculations
export const calculateFinishing = (length, width, height, type = 'paint') => {
  // Calculate areas
  const floorArea = length * width;
  const ceilingArea = floorArea;
  const wallArea = 2 * (length + width) * height;
  const totalArea = floorArea + ceilingArea + wallArea;
  
  // Calculate materials based on type
  let materials = {};
  
  switch (type) {
    case 'paint':
      materials = {
        paint: {
          quantity: totalArea / 10, // 10m² per liter
          unit: 'liters'
        },
        primer: {
          quantity: totalArea / 15, // 15m² per liter
          unit: 'liters'
        },
        putty: {
          quantity: totalArea / 5, // 5m² per kg
          unit: 'kg'
        }
      };
      break;
    case 'tiles':
      materials = {
        tiles: {
          quantity: floorArea / 0.09, // 30x30cm tiles
          unit: 'pieces'
        },
        adhesive: {
          quantity: floorArea * 2, // 2kg per m²
          unit: 'kg'
        },
        grout: {
          quantity: floorArea * 0.5, // 0.5kg per m²
          unit: 'kg'
        }
      };
      break;
    case 'plaster':
      materials = {
        cement: {
          quantity: totalArea * 0.3, // 0.3 bags per m²
          unit: 'bags'
        },
        sand: {
          quantity: totalArea * 0.02, // 0.02 m³ per m²
          unit: 'm³'
        },
        plaster: {
          quantity: totalArea * 15, // 15kg per m²
          unit: 'kg'
        }
      };
      break;
    default:
      materials = {
        material: {
          quantity: totalArea,
          unit: 'm²'
        }
      };
  }
  
  return {
    areas: {
      floor: floorArea,
      ceiling: ceilingArea,
      wall: wallArea,
      total: totalArea
    },
    materials: materials
  };
};

// Cost calculations
export const calculateCosts = (materials, laborRate = 0.4, equipmentRate = 0.2, overheadRate = 0.15) => {
  const materialsCost = materials.reduce((sum, material) => sum + material.totalPrice, 0);
  const laborCost = materialsCost * laborRate;
  const equipmentCost = materialsCost * equipmentRate;
  const overhead = (materialsCost + laborCost + equipmentCost) * overheadRate;
  const totalCost = materialsCost + laborCost + equipmentCost + overhead;
  
  return {
    materials: materialsCost,
    labor: laborCost,
    equipment: equipmentCost,
    overhead: overhead,
    total: totalCost
  };
};

// Format currency
export const formatCurrency = (amount, currency = 'SAR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format number with thousands separator
export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};