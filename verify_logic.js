const { sequelize, Product, Stock, StockMovement, Category, syncDatabase } = require('./src/models');
const PurchaseService = require('./src/services/PurchaseService');
const SaleService = require('./src/services/SaleService');
const StockService = require('./src/services/StockService');

async function testFlow() {
  try {
    console.log("🔄 Syncing Database...");
    // Use force: true to reset DB for test
    await sequelize.sync({ force: true });

    console.log("✅ Database Synced.");

    // 1. Create Data
    console.log("🛠 Creating Product...");
    const cat = await Category.create({ name: 'Beers' });
    const product = await Product.create({
      CategoryId: cat.id,
      name: 'Heineken 33cl',
      purchaseUnit: 'BOX',
      baseUnit: 'UNIT',
      unitsPerBox: 24,
      purchasePrice: 24000, // 24k per box -> 1k cost per unit
      sellingPrice: 1500,   // 1.5k selling price -> 500 profit
    });
    // Init stock
    await StockService.initStock(product.id);

    console.log(`📦 Product Created: ${product.name}. Cost/Unit: ${product.purchasePrice / product.unitsPerBox}`);

    // 2. Purchase
    console.log("🚚 Purchasing 1 Box (24 units)...");
    await PurchaseService.createPurchase({
      supplierId: null, // nullable for test
      items: [{ productId: product.id, quantityBoxes: 1, unitPriceBox: 24000 }],
      notes: "Initial Stock"
    }, null);

    let stock = await StockService.getStock(product.id);
    console.log(`📊 Stock after Purchase: ${stock.quantity} (Expected: 24)`);

    // 3. Sale
    console.log("💰 Selling 2 Units...");
    await SaleService.createSale({
      items: [{ productId: product.id, quantity: 2 }],
      paymentMethod: 'CASH',
      userId: null
    });

    stock = await StockService.getStock(product.id);
    console.log(`📊 Stock after Sale: ${stock.quantity} (Expected: 22)`);

    // 4. Validate Logic
    if (stock.quantity !== 22) throw new Error("Stock Logic Failed!");

    console.log("✅ All Core Logic Tests Passed!");

  } catch (error) {
    console.error("❌ Test Failed:", error);
  } finally {
    await sequelize.close();
  }
}

testFlow();
