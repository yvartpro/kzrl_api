const { sequelize } = require('./src/models');

async function migrate() {
  try {
    console.log('Starting migration...');

    // 1. Create or Find Global Store
    const [existingStores] = await sequelize.query("SELECT id FROM kzrl_stores WHERE name = 'Bar Central'");
    let storeId;
    if (existingStores.length > 0) {
      storeId = existingStores[0].id;
    } else {
      const id = require('crypto').randomUUID();
      await sequelize.query(
        "INSERT INTO kzrl_stores (id, name, type, isActive, createdAt, updatedAt) VALUES (?, 'Bar Central', 'BAR', 1, NOW(), NOW())",
        { replacements: [id] }
      );
      storeId = id;
    }
    console.log(`Using Store ID: ${storeId}`);

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    const tablesToMigrate = [
      { old: 'Roles', new: 'kzrl_roles' },
      { old: 'Users', new: 'kzrl_users' },
      { old: 'Categories', new: 'kzrl_categories' },
      { old: 'Suppliers', new: 'kzrl_suppliers' },
      { old: 'Products', new: 'kzrl_products' },
      { old: 'Stocks', new: 'kzrl_stocks', addStoreId: true },
      { old: 'Sales', new: 'kzrl_sales', addStoreId: true },
      { old: 'SaleItems', new: 'kzrl_sale_items' },
      { old: 'Purchases', new: 'kzrl_purchases', addStoreId: true },
      { old: 'PurchaseItems', new: 'kzrl_purchase_items' },
      { old: 'Expenses', new: 'kzrl_expenses', addStoreId: true },
      { old: 'CashRegisters', new: 'kzrl_cash_registers', addStoreId: true },
      { old: 'CashMovements', new: 'kzrl_cash_movements' },
      { old: 'StockMovements', new: 'kzrl_stock_movements', addStoreId: true }
    ];

    for (const mapping of tablesToMigrate) {
      try {
        const [rows] = await sequelize.query(`SELECT * FROM ${mapping.old}`);
        if (rows.length === 0) {
          console.log(`Skipping ${mapping.old} (empty)`);
          continue;
        }

        console.log(`Migrating ${rows.length} rows from ${mapping.old} to ${mapping.new}...`);

        for (const row of rows) {
          const keys = Object.keys(row);
          const values = Object.values(row);

          if (mapping.addStoreId && !keys.includes('StoreId')) {
            keys.push('StoreId');
            values.push(storeId);
          }

          const placeholders = keys.map(() => '?').join(', ');
          const columns = keys.join(', ');

          await sequelize.query(
            `INSERT IGNORE INTO ${mapping.new} (${columns}) VALUES (${placeholders})`,
            { replacements: values }
          );
        }

        // Specifically for users, ensure they are in the join table
        if (mapping.old === 'Users') {
          for (const row of rows) {
            await sequelize.query(
              'INSERT IGNORE INTO kzrl_user_stores (createdAt, updatedAt, StoreId, UserId) VALUES (NOW(), NOW(), ?, ?)',
              { replacements: [storeId, row.id] }
            );
          }
        }

      } catch (err) {
        console.warn(`Failed to migrate ${mapping.old}:`, err.message);
      }
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Migration completed!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
