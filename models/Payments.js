// models/Payments.js
module.exports = (sequelize, DataTypes) => {
  const Payments = sequelize.define("Payments", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.STRING(255), allowNull: true },
    gateway_id: { type: DataTypes.INTEGER, allowNull: true },
    order_id: { type: DataTypes.STRING(100), allowNull: true },
    customer_name: { type: DataTypes.STRING(255), allowNull: true },
    mobile_number: { type: DataTypes.STRING(12), allowNull: true },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    charges: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "INR" },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Pending" },
    response: { type: DataTypes.JSON, allowNull: true },
    invoice_id: { type: DataTypes.INTEGER, allowNull: true },
    payment_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "payments",
    timestamps: false,
  });

  Payments.associate = (models) => {
    // Each Payments belongs to a user
    Payments.belongsTo(models.User, { foreignKey: "user_id", targetKey: "user_id" });
  };

  return Payments;
};
