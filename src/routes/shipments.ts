import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import * as easypostProvider from '../providers/easypost';
import * as veeqoProvider from '../providers/veeqo';
import { normalizeRate } from '../utils/normalize';
import { applyPolicy } from '../utils/policy';

const router = Router();

// Validation schemas
const AddressSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  street1: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  zip: z.string(),
  country: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

const ParcelSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  weight: z.number().positive(),
});

const RatesRequestSchema = z.object({
  orderId: z.string().optional(),
  toAddress: AddressSchema.optional(),
  fromAddress: AddressSchema.optional(),
  parcel: ParcelSchema.optional(),
  policy: z.object({
    preferred_carriers: z.array(z.string()).optional(),
    max_price: z.number().optional(),
    max_days: z.number().optional(),
  }).optional(),
  filters: z.object({
    carrier: z.string().optional(),
    service: z.string().optional(),
  }).optional(),
});

const BuyRequestSchema = z.object({
  provider: z.enum(['easypost', 'veeqo']),
  selection: z.object({
    shipmentId: z.string().optional(),
    rateId: z.string().optional(),
    allocationId: z.number().optional(),
    carrierId: z.number().optional(),
    serviceCode: z.string().optional(),
  }),
  context: z.object({
    orderId: z.string().optional(),
    label_format: z.string().optional(),
  }).optional(),
});

/**
 * POST /shipments/rates
 * Get unified shipping rates from multiple providers
 */
router.post('/rates', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validationResult = RatesRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { orderId, toAddress, fromAddress, parcel, policy, filters } = validationResult.data;

    // Determine addresses
    let finalToAddress = toAddress;
    let finalFromAddress = fromAddress;
    let veeqoOrder = null;

    // If orderId is provided, fetch from Veeqo
    if (orderId) {
      try {
        veeqoOrder = await veeqoProvider.getOrder(orderId);
        
        // Use Veeqo delivery address if not provided
        if (!finalToAddress && veeqoOrder.deliver_to) {
          finalToAddress = {
            name: `${veeqoOrder.customer.first_name} ${veeqoOrder.customer.last_name}`,
            street1: veeqoOrder.deliver_to.address1,
            street2: veeqoOrder.deliver_to.address2,
            city: veeqoOrder.deliver_to.city,
            state: veeqoOrder.deliver_to.state,
            zip: veeqoOrder.deliver_to.zip,
            country: veeqoOrder.deliver_to.country,
            phone: veeqoOrder.deliver_to.phone,
            email: veeqoOrder.customer.email,
          };
        }
      } catch (error: any) {
        console.error('Failed to fetch Veeqo order:', error.message);
        // Continue without Veeqo data
      }
    }

    // Validate required data
    if (!finalToAddress || !finalFromAddress || !parcel) {
      return res.status(400).json({
        success: false,
        error: 'Missing required data: toAddress, fromAddress, and parcel are required',
      });
    }

    // Fetch rates from providers in parallel
    const ratesPromises: Promise<any>[] = [];

    // EasyPost rates
    ratesPromises.push(
      (async () => {
        try {
          const result = await easypostProvider.getShipmentRates({
            to_address: finalToAddress,
            from_address: finalFromAddress,
            parcel,
          });
          return {
            provider: 'easypost',
            rates: result.rates,
            shipmentId: result.shipment.id,
          };
        } catch (error: any) {
          console.error('EasyPost rates error:', error.message);
          return { provider: 'easypost', rates: [], error: error.message };
        }
      })()
    );

    // Veeqo quotes (if order with allocation exists)
    if (veeqoOrder?.allocations && veeqoOrder.allocations.length > 0) {
      ratesPromises.push(
        (async () => {
          try {
            const quotes = await veeqoProvider.getQuotes(veeqoOrder!.allocations![0].id);
            return {
              provider: 'veeqo',
              rates: quotes,
              allocationId: veeqoOrder!.allocations![0].id,
            };
          } catch (error: any) {
            console.error('Veeqo quotes error:', error.message);
            return { provider: 'veeqo', rates: [], error: error.message };
          }
        })()
      );
    }

    // Wait for all providers
    const results = await Promise.all(ratesPromises);

    // Normalize and combine rates
    let allRates: any[] = [];
    results.forEach(result => {
      if (result.rates && result.rates.length > 0) {
        const normalized = result.rates.map((rate: any) => 
          normalizeRate(rate, result.provider, {
            shipmentId: result.shipmentId,
            allocationId: result.allocationId,
          })
        );
        allRates = allRates.concat(normalized);
      }
    });

    // Apply policy filters
    if (policy) {
      allRates = applyPolicy(allRates, policy);
    }

    // Apply additional filters
    if (filters) {
      if (filters.carrier) {
        allRates = allRates.filter(r => 
          r.carrier.toLowerCase().includes(filters.carrier!.toLowerCase())
        );
      }
      if (filters.service) {
        allRates = allRates.filter(r => 
          r.service.toLowerCase().includes(filters.service!.toLowerCase())
        );
      }
    }

    // Sort by price
    allRates.sort((a, b) => a.price - b.price);

    res.json({
      success: true,
      rates: allRates,
      metadata: {
        total_count: allRates.length,
        providers: results.map(r => r.provider),
        order_id: orderId,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error getting rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve shipping rates',
      message: error.message,
    });
  }
});

/**
 * POST /shipments/buy
 * Purchase a shipping label from selected provider
 */
router.post('/buy', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validationResult = BuyRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { provider, selection, context } = validationResult.data;

    // Generate idempotency key
    const idempotencyData = JSON.stringify({ provider, selection, context });
    const idempotencyKey = crypto.createHash('sha256').update(idempotencyData).digest('hex');

    // Add idempotency key to headers for logging
    res.setHeader('X-Idempotency-Key', idempotencyKey);

    let result: any;

    if (provider === 'easypost') {
      // Buy label via EasyPost
      if (!selection.shipmentId || !selection.rateId) {
        return res.status(400).json({
          success: false,
          error: 'shipmentId and rateId required for EasyPost',
        });
      }

      const label = await easypostProvider.buyLabel(
        selection.shipmentId,
        selection.rateId,
        context?.label_format || 'PDF'
      );

      result = {
        provider: 'easypost',
        shipment: label,
        tracking_number: label.tracking_code,
        label_url: label.postage_label?.label_url,
      };

      // Update Veeqo if orderId provided
      if (context?.orderId) {
        try {
          const veeqoOrder = await veeqoProvider.getOrder(context.orderId);
          if (veeqoOrder.allocations && veeqoOrder.allocations.length > 0) {
            const allocationId = veeqoOrder.allocations[0].id;
            await veeqoProvider.updateShipment(
              context.orderId,
              allocationId,
              {
                tracking_number: label.tracking_code,
                carrier: label.selected_rate?.carrier,
                service: label.selected_rate?.service,
                note: `EasyPost Label: ${label.postage_label?.label_url}`,
              }
            );
          }
        } catch (error: any) {
          console.error('Failed to update Veeqo:', error.message);
          // Don't fail the request if Veeqo update fails
        }
      }

    } else if (provider === 'veeqo') {
      // Buy label via Veeqo
      if (!selection.allocationId || !selection.carrierId || !selection.serviceCode) {
        return res.status(400).json({
          success: false,
          error: 'allocationId, carrierId, and serviceCode required for Veeqo',
        });
      }

      const shipment = await veeqoProvider.purchaseLabel({
        allocation_id: selection.allocationId,
        carrier_id: selection.carrierId,
        service_code: selection.serviceCode,
      });

      result = {
        provider: 'veeqo',
        shipment,
        tracking_number: shipment.tracking_number,
        label_url: shipment.label_url,
      };
    }

    res.json({
      success: true,
      ...result,
      idempotency_key: idempotencyKey,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error buying label:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase shipping label',
      message: error.message,
    });
  }
});

export default router;
