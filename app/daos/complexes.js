const sequelize = require('sequelize');

module.exports = (context) => {
    // Imports
    const complexesModel = context.component('models').module('complexes');

    return {
        getComplex: (id) => {
            return complexesModel.findAll({
                where: {
                    id
                }
            })
            .then(([result, metadata]) => result || {});
        },

        getComplexWhichHasProtein: (uniprotId) => {
            const query = `
                select c.id, c.name, c.comment, c.proteins
                from complexes c, proteins p, protein_complexes cp
                where c.id = cp."complexId" and p."uniprotId" = cp."uniprotId" and p."uniprotId" = :uniprotId;
            `;
            return context.dbConnection.query(
                    query,
                    {replacements: {uniprotId: uniprotId}},
                    {type: sequelize.QueryTypes.SELECT}
                )
                .then(([result, metadata]) => result);
        },

        getAverageComplexDistancePerExperiment: (complexId) => {
            const query = `select * from average_complex_distance_per_experiment where "complexId" = :complexId order by avg;`;
            return context.dbConnection.query(
                    query,
                    {replacements: {complexId: complexId}},
                    {
                        type: sequelize.QueryTypes.SELECT,
                        plain: true
                    }
                )
                .then(([result, metadata]) => result);
        }
    };
};
