// models/CardDetails.js
module.exports = (sequelize, DataTypes) => {
  const CardDetails = sequelize.define("CardDetails", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    card_name: { type: DataTypes.STRING(255), allowNull: false },
    card_number: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    card_bank_name: { type: DataTypes.STRING(255), allowNull: false },
    card_mobile_number: { type: DataTypes.STRING(15), allowNull: false },
    created_timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "card_details",
    timestamps: false,
  });

  CardDetails.associate = (models) => {
    // One user can have many cards
    CardDetails.belongsTo(models.User, { foreignKey: "card_mobile_number", targetKey: "user_mobile" });
  };

  return CardDetails;
};
