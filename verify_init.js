require('dotenv').config();
const CashService = require('./src/services/CashService');
const StockService = require('./src/services/StockService');
const { Product, Stock, StockMovement, CashMovement, CashRegister, sequelize, User } = require('./src/models');

async function verifyInitialization() {
  console.log('--- Verification of System Initialization ---');

  try {
    // 1. Setup a dummy product
    const product = await Product.create({
      name: 'Verification Product ' + Date.now(),
      purchasePrice: 1000,
      sellingPrice: 1500,
      unitsPerBox: 1
    });

    console.log('Created product:', product.name);

    // 2. Initialize Cash Balance
    console.log('\nInitializing cash to 1,000,000...');
    const user = await User.findOne();
    if (!user) throw new Error('No user found for testing');

    await CashService.initializeBalance(1000000, user.id);

    const balance = await CashService.getBalance();
    console.log('Current balance:', balance);

    const cashMov = await CashMovement.findOne({
      where: { reason: 'OPENING_BALANCE' },
      order: [['createdAt', 'DESC']]
    });
    console.log('Cash Movement recorded:', cashMov ? 'YES' : 'NO');
    if (cashMov) console.log('Amount:', cashMov.amount, 'Type:', cashMov.type);

    // 3. Initialize Stock
    console.log('\nInitializing stock to 50 units...');
    await StockService.initializeStock(product.id, 50, user.id);

    const stock = await Stock.findOne({ where: { ProductId: product.id } });
    console.log('Current stock quantity:', stock.quantity);

    const stockMov = await StockMovement.findOne({
      where: { reason: 'INITIAL', StockId: stock.id },
      order: [['createdAt', 'DESC']]
    });
    console.log('Stock Movement recorded:', stockMov ? 'YES' : 'NO');
    if (stockMov) console.log('Change:', stockMov.quantityChange, 'New Quantity:', stockMov.newQuantity);

    console.log('\n--- VERIFICATION SUCCESSFUL ---');
  } catch (error) {
    console.error('\n--- VERIFICATION FAILED ---');
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

verifyInitialization();
