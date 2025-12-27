/**
 * Price Calculator - SOLID & DRY
 * Calcula Entry, Stop Loss y Take Profit basados en ATR
 */

export interface PriceLevel {
  entry: number;
  stopLoss: number;
  takeProfit: number;
}

export interface ATRConfig {
  atrMultiplierSL: number; // e.g., 1.5
  atrMultiplierTP: number; // e.g., 3.5
}

/**
 * Calcula niveles de precio basados en ATR
 * SOLID: Single Responsibility - Solo calcula precios
 */
export class ATRPriceCalculator {
  private config: ATRConfig;

  constructor(config: ATRConfig) {
    this.config = config;
  }

  /**
   * Calcula entry, SL, TP para señal BUY
   */
  calculateBuyLevels(currentPrice: number, atr: number): PriceLevel {
    const entry = currentPrice;
    const stopLoss = entry - (atr * this.config.atrMultiplierSL);
    const takeProfit = entry + (atr * this.config.atrMultiplierTP);

    return { entry, stopLoss, takeProfit };
  }

  /**
   * Calcula entry, SL, TP para señal SELL
   */
  calculateSellLevels(currentPrice: number, atr: number): PriceLevel {
    const entry = currentPrice;
    const stopLoss = entry + (atr * this.config.atrMultiplierSL);
    const takeProfit = entry - (atr * this.config.atrMultiplierTP);

    return { entry, stopLoss, takeProfit };
  }

  /**
   * DRY: Método unificado que detecta la dirección automáticamente
   */
  calculateLevels(signal: 'BUY' | 'SELL', currentPrice: number, atr: number): PriceLevel {
    if (signal === 'BUY') {
      return this.calculateBuyLevels(currentPrice, atr);
    } else {
      return this.calculateSellLevels(currentPrice, atr);
    }
  }
}

/**
 * Valida que los niveles de precio sean lógicos
 * SOLID: Single Responsibility - Solo valida
 */
export class PriceLevelValidator {
  validate(signal: 'BUY' | 'SELL', levels: PriceLevel): void {
    // Todos los precios deben ser positivos
    if (levels.entry <= 0 || levels.stopLoss <= 0 || levels.takeProfit <= 0) {
      throw new Error('All price levels must be positive');
    }

    if (signal === 'BUY') {
      // BUY: SL debe estar DEBAJO de entry, TP ARRIBA
      if (levels.stopLoss >= levels.entry) {
        throw new Error(`BUY: Stop Loss (${levels.stopLoss}) must be below Entry (${levels.entry})`);
      }
      if (levels.takeProfit <= levels.entry) {
        throw new Error(`BUY: Take Profit (${levels.takeProfit}) must be above Entry (${levels.entry})`);
      }
    } else {
      // SELL: SL debe estar ARRIBA de entry, TP DEBAJO
      if (levels.stopLoss <= levels.entry) {
        throw new Error(`SELL: Stop Loss (${levels.stopLoss}) must be above Entry (${levels.entry})`);
      }
      if (levels.takeProfit >= levels.entry) {
        throw new Error(`SELL: Take Profit (${levels.takeProfit}) must be below Entry (${levels.entry})`);
      }
    }
  }

  /**
   * Calcula y valida el Risk:Reward ratio
   */
  calculateRiskReward(levels: PriceLevel): number {
    const risk = Math.abs(levels.entry - levels.stopLoss);
    const reward = Math.abs(levels.takeProfit - levels.entry);
    return risk > 0 ? reward / risk : 0;
  }
}

/**
 * Servicio principal que combina cálculo + validación
 * SOLID: Open/Closed - Abierto a extensión, cerrado a modificación
 */
export class TradingPriceService {
  constructor(
    private calculator: ATRPriceCalculator,
    private validator: PriceLevelValidator
  ) {}

  /**
   * Calcula y valida niveles de precio en un solo paso
   */
  calculateAndValidate(
    signal: 'BUY' | 'SELL',
    currentPrice: number,
    atr: number
  ): { levels: PriceLevel; riskReward: number } {
    // 1. Calcular niveles
    const levels = this.calculator.calculateLevels(signal, currentPrice, atr);

    // 2. Validar niveles
    this.validator.validate(signal, levels);

    // 3. Calcular R:R
    const riskReward = this.validator.calculateRiskReward(levels);

    return { levels, riskReward };
  }
}