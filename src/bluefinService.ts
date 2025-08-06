import { QueryChain } from "@firefly-exchange/library-sui/dist/src/spot";
import { SuiClient } from "@firefly-exchange/library-sui";
import { mainnet } from '../utils/config'
import { TickMath, ClmmPoolUtil } from "@firefly-exchange/library-sui/dist/src/spot/clmm";
import { BN } from "bn.js";
import axios from 'axios';

const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io:443" });

export class BluefinService {

  constructor() {}

  async getLiquidityPositionsByWallet(address: string): Promise<any[]> {
    let qc = new QueryChain(client);
    let resp = await qc.getUserPositions(mainnet.BasePackage, address);

    const positions: any[] = [];
    for (const pos of resp) {
      const posInfo = await qc.getPositionDetails(pos.position_id);
      const poolInfo = await qc.getPool(pos.pool_id);

      let lowerSqrtPrice = TickMath.tickIndexToSqrtPriceX64(pos.lower_tick)
      let upperSqrtPrice = TickMath.tickIndexToSqrtPriceX64(pos.upper_tick)

      const coinAmounts = ClmmPoolUtil.getCoinAmountFromLiquidity(
        new BN(pos.liquidity),
        new BN(poolInfo.current_sqrt_price),
        lowerSqrtPrice,
        upperSqrtPrice,
        false
      );

      // Map to LPPosition fields
      positions.push({
        pool_address: pos.pool_id ?? '',
        dex: 'bluefin',
        pool_symbol: `${poolInfo?.coin_a?.address} - ${poolInfo?.coin_b?.address}`,
        allocationPct: 0, // Not available, set to 0 or calculate if possible
        feeRate: pos.fee_rate ?? undefined,
        apr: poolInfo?.rewardsInfo ?? 0,
        aprBreakdown: {
          native: pos?.fee_rate ?? 0,
          rewards: pos?.fee_growth_coin_a + pos?.fee_growth_coin_b,
        },
        tvlUsd: pos?.liquidity ?? 0,
        priceRange: {
          min: pos?.lower_tick ?? 0,
          max: pos?.upper_tick ?? 0,
        },
        // Keep original fields for backward compatibility
        poolId: pos.pool_id ?? '',
        owner: pos.owner ?? '',
        liquidity: pos.liquidity ? pos.liquidity.toString() : '',
        poolLiquidity: posInfo?.liquidity ? posInfo.liquidity.toString() : '',
        tokenA: poolInfo?.coin_a?.address ?? '',
        tokenB: poolInfo?.coin_b?.address ?? '',
        amountA: coinAmounts.coinA.toString() ?? '',
        amountB: coinAmounts.coinB.toString() ?? '',
        feeTier: pos.fee_rate ?? undefined,
        tickLower: pos.lower_tick ?? undefined,
        tickUpper: pos.upper_tick ?? undefined,
        positionId: pos.position_id ?? '',
        coinsOwedX: pos.token_a_fee ? pos.token_a_fee.toString() : '',
        coinsOwedY: pos.token_b_fee ? pos.token_b_fee.toString() : '',
        feeGrowthInsideXLast: pos.fee_growth_coin_a ? pos.fee_growth_coin_a.toString() : '',
        feeGrowthInsideYLast: pos.fee_growth_coin_b ? pos.fee_growth_coin_b.toString() : '',
        rewardInfos: [],
      });
    }
    return positions;
  }

  async getPoolDetail(poolId: string): Promise<any> {
    try {
      const url = `https://swap.api.sui-prod.bluefin.io/api/v1/pools/info?pools=${poolId}`;
      const response = await axios.get(url, { headers: { accept: 'application/json' } });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }
      throw new Error('Pool not found');
    } catch (error) {
      console.error('Error fetching Bluefin pool detail:', error);
      throw new Error('Failed to fetch Bluefin pool detail');
    }
  }

  async getBatchPoolStats(poolIds: string[]): Promise<any[]> {
    try {
      const url = `https://swap.api.sui-prod.bluefin.io/api/v1/pools/info?pools=${poolIds.join(',')}`;
      const response = await axios.get(url, { headers: { accept: 'application/json' } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching Bluefin batch pool stats:', error);
      throw new Error('Failed to fetch Bluefin batch pool stats');
    }
  }
}