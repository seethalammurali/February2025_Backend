// models/UserRole.js
module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define("UserRole", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
  }, {
    tableName: "user_roles", // must match your DB table name
    timestamps: false,       // disable createdAt/updatedAt since not in schema
  });

  UserRole.associate = (models) => {
    UserRole.hasMany(models.User, { foreignKey: "role_id" });
  };

  return UserRole;
};
