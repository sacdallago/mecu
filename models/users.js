/**
 * user model
 *
 * Created by Christian Dallago on 20160626 .
 */

module.exports = function(context) {
    return context.sequelize.define('user', {
        googleId: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        displayName:  {
            type: Sequelize.STRING
        }
    });
}