
module.exports = (sequelize,DataTypes) => {
  try {
    const Wallet = sequelize.define(
      "Wallet",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        wallet_user_id: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        wallet_balance: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.0,
        },
        wallet_updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: "wallet",
        timestamps: false, // handled by wallet_updated_at
      }
    );

    return Wallet;
  } catch (error) {
    console.error("Error defining Wallet model:", error.message);
    throw error;
  }
};
