const sequelize = require(`sequelize`);

const findProteinExperimentSQL = require(`./proteinReads/findProteinExperiment`);

module.exports = function(context) {

    // Imports
    const proteinReadsModel = context.component(`models`).module(`proteinReads`);

    return {
        bulkCreate: function(items, options) {
            return proteinReadsModel.bulkCreate(items, options);
        },

        findProteinExperiment: function(uniprotId, experiment, requester) {

            const query = findProteinExperimentSQL.query();

            return context.dbConnection.query(
                query,
                {
                    replacements: {
                        uniprotId,
                        experimentId: experiment,
                        uploader: requester
                    }
                },
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(([result]) => result.length > 0 ? result[0] : {});
        }
    };
};
