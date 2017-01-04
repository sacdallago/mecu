/**
 * experiment model
 *
 * Created by Christian Dallago on 20161226 .
 */

module.exports = function(context) {
    return context.sequelize.define('experiment', {
        inVivo: {
            type: context.Sequelize.BOOLEAN,
            allowNull: false
        },
        cellLine: {
            type: context.Sequelize.STRING,
            allowNull: false
        }
    });
};