const { sequelize, Role, User } = require('./src/models');
const AuthService = require('./src/services/AuthService');

const seed = async () => {
  try {
    await sequelize.sync({ alter: true });

    // Create Roles
    const roles = ['ADMIN', 'MANAGER', 'WAITER'];
    const roleMap = {};

    for (const roleName of roles) {
      const [role] = await Role.findOrCreate({ where: { name: roleName } });
      roleMap[roleName] = role;
      console.log(`Role ${roleName} ensured.`);
    }

    // Create Default Admin
    const adminPassword = await AuthService.hashPassword('admin123');
    const [adminUser] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        passwordHash: adminPassword,
        RoleId: roleMap['ADMIN'].id,
        isActive: true
      }
    });

    if (adminUser) {
      // Ensure role is correct if user already existed
      await adminUser.update({ RoleId: roleMap['ADMIN'].id });
    }

    console.log('Seed completed successfully.');
    console.log('User: admin');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
