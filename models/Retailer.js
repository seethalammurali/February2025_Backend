// models/Retailer.js
module.exports = (sequelize, DataTypes) => {
  const Retailer = sequelize.define("Retailer", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    distributor_id: { type: DataTypes.STRING, allowNull: false },
    retailer_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    user_type: { type: DataTypes.STRING, allowNull: false },
    name_as_per_aadhaar: { type: DataTypes.STRING, allowNull: false },
    aadhar_number: { type: DataTypes.STRING(20), allowNull: false },
    dob: { type: DataTypes.DATE, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    district: { type: DataTypes.STRING, allowNull: true },
    pincode: { type: DataTypes.STRING, allowNull: true },
    user_mobile: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    user_email: { type: DataTypes.STRING, allowNull: false, unique: true },
    user_password: { type: DataTypes.STRING, allowNull: true },
    aadhar_url: { type: DataTypes.STRING(1000), allowNull: true },
    pan_number: { type: DataTypes.STRING(10), allowNull: true },
    name_as_per_pan: { type: DataTypes.STRING, allowNull: true },
    pan_url: { type: DataTypes.STRING(1000), allowNull: true },
    business_name: { type: DataTypes.STRING, allowNull: true },
    business_category: { type: DataTypes.STRING, allowNull: true },
    business_address: { type: DataTypes.STRING, allowNull: true },
    business_state: { type: DataTypes.STRING, allowNull: true },
    business_district: { type: DataTypes.STRING, allowNull: true },
    business_pincode: { type: DataTypes.STRING, allowNull: true },
    business_labour_license_Number: { type: DataTypes.STRING, allowNull: true },
    business_proprietor_name: { type: DataTypes.STRING, allowNull: true },
    shop_photo_url: { type: DataTypes.STRING(1000), allowNull: true },
    business_ll_url: { type: DataTypes.STRING(1000), allowNull: true },
    profile_photo_url: { type: DataTypes.STRING(1000), allowNull: true },
    bank_name: { type: DataTypes.STRING, allowNull: true },
    account_number: { type: DataTypes.STRING, allowNull: true },
    ifsc_code: { type: DataTypes.STRING, allowNull: true },
    account_holder_name: { type: DataTypes.STRING, allowNull: true },
    cancelled_check_url: { type: DataTypes.STRING(1000), allowNull: true },
    doj: { type: DataTypes.DATE, allowNull: true },
    kyc_status: { type: DataTypes.STRING, defaultValue: "Pending" },
    retailer_status: { type: DataTypes.STRING, allowNull: true },
    comments: { type: DataTypes.STRING, allowNull: true },
    retailer_percentage: { type: DataTypes.STRING, allowNull: true },
  }, {
    tableName: "retailer",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  Retailer.associate = (models) => {
    Retailer.belongsTo(models.UserRole, { foreignKey: "role_id" });
    Retailer.belongsTo(models.Distributor, { foreignKey: "distributor_id", targetKey: "distributor_id" });
  };

  return Retailer;
};
