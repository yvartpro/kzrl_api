require('dotenv').config();
const ReportService = require('./src/services/ReportService');
const { sequelize } = require('./src/models');

async function checkCapital() {
  try {
    const capital = await ReportService.getGlobalCapital();
    console.log('--- Global Capital Check ---');
    console.log('Liquid Assets:', capital.liquidAssets);
    console.log('Stock Value:', capital.stockValue);
    console.log('Global Capital:', capital.globalCapital);
    console.log('----------------------------');
  } catch (error) {
    console.error('Error checking capital:', error);
  } finally {
    await sequelize.close();
  }
}

checkCapital();
