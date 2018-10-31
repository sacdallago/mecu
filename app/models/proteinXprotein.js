const sequelize = require(`sequelize`);

module.exports = function(context) {
    return context.dbConnection.define(`protein_protein`, {
        interactor1: {
            type: sequelize.STRING,
            primaryKey: true,
            references: {
                model: `proteins`,
                key: `uniprotId`
            }
        },
        geneId1: {
            type: sequelize.INTEGER
        },
        interactor2: {
            type: sequelize.STRING,
            primaryKey: true,
            references: {
                model: `proteins`,
                key: `uniprotId`
            }
        },
        geneId2: {
            type: sequelize.INTEGER
        },
        correlation: {
            type: sequelize.DOUBLE,
            primaryKey: true
        },
        experiments: {
            type: sequelize.ARRAY(sequelize.STRING)
        },
        pmids: {
            type: sequelize.ARRAY(sequelize.STRING)
        },
        sources: {
            type: sequelize.ARRAY(sequelize.STRING)
        },
        species: {
            type: sequelize.STRING
        },
    });
};
