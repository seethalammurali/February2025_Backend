module.exports = (sequelize,DataTypes) => {
  try {
    const Contact = sequelize.define(
      "Contact",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        contact_first_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        contact_last_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        contact_email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        contact_mobile_number: {
          type: DataTypes.STRING(15),
          allowNull: false,
        },
        contact_message: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        created_timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: "contact",
        timestamps: false, // handled by created_timestamp
      }
    );

    return Contact;
  } catch (error) {
    console.error("Error defining Contact model:", error.message);
    throw error;
  }
};
