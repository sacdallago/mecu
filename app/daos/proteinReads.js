const sequelize = require('sequelize');

module.exports = function(context) {

    // Imports
    const proteinReadsModel = context.component('models').module('proteinReads');

    return {
        bulkCreate: function(items, options) {
            return proteinReadsModel.bulkCreate(items, options);
        },

        findProteinExperiment: function(uniprotId, experiment, uploader) {
            const query = `
            SELECT pr."uniprotId", pr.experiment, pr.peptides, pr.psms, pr."createdAt", pr."updatedAt"
            FROM "proteinReads" pr, "experiment_proteinReads" e_pr, experiments e
            WHERE
                pr."uniprotId" = :uniprotId AND
                pr.id = e_pr."proteinReadId" AND
                e_pr."experimentId" = e.id AND
                e.id = :experimentId AND
                (e.private = false or e.uploader = :uploader);
            `;
            return context.dbConnection.query(
                    query,
                    {
                        replacements: {
                            uniprotId,
                            experimentId: experiment,
                            uploader
                        }
                    },
                    {type: sequelize.QueryTypes.SELECT}
                )
                .then(([result, metadata]) => result.length > 0 ? result[0] : {});
        }
    };
};
