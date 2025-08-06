import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BluefinService } from './bluefinService';
import { FlowxService } from './flowxService';

dotenv.config();

const app = express();
// Allow CORS for all origins
app.use(cors({ origin: '*' }));
app.use(express.json());

const bluefinService = new BluefinService();
const flowxService = new FlowxService();

app.get('/', async (req, res) => {
  res.json("Hello Nim");
});

app.get('/api/bluefin/liquidity-positions', async (req, res) => {
  const address = req.query.address as string;
  if (!address) {
    res.status(400).json({ error: 'Missing wallet address' });
    return;
  }
  try {
    const positions = await bluefinService.getLiquidityPositionsByWallet(address);
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch liquidity positions', details: error });
  }
});

app.get('/api/flowx/liquidity-positions', async (req, res) => {
  const address = req.query.address as string;
  if (!address) {
    res.status(400).json({ error: 'Missing wallet address' });
    return;
  }
  try {
    const positions = await flowxService.getLiquidityPositionsByWallet(address);
    // Serialize only the necessary data (e.g., toJSON or pick fields)
    const safePositions = JSON.parse(JSON.stringify(positions, (key, value) => {
      // Remove problematic properties or filter as needed
      if (typeof value === 'object' && value !== null && value.constructor && value.constructor.name === 'SuiClient') {
        return undefined;
      }
      return value;
    }));
    res.json(safePositions);
  } catch (error) {
    console.error('Error fetching liquidity positions:', error);
    res.status(500).json({ error: 'Failed to fetch liquidity positions', details: error });
  }
});

app.get('/api/flowx/position-value', async (req, res) => {
  const address = req.query.address as string;
  if (!address) {
    res.status(400).json({ error: 'Missing wallet address' });
    return;
  }
  try {
    const value = await flowxService.estimateTotalProfit(address);
    res.json(JSON.parse(JSON.stringify(value, (key, value) => {
      // Remove problematic properties or filter as needed
      if (typeof value === 'object' && value !== null && value.constructor && value.constructor.name === 'SuiClient') {
        return undefined;
      }
      return value;
    })));  
  } catch (error) {
    console.error('Error fetching position value:', error);
    res.status(500).json({ error: 'Failed to fetch position value', details: error });
  }
});

// Get market data for a specific pool contract
app.get('/api/pools/:pool_address/stats', async (req, res) => {
  const poolId = req.params.pool_address;
  const source = req.query.source as string || 'bluefin'; // 'bluefin' or 'flowx'
  try {
    let stats;
    if (source === 'flowx') {
      stats = await flowxService.getPoolById(poolId);
    } else {
      stats = await bluefinService.getPoolDetail(poolId);
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pool stats', details: error instanceof Error ? error.message : error });
  }
});

// Get data for multiple pool contracts (POST with pool address array)
app.post('/api/pools/batch', async (req, res) => {
  const { poolIds, source } = req.body;
  if (!Array.isArray(poolIds) || poolIds.length === 0) {
    res.status(400).json({ error: 'poolIds must be a non-empty array' });
    return;
  }
  try {
    let stats;
    if (source === 'flowx') {
      stats = await flowxService.getBatchPoolStats(poolIds);
    } else {
      stats = await bluefinService.getBatchPoolStats(poolIds);
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batch pool stats', details: error instanceof Error ? error.message : error });
  }
});

app.get('/api/liquidity-positions', async (req, res) => {
  const address = req.query.address as string;
  if (!address) {
    res.status(400).json({ error: 'Missing wallet address' });
    return;
  }
  try {
    // Fetch from both services in parallel
    const [bluefinPositions, flowxPositions] = await Promise.all([
      bluefinService.getLiquidityPositionsByWallet(address),
      flowxService.getLiquidityPositionsByWallet(address)
    ]);
    res.json({
      bluefin: bluefinPositions,
      flowx: flowxPositions
    });
  } catch (error) {
    console.error('Error fetching combined liquidity positions:', error);
    res.status(500).json({ error: 'Failed to fetch combined liquidity positions', details: error });
  }
});

// Only start server if not running in Vercel (local dev)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Pool Service API running on port ${PORT}`);
  });
}

// Vercel handler export
export default app;