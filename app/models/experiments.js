const sequelize = require(`sequelize`);

module.exports = function(context) {
    const userModel = context.component(`models`).module(`users`);

    return context.dbConnection.define(`experiment`, {
        name: {
            type: sequelize.TEXT,
            allowNull: false
        },
        metaData: {
            type: sequelize.JSON
        },
        rawData: {
            type: sequelize.JSONB,
            allowNull: false
        },
        uploader: {
            type: sequelize.STRING,
            allowNull: false,
            onDelete: `CASCADE`,
            onUpdate: `CASCADE`,
            references: {
                model: userModel,
                key: `googleId`,
                deferrable: sequelize.Deferrable.INITIALLY_IMMEDIATE
            }
        },
        private: {
            type: sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        deletedAt: {
            type: sequelize.DATE(3)
        }
    });
};
