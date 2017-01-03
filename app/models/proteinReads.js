/**
 * meltingRead model
 *
 * Created by Christian Dallago on 20161226 .
 */

module.exports = function(context) {
    
    const experimentsModel = context.component('models').module('experiments');
    const proteinsModel = context.component('models').module('proteins');
    
    return context.sequelize.define('proteinRead', {
        // don't delete database entries but set the newly added attribute deletedAt
        // to the current date (when deletion was done). paranoid will only work if
        // timestamps are enabled
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
//            TODO - Reference can be used when postgres ignore duplicate will be implemented, follow https://github.com/sequelize/sequelize/pull/6325
//            references: {
//                model: proteinsModel,
//                key: 'uniprotId',
//                deferrable: context.Sequelize.Deferrable.INITIALLY_IMMEDIATE,
//                onDelete: "CASCADE"
//            }
        },

        peptides: {
            type: context.Sequelize.INTEGER,
            allowNull: false
        },
        psms: {
            type: context.Sequelize.STRING,
            allowNull: false
        },
        totalExpt: {
            type: context.Sequelize.INTEGER,
            allowNull: false
        }
    });
};