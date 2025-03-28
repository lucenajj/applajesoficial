export interface CalculationInput {
  vigotaLength: number;
  vigotaWidth: number;
  ie: 0.4 | 0.5;
  vigotaPrice?: number;
  epsPrice?: number;
  freightCostPerMeter?: number;
  calculateFreight?: boolean;
}

export interface CalculationResult {
  vigotaCalculation: number;
  area: number;
  linearArea: number;
  vigotaPrice: number;
  epsQuantity: number;
  epsPrice: number;
  freightCost: number;
  totalCost: number;
  costPerM2: number;
  concreteVolume?: number;
  steelWeight?: number;
}

export const calculateMaterials = (input: CalculationInput): CalculationResult => {
  const {
    vigotaLength,
    vigotaWidth,
    ie,
    vigotaPrice = 14.652,
    epsPrice = 11.22,
    freightCostPerMeter = 4.646,
    calculateFreight = false
  } = input;

  // Vigota calculations
  const vigotaCalculation = vigotaWidth / ie;
  const area = vigotaLength * vigotaCalculation;
  const linearArea = vigotaCalculation * vigotaLength;
  const vigotaTotalPrice = linearArea * vigotaPrice;

  // EPS calculations
  const epsQuantityBase = vigotaLength / 1.25;
  const epsQuantity = Math.ceil(epsQuantityBase * vigotaCalculation);
  const epsTotalPrice = epsQuantity * epsPrice;

  // Freight calculation
  const freightCost = calculateFreight ? linearArea * freightCostPerMeter : 0;

  // Total costs
  const totalCost = vigotaTotalPrice + epsTotalPrice + (calculateFreight ? freightCost : 0);
  const costPerM2 = totalCost / area;

  return {
    vigotaCalculation,
    area,
    linearArea,
    vigotaPrice: vigotaTotalPrice,
    epsQuantity,
    epsPrice: epsTotalPrice,
    freightCost,
    totalCost,
    costPerM2
  };
};