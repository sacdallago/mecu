/**
 * experiment model
 *
 * Created by Christian Dallago on 20161226 .
 */

module.exports = function(context) {
    return context.sequelize.define('experiment', {
        _id: {
            type: context.Sequelize.UUID,
            default: context.Sequelize.UUIDV1,
            primaryKey: true
        },
        inVivo: {
            type: context.Sequelize.BOOLEAN,
            allowNull: false
        },
        cellLine: {
            type: context.Sequelize.STRING,
            allowNull: false
        },
        createdAt: {
            type: context.Sequelize.DATE,
            defaultValue: context.Sequelize.NOW
        }
    });
};