const { EquipmentCategory, Equipment, EquipmentInventory, EquipmentInventoryItem, sequelize } = require('../src/models');

async function clearData() {
  try {
    console.log('Starting data deletion...');

    // Disable foreign key checks (Postgres style or just delete in order)
    // Deleting in order of dependencies

    console.log('Deleting EquipmentInventoryItem...');
    await EquipmentInventoryItem.destroy({ where: {}, truncate: { cascade: true } });

    console.log('Deleting EquipmentInventory...');
    await EquipmentInventory.destroy({ where: {}, truncate: { cascade: true } });

    console.log('Deleting Equipment...');
    await Equipment.destroy({ where: {}, truncate: { cascade: true } });

    console.log('Deleting EquipmentCategory...');
    await EquipmentCategory.destroy({ where: {}, truncate: { cascade: true } });

    console.log('All equipment data cleared successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

clearData();
