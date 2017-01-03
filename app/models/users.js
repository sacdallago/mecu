/**
 * user model
 *
 * Created by Christian Dallago on 20160626 .
 */

module.exports = function(context) {
    return context.sequelize.define('user', {
        googleId: {
            type: context.Sequelize.STRING,
            allowNull: false,
            primaryKey: true
        },
        displayName:  {
            type: context.Sequelize.STRING
        }
    });
}