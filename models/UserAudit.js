// models/UserAudit.js
module.exports = (sequelize, DataTypes) => {
  const UserAudit = sequelize.define("UserAudit", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.STRING, allowNull: false },
    login_time: { type: DataTypes.DATE, allowNull: false },
    latitude: { type: DataTypes.STRING, allowNull: true },
    longitude: { type: DataTypes.STRING, allowNull: true },
  }, {
    tableName: "users_audit",
    timestamps: false,
  });

  UserAudit.associate = (models) => {
    UserAudit.belongsTo(models.User, { foreignKey: "user_id", targetKey: "user_id" });
  };

  return UserAudit;
};
