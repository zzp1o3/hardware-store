import * as SQLite from 'expo-sqlite';

// 新版API使用 openDatabaseSync（同步版本）
export const db = SQLite.openDatabaseSync('hardware.db');

export const initDatabase = (): void => {
  try {
    // 开启事务直接执行
    db.withTransactionSync(() => {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          location TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);
      
      db.execSync(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          items TEXT NOT NULL,
          totalAmount REAL NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);
    });
    
    console.log('✅ 数据库初始化成功');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};