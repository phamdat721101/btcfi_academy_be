export interface LiquidityPosition {
  poolId: string;
  owner: string;
  liquidity: string;
  poolLiquidity: string;
  tokenA: string;
  tokenB: string;
  amountA: string;
  amountB: string;
  feeTier?: number;
  tickLower?: number;
  tickUpper?: number;
  [key: string]: any; // For any additional fields
}