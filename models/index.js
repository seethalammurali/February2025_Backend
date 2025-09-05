const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// Import models
const User = require("./User")(sequelize, DataTypes);
const UserRole = require("./UserRole")(sequelize, DataTypes);
const Transaction = require('./Transaction')(sequelize,DataTypes)
const Wallet = require('./Wallet')(sequelize,DataTypes)
const Contact = require('./Contact')(sequelize,DataTypes)
// Define associations
User.belongsTo(UserRole, { foreignKey: "role_id" });
UserRole.hasMany(User, { foreignKey: "role_id" });

module.exports = {
  sequelize,
  User,
  UserRole,
  Transaction,
  Wallet,
  Contact
};
