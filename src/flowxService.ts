import { ClmmPoolManager, ClmmPositionManager, ClmmPosition } from "@flowx-finance/sdk";

const poolManager = new ClmmPoolManager('mainnet');
const positionManager = new ClmmPositionManager('mainnet', poolManager);

export class FlowxService {

  constructor() {}

  async getLiquidityPositionsByWallet(address: string): Promise<any[]> {
    let resp: ClmmPosition[] = await positionManager.getUserPositions(address);
    return resp.map((pos: any) => ({
      pool_address: pos.pool?.id ?? '',
      dex: 'flowx',
      pool_symbol: pos.pool?.name ?? '',
      allocationPct: 0, // Not available, set to 0 or calculate if possible
      feeRate: pos.pool?.fee ?? undefined,
      apr: pos.pool?.day?.apr?.total ? Number(pos.pool.day.apr.total) : 0,
      aprBreakdown: {
        native: pos.pool?.day?.apr?.feeApr ? Number(pos.pool.day.apr.feeApr) : 0,
        rewards: pos.pool?.day?.apr?.rewardApr ? Number(pos.pool.day.apr.rewardApr) : 0,
      },
      tvlUsd: pos.pool?.tvl ? Number(pos.pool.tvl) : 0,
      priceRange: {
        min: pos.pool?.day?.priceMin ? Number(pos.pool.day.priceMin) : 0,
        max: pos.pool?.day?.priceMax ? Number(pos.pool.day.priceMax) : 0,
      },
      // Keep original fields for backward compatibility
      poolId: pos.pool?.id ?? '',
      owner: pos.owner ?? '',
      liquidity: pos.liquidity ? pos.liquidity.toString() : '',
      poolLiquidity: pos.pool?.liquidity ? pos.pool.liquidity.toString() : '',
      tokenA: pos.pool?.coins?.[0]?.coinType ?? '',
      tokenB: pos.pool?.coins?.[1]?.coinType ?? '',
      amountA: pos.pool?.reserves[0] ?? '',
      amountB: pos.pool?.reserves[1] ?? '',
      feeTier: pos.pool?.fee ?? undefined,
      tickLower: pos.tickLower ?? undefined,
      tickUpper: pos.tickUpper ?? undefined,
      positionId: pos.id ?? '',
      coinsOwedX: pos.coinsOwedX ? pos.coinsOwedX.toString() : '',
      coinsOwedY: pos.coinsOwedY ? pos.coinsOwedY.toString() : '',
      feeGrowthInsideXLast: pos.feeGrowthInsideXLast ? pos.feeGrowthInsideXLast.toString() : '',
      feeGrowthInsideYLast: pos.feeGrowthInsideYLast ? pos.feeGrowthInsideYLast.toString() : '',
      rewardInfos: pos.rewardInfos ?? [],
    }));
  }

  async estimateTotalProfit(address: string): Promise<any> {
    const positions: ClmmPosition[] = await positionManager.getUserPositions(address);

    let totalProfit = [];
    let totalUnclaimedFeesUSD = 0;

    for (const pos of positions) {
        console.log('Processing position:', pos);
        const pool = pos.pool;
        console.log('Associated pool:', pool.coins);

        // Unclaimed fees in raw token amounts
        const unclaimedX = pos.coinsOwedX ? Number(pos.coinsOwedX.toString()) : 0;
        const unclaimedY = pos.coinsOwedY ? Number(pos.coinsOwedY.toString()) : 0;

        // Try to get USD price if available
        let usdX = 0, usdY = 0;
        if (pool?.coins?.[0]?.derivedPriceInUSD && !isNaN(unclaimedX)) {
            usdX = unclaimedX * Number(pool.coins[0].derivedPriceInUSD);
        }
        if (pool?.coins?.[1]?.derivedPriceInUSD && !isNaN(unclaimedY)) {
            usdY = unclaimedY * Number(pool.coins[1].derivedPriceInUSD);
        }

        totalUnclaimedFeesUSD += usdX + usdY;

        totalProfit.push({
            poolId: pool?.id ?? '',
            tokenA: pool?.coins?.[0]?.coinType ?? '',
            tokenB: pool?.coins?.[1]?.coinType ?? '',
            unclaimedX,
            unclaimedY,
            unclaimedXSymbol: pool?.coins?.[0]?.coinType ?? '',
            unclaimedYSymbol: pool?.coins?.[1]?.coinType ?? '',
            unclaimedXUSD: usdX,
            unclaimedYUSD: usdY,
      });
    }

    return {
      positions: totalProfit,
      totalUnclaimedFeesUSD
    };
  }

  async getPoolById(poolId: string) {
    try {
      const pool = await poolManager.getPoolDetail(poolId);
      console.log('Fetched pool:', pool);
      return {
        id: pool.id,
        fee: pool.fee,
        liquidity: pool.liquidity.toString(),
        reserves: pool.reserves.map(r => r.toString()),
        coins: pool.coins.map(c => ({
          coinType: c.coinType,
          derivedPriceInUSD: c.derivedPriceInUSD
        }))
      };
    } catch (error) {
      console.error('Error fetching pool by ID:', error);
      throw new Error('Failed to fetch pool');
    }
  }

  async getBatchPoolStats(poolIds: string[]): Promise<any[]> {
    try {
      const results = [];
      for (const poolId of poolIds) {
        try {
          const pool = await this.getPoolById(poolId);
          results.push(pool);
        } catch (e) {
          results.push({ poolId, error: 'Failed to fetch pool' });
        }
      }
      return results;
    } catch (error) {
      console.error('Error fetching FlowX batch pool stats:', error);
      throw new Error('Failed to fetch FlowX batch pool stats');
    }
  }
}