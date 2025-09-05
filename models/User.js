// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    user_password: { type: DataTypes.STRING, allowNull: false },
    user_mobile: { type: DataTypes.STRING, allowNull: false },
    user_email: { type: DataTypes.STRING, allowNull: false },
    user_created_by: { type: DataTypes.INTEGER, allowNull: true },
    session_token: { type: DataTypes.STRING, allowNull: true },
    terms_accepted: { type: DataTypes.STRING, allowNull: true },
    otp: { type: DataTypes.STRING, allowNull: true },
    otp_expiry: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  User.associate = (models) => {
    User.belongsTo(models.UserRole, { foreignKey: "role_id" });
    User.hasMany(models.UserAudit, { foreignKey: "user_id", sourceKey: "user_id" });
  };


  return User;
};
