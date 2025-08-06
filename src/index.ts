import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BluefinService } from './bluefinService';
import { FlowxService } from './flowxService';
import { PayToLearnService } from './payToLearnService';
import { TransactionService } from './transactionService';

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const bluefinService = new BluefinService();
const flowxService = new FlowxService();
const payToLearnService = new PayToLearnService();
const transactionService = new TransactionService();

app.get('/api/', async (req, res) => {
  res.json("Hello Nim");
});

// Create a package
app.post('/api/pay/package', async (req, res) => {
  try {
    const { id, priceWei, name, ipfsHash } = req.body;
    const result = await payToLearnService.createPackage({ id, priceWei, name, ipfsHash });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create package', details: err });
  }
});

// Update a package
app.put('/api/pay/package/:id', async (req, res) => {
  try {
    const result = await payToLearnService.updatePackage(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update package', details: err });
  }
});

// Delete a package
app.delete('/api/pay/package/:id', async (req, res) => {
  try {
    const result = await payToLearnService.deletePackage(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete package', details: err });
  }
});

// Get all packages
app.get('/api/pay/packages', async (req, res) => {
  try {
    const packages = await payToLearnService.getAvailablePackages();
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch packages', details: err });
  }
});

app.get('/api/pay/package/:id', async (req, res) => {
  try {
    const pkg = await payToLearnService.getPackage(req.params.id);
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch package', details: err });
  }
});

// Select style
app.post('/api/pay/user/:address/style', async (req, res) => {
  try {
    const { style } = req.body;
    const result = await payToLearnService.selectStyle(req.params.address, style);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to select style', details: err });
  }
});

// Get user style
app.get('/api/pay/user/:address/style', async (req, res) => {
  try {
    const style = await payToLearnService.getUserStyle(req.params.address);
    res.json({ style });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user style', details: err });
  }
});

// Log a user purchase
app.post('/api/pay/user/:address/purchase', async (req, res) => {
  try {
    const { packageId, priceWei, txHash, style, ipfsHash, packageName } = req.body;
    const tx = {
      user_address: req.params.address,
      package_id: packageId,
      pricewei: priceWei,
      tx_hash: txHash,
      timestamp: new Date().toISOString(),
      style,
      ipfshash:ipfsHash,
      packagename:packageName,
    };
    const result = await payToLearnService.logPurchase(tx);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log purchase', details: err });
  }
});

// Get purchased packages for a user
app.get('/api/pay/user/:address/purchases', async (req, res) => {
  try {
    const ids = await payToLearnService.getPurchasedPackages(req.params.address);
    res.json(ids);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user purchases', details: err });
  }
});

// Check if user has purchased a package
app.get('/api/pay/user/:address/hasPurchased/:packageId', async (req, res) => {
  try {
    const purchased = await payToLearnService.hasPurchased(req.params.address, req.params.packageId);
    res.json({ purchased });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check purchase', details: err });
  }
});

// Get all transactions for a user
app.get('/api/pay/user/:address/transactions', async (req, res) => {
  try {
    const txs = await transactionService.getUserTransactions(req.params.address);
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user transactions', details: err });
  }
});

// Get all transactions (admin)
app.get('/api/pay/transactions', async (req, res) => {
  try {
    const txs = await transactionService.getAllTransactions();
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions', details: err });
  }
});

// Only start server if not running in Vercel (local dev)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Pool Service API running on port ${PORT}`);
  });
}

export default app;