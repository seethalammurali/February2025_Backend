// models/BankDetails.js
module.exports = (sequelize, DataTypes) => {
  const BankDetails = sequelize.define("BankDetails", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bank_name: { type: DataTypes.STRING(255), allowNull: false },
    bank_account_number: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    bank_ifsc_code: { type: DataTypes.STRING(255), allowNull: false },
    bank_mobile_number: { type: DataTypes.STRING(15), allowNull: false },
    created_timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "bank_details",
    timestamps: false,
  });

  BankDetails.associate = (models) => {
    // One user can have many bank accounts
    BankDetails.belongsTo(models.User, { foreignKey: "bank_mobile_number", targetKey: "user_mobile" });
  };

  return BankDetails;
};
