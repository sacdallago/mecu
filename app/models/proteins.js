/**
 * protein model
 *
 * Created by Christian Dallago on 20161226 .
 */

module.exports = function(context) {
    return context.sequelize.define('protein', {
        uniprotId: {
            type: context.Sequelize.STRING,
            // allowNull: false,
            // unique: true,
            primaryKey: true
        }
    });
};