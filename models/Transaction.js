// models/Transaction.js
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define("Transaction", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    txn_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    txn_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    before_balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    credit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    debit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    after_balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created_timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: "wallet_transactions",
    timestamps: false, // already have created_timestamp
  });

  return Transaction;
};
