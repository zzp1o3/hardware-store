import { db } from './init';
import { Product } from '../types';

// 添加商品
export const addProduct = async (product: Omit<Product, 'id'>): Promise<number> => {
  const result = await db.runAsync(
    'INSERT INTO products (name, price, location, createdAt) VALUES (?, ?, ?, ?)',
    [product.name, product.price, product.location, product.createdAt]
  );
  return result.lastInsertRowId;
};

// 搜索商品
export const searchProducts = async (keyword: string): Promise<Product[]> => {
  const search = `%${keyword}%`;
  const results = await db.getAllAsync<Product>(
    'SELECT * FROM products WHERE name LIKE ? OR location LIKE ? ORDER BY name',
    [search, search]
  );
  return results;
};

// 获取所有商品
export const getAllProducts = async (): Promise<Product[]> => {
  const results = await db.getAllAsync<Product>(
    'SELECT * FROM products ORDER BY createdAt DESC'
  );
  return results;
};

// 删除商品
export const deleteProduct = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

// 根据名称查找商品（不区分大小写）
export const getProductByName = async (name: string) => {
  const rows = await db.getAllAsync<Product>(
    'SELECT * FROM products WHERE lower(name) = lower(?) LIMIT 1',
    [name]
  );
  return rows && rows[0] ? rows[0] : null;
};

// 添加订单（使用事务保证一致性）
export const addOrder = async (itemsJson: string, totalAmount: number, createdAt: string): Promise<number> => {
  try {
    await db.runAsync('BEGIN TRANSACTION');
    const result = await db.runAsync(
      'INSERT INTO orders (items, totalAmount, createdAt) VALUES (?, ?, ?)',
      [itemsJson, totalAmount, createdAt]
    );
    await db.runAsync('COMMIT');
    return result.lastInsertRowId;
  } catch (err) {
    try {
      await db.runAsync('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback failed', rollbackErr);
    }
    throw err;
  }
};

// 获取今天的所有订单（按 createdAt）
export const getTodayOrders = async () => {
  const results = await db.getAllAsync(
    "SELECT * FROM orders WHERE DATE(createdAt) = DATE('now') ORDER BY createdAt DESC",
    []
  );
  return results;
};

// 获取今天的汇总：总金额与订单数量
export const getTodaySummary = async () => {
  const rows = await db.getAllAsync<{ total: number; count: number }>(
    "SELECT IFNULL(SUM(totalAmount), 0) as total, COUNT(*) as count FROM orders WHERE DATE(createdAt) = DATE('now')",
    []
  );
  return rows && rows[0] ? { total: rows[0].total ?? 0, count: rows[0].count ?? 0 } : { total: 0, count: 0 };
};

// 获取指定日期的订单，dateStr 格式 'YYYY-MM-DD'
export const getOrdersByDate = async (dateStr: string) => {
  const results = await db.getAllAsync(
    'SELECT * FROM orders WHERE DATE(createdAt) = DATE(?) ORDER BY createdAt DESC',
    [dateStr]
  );
  return results;
};

// 获取指定日期的统计汇总
export const getSummaryByDate = async (dateStr: string) => {
  const rows = await db.getAllAsync<{ total: number; count: number }>(
    'SELECT IFNULL(SUM(totalAmount), 0) as total, COUNT(*) as count FROM orders WHERE DATE(createdAt) = DATE(?)',
    [dateStr]
  );
  return rows && rows[0] ? { total: rows[0].total ?? 0, count: rows[0].count ?? 0 } : { total: 0, count: 0 };
};

// 删除订单
export const deleteOrder = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM orders WHERE id = ?', [id]);
};

// 统计与清空相关操作
export const getProductsCount = async (): Promise<number> => {
  const rows = await db.getAllAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM products', []);
  return rows && rows[0] ? Number(rows[0].cnt) : 0;
};

export const getOrdersCount = async (): Promise<number> => {
  const rows = await db.getAllAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM orders', []);
  return rows && rows[0] ? Number(rows[0].cnt) : 0;
};

export const clearProducts = async (): Promise<void> => {
  await db.runAsync('DELETE FROM products');
};

export const clearOrders = async (): Promise<void> => {
  await db.runAsync('DELETE FROM orders');
};