const sequelize = require('sequelize');

module.exports = function(context) {
    const userModel = context.component('models').module('users');

    return context.dbConnection.define('complex', {
        // experiment id as foreign key?
        name: {
            type: sequelize.STRING,
            allowNull: false
        },
        purificationMethod: {
            type: sequelize.STRING,
            allowNull: false
        },
        comment: {
            type: sequelize.STRING
        },
        cellLine: {
            type: sequelize.STRING
        },
        organism: {
            type: sequelize.STRING
        },
        synonyms: {
            type: sequelize.STRING
        },
        complexIdExtern: {
            type: sequelize.INTEGER
        },
        diseaseComment: {
            type: sequelize.STRING
        },
        proteins: {
            type: sequelize.ARRAY(sequelize.STRING), // for array storage
            // type: sequelize.ARRAY(sequelize.INTEGER), // for foreign keys
        },
        proteinNames: {
            type: sequelize.ARRAY(sequelize.STRING)
        },
        geneNames: {
            type: sequelize.ARRAY(sequelize.STRING)
        },
        geneNamesynonyms: {
            type: sequelize.ARRAY(sequelize.STRING)
        },


        goId: {
            type: sequelize.ARRAY(sequelize.STRING)
        },
        goDescription: {
            type: sequelize.STRING
        },

        entrezIds: {
            type: sequelize.ARRAY(sequelize.INTEGER)
        },
        subunitsComment: {
            type: sequelize.STRING
        },
        swissprotOrganism: {
            type: sequelize.ARRAY(sequelize.STRING)
        },

        pubMedId: {
            type: sequelize.INTEGER
        },

        funCatId: {
            type: sequelize.ARRAY(sequelize.STRING)
        },
        funCatdescription: {
            type: sequelize.STRING
        },

        uploader: {
            type: sequelize.STRING,
            allowNull: false,
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            references: {
                // This is a reference to another model
                model: userModel,

                // This is the column name of the referenced model
                key: 'googleId',

                // This declares when to check the foreign key constraint. PostgreSQL only.
                deferrable: sequelize.Deferrable.INITIALLY_IMMEDIATE
            }
        }
    });
}
