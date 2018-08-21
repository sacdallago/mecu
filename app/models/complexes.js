const sequelize = require('sequelize');

module.exports = function(context) {

    const model = context.dbConnection.define('complex', {
        name: {
            type: sequelize.STRING,
            allowNull: false
        },
        purificationMethod: {
            type: sequelize.TEXT
        },
        comment: {
            type: sequelize.TEXT
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
            type: sequelize.TEXT
        },
        proteins: {
            type: sequelize.ARRAY(sequelize.STRING),
        },
        proteinNames: {
            type: sequelize.ARRAY(sequelize.TEXT)
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
            type: sequelize.TEXT
        },

        entrezIds: {
            type: sequelize.ARRAY(sequelize.STRING)
        },
        subunitsComment: {
            type: sequelize.TEXT
        },
        swissprotOrganism: {
            type: sequelize.ARRAY(sequelize.TEXT)
        },

        pubMedId: {
            type: sequelize.INTEGER
        },

        funCatId: {
            type: sequelize.ARRAY(sequelize.STRING)
        },
        funCatDescription: {
            type: sequelize.TEXT
        },

        createdAt: {
            type: sequelize.DATE(3),
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP(3)'),
        },
        updatedAt: {
            type: sequelize.DATE(3),
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP(3)'),
            onUpdate: sequelize.literal('CURRENT_TIMESTAMP(3)')
        }
    }, {
        timestamps: false
    });


    return model;
}
