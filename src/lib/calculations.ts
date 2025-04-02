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
  const linearArea = vigotaCalculation * vigotaLength;
  const vigotaTotalPrice = linearArea * vigotaPrice;

  // Área real (total) = comprimento x largura
  const totalArea = vigotaLength * vigotaWidth;
  
  console.log(`=====================`);
  console.log(`CÁLCULO DO CUSTO POR M²`);
  console.log(`Dimensões: ${vigotaWidth}m × ${vigotaLength}m`);
  console.log(`Área Linear: ${linearArea.toFixed(2)} m²`);
  console.log(`Área Total: ${totalArea.toFixed(2)} m²`);

  // EPS calculations
  const epsQuantityBase = vigotaLength / 1.25;
  const epsQuantity = Math.ceil(epsQuantityBase * vigotaCalculation);
  const epsTotalPrice = epsQuantity * epsPrice;

  // Freight calculation - sempre calcula o valor do frete
  const freightCost = linearArea * freightCostPerMeter;

  // Total costs - só inclui o frete no total se calculateFreight for true
  const totalCost = vigotaTotalPrice + epsTotalPrice + (calculateFreight ? freightCost : 0);
  
  // Usar a área total para o cálculo do custo por m²
  const costPerM2 = totalCost / totalArea;
  
  console.log(`Custo Vigotas: R$ ${vigotaTotalPrice.toFixed(2)}`);
  console.log(`Custo EPS: R$ ${epsTotalPrice.toFixed(2)}`);
  console.log(`Custo Frete: R$ ${freightCost.toFixed(2)} (${calculateFreight ? 'incluído' : 'não incluído'} no total)`);
  console.log(`Custo Total: R$ ${totalCost.toFixed(2)}`);
  console.log(`Custo por m² (área total): R$ ${costPerM2.toFixed(2)}`);
  console.log(`Custo por m² (área linear): R$ ${(totalCost / linearArea).toFixed(2)}`);
  console.log(`=====================`);

  return {
    vigotaCalculation,
    area: totalArea, // Retornar a área total em vez da linear
    linearArea,
    vigotaPrice: vigotaTotalPrice,
    epsQuantity,
    epsPrice: epsTotalPrice,
    freightCost,
    totalCost,
    costPerM2
  };
};