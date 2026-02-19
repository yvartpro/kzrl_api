const { Product, Category, Stock, Supplier, ProductComposition, sequelize } = require('./src/models');

const storeId = '3b8b9a88-a682-407e-aeb4-80c7e899f2a8';

async function debug() {
  try {
    console.log('--- Testing Product.findAll with storeId ---');
    const products = await Product.findAll({
      include: [
        { model: Category, required: false },
        {
          model: Stock,
          where: { StoreId: storeId },
          required: false
        }
      ],
      logging: console.log
    });

    console.log('Results count:', products.length);
    if (products.length > 0) {
      console.log('First product sample:', JSON.stringify(products[0], null, 2));
    } else {
      console.log('No products found with the filter.');

      console.log('--- Testing Product.findAll WITHOUT filter ---');
      const allProducts = await Product.findAll({ limit: 5 });
      console.log('Total products count (unfiltered):', allProducts.length);
    }

    process.exit(0);
  } catch (err) {
    console.error('Debug error:', err);
    process.exit(1);
  }
}

debug();
