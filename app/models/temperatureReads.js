/**
 * Created by chdallago on 1/2/17.
 */

/**
 * meltingRead model
 *
 * Created by Christian Dallago on 20161226 .
 */

module.exports = function(context) {

    const experimentsModel = context.component('models').module('experiments');
    const proteinsModel = context.component('models').module('proteins');

    return context.sequelize.define('temperatureRead', {
        // don't delete database entries but set the newly added attribute deletedAt
        // to the current date (when deletion was done). paranoid will only work if
        // timestamps are enabled
        paranoid: true,
        experiment: {
            type: context.Sequelize.UUID,
            unique: '_id',
            allowNull: false,
            references: {
                // This is a reference to another model
                model: experimentsModel,

                // This is the column name of the referenced model
                key: '_id',

                // This declares when to check the foreign key constraint. PostgreSQL only.
                deferrable: context.Sequelize.Deferrable.INITIALLY_IMMEDIATE,

                onDelete: "CASCADE"
            }
        },
        uniprotId: {
            type: context.Sequelize.STRING,
            unique: '_id',
            allowNull: false,
            references: {
                // This is a reference to another model
                model: proteinsModel,

                // This is the column name of the referenced model
                key: 'uniprotId',

                // This declares when to check the foreign key constraint. Postgres SQL only.
                deferrable: context.Sequelize.Deferrable.INITIALLY_IMMEDIATE,

                onDelete: "CASCADE"
            }
        },

        _id: {
            type: context.Sequelize.UUID,
            default: context.Sequelize.UUIDV1,
            primaryKey: true
        },
        temperature: {
            type: context.Sequelize.INTEGER,
            allowNull: false
        },
        ratio: {
            type: context.Sequelize.FLOAT,
            allowNull: false
        }
    });
};