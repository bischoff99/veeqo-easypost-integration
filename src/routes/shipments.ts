import { Router, Request, Response } from 'express';
import * as easypostProvider from '../providers/easypost';
import * as veeqoProvider from '../providers/veeqo';

const router = Router();

// POST /shipments/rates - Get shipping rates
router.post('/rates', async (req: Request, res: Response) => {
  try {
    const { shipment } = req.body;

    // Validate request
    if (!shipment) {
      return res.status(400).json({ error: 'Shipment data required' });
    }

    // Call EasyPost to get rates
    const rates = await easypostProvider.getRates(shipment);

    res.json({
      success: true,
      rates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve shipping rates'
    });
  }
});

// POST /shipments/buy - Purchase shipping label
router.post('/buy', async (req: Request, res: Response) => {
  try {
    const { shipment, rateId } = req.body;

    // Validate request
    if (!shipment || !rateId) {
      return res.status(400).json({ error: 'Shipment data and rate ID required' });
    }

    // Purchase label via EasyPost
    const label = await easypostProvider.buyLabel(shipment, rateId);

    // Update Veeqo with tracking info (placeholder)
    await veeqoProvider.updateShipment(shipment.veeqoOrderId, label);

    res.json({
      success: true,
      label,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error buying label:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase shipping label'
    });
  }
});

export default router;
