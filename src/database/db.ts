import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

/**
 * SQLite Database for Order History
 * 
 * Provides persistent storage for:
 * - Shipment rates fetched
 * - Label purchases
 * - Order tracking information
 * 
 * Database is enabled by default and stores data in ./data/orders.db
 */

interface OrderHistory {
  id?: number;
  order_id: string;
  action_type: 'rates' | 'purchase';
  provider?: string;
  carrier?: string;
  service?: string;
  price?: number;
  currency?: string;
  tracking_number?: string;
  label_url?: string;
  request_data: string; // JSON string
  response_data: string; // JSON string
  created_at: string;
}

let db: Database | null = null;

const DB_ENABLED = process.env.ENABLE_DATABASE !== 'false'; // Enabled by default
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'orders.db');

/**
 * Initialize the database and create tables if they don't exist
 */
export async function initDatabase(): Promise<void> {
  if (!DB_ENABLED) {
    console.log('Database persistence is disabled');
    return;
  }

  try {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // Create orders_history table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS orders_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        provider TEXT,
        carrier TEXT,
        service TEXT,
        price REAL,
        currency TEXT,
        tracking_number TEXT,
        label_url TEXT,
        request_data TEXT NOT NULL,
        response_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for common queries
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_order_id ON orders_history(order_id);
      CREATE INDEX IF NOT EXISTS idx_created_at ON orders_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_action_type ON orders_history(action_type);
    `);

    console.log(`Database initialized at: ${DB_PATH}`);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Save a rate fetch action to the database
 */
export async function saveRatesFetch(
  orderId: string,
  requestData: any,
  responseData: any
): Promise<void> {
  if (!DB_ENABLED || !db) return;

  try {
    await db.run(
      `INSERT INTO orders_history (
        order_id, action_type, request_data, response_data
      ) VALUES (?, ?, ?, ?)`,
      [orderId, 'rates', JSON.stringify(requestData), JSON.stringify(responseData)]
    );
  } catch (error) {
    console.error('Failed to save rates fetch:', error);
  }
}

/**
 * Save a label purchase to the database
 */
export async function saveLabelPurchase(
  orderId: string,
  provider: string,
  carrier: string,
  service: string,
  price: number,
  currency: string,
  trackingNumber: string,
  labelUrl: string,
  requestData: any,
  responseData: any
): Promise<void> {
  if (!DB_ENABLED || !db) return;

  try {
    await db.run(
      `INSERT INTO orders_history (
        order_id, action_type, provider, carrier, service, price, currency,
        tracking_number, label_url, request_data, response_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        'purchase',
        provider,
        carrier,
        service,
        price,
        currency,
        trackingNumber,
        labelUrl,
        JSON.stringify(requestData),
        JSON.stringify(responseData)
      ]
    );
  } catch (error) {
    console.error('Failed to save label purchase:', error);
  }
}

/**
 * Get order history by order ID
 */
export async function getOrderHistory(orderId: string): Promise<OrderHistory[]> {
  if (!DB_ENABLED || !db) return [];

  try {
    const rows = await db.all<OrderHistory[]>(
      'SELECT * FROM orders_history WHERE order_id = ? ORDER BY created_at DESC',
      [orderId]
    );
    return rows;
  } catch (error) {
    console.error('Failed to get order history:', error);
    return [];
  }
}

/**
 * Get all orders history with pagination
 */
export async function getAllOrdersHistory(
  limit: number = 100,
  offset: number = 0
): Promise<OrderHistory[]> {
  if (!DB_ENABLED || !db) return [];

  try {
    const rows = await db.all<OrderHistory[]>(
      'SELECT * FROM orders_history ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows;
  } catch (error) {
    console.error('Failed to get orders history:', error);
    return [];
  }
}

/**
 * Get orders history by date range
 */
export async function getOrdersHistoryByDateRange(
  startDate: string,
  endDate: string
): Promise<OrderHistory[]> {
  if (!DB_ENABLED || !db) return [];

  try {
    const rows = await db.all<OrderHistory[]>(
      `SELECT * FROM orders_history 
       WHERE created_at BETWEEN ? AND ? 
       ORDER BY created_at DESC`,
      [startDate, endDate]
    );
    return rows;
  } catch (error) {
    console.error('Failed to get orders history by date range:', error);
    return [];
  }
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    console.log('Database connection closed');
  }
}
