const sequelize = require(`sequelize`);

const findComplexSQL = require(`./complexes/findComplex`);
const getComplexWhichHasProteinSQL = require(`./complexes/getComplexWhichHasProtein`);
const getAverageComplexDistancePerExperimentSQL = require(`./complexes/getAverageComplexDistancePerExperiment`);

module.exports = (context) => {
    // Imports
    const complexesModel = context.component(`models`).module(`complexes`);
    const temperatureReadsDao = context.component(`daos`).module(`temperatureReads`);

    return {
        getComplex: (id) => {
            return complexesModel.findAll({
                where: {
                    id
                }
            })
                .then(([result]) => result || {});
        },

        findComplex: ({limit, offset, sortBy, order, search}, requester) => {

            const name = search.value || ``;
            const experimentId = search.experiment;

            const replacements = {
                limit: limit,
                offset: offset,
                searchTerm: `%${name}%`
            };

            const query = findComplexSQL.query(sortBy, order, 1);

            const getComplexes = context.dbConnection.query(
                    query,
                    {replacements: replacements},
                    {type: sequelize.QueryTypes.SELECT}
                )
                .then(([result]) => result);

            const getCurveData = (protExpArr, req) => temperatureReadsDao
                .findAndAggregateTempsByIdAndExperiment(
                    protExpArr,
                    req, `findComplex`
                );

            const getAndAddCurveData = (complex, exp, req) => {
                const protExpArr = complex.proteins.map(p => ({
                    uniprotId: p,
                    experiment: exp
                }));
                return getCurveData(protExpArr, req)
                    .then(reads => {
                        complex.reads = reads;
                        return complex;
                    })
            }


            return Promise.all([Promise.resolve(experimentId), getComplexes])
                .then(r => ({experiment: r[0], complexes: r[1]}))
                .then(({experiment, complexes}) =>
                    Promise.all(complexes.map(complex => getAndAddCurveData(complex, experiment, requester)))
                )
                .then(resultComplexes => {
                    return resultComplexes;
                });
        },

        getComplexWhichHasProtein: (uniprotId) => {

            const query = getComplexWhichHasProteinSQL.query();

            return context.dbConnection.query(
                    query,
                    {replacements: {uniprotId: uniprotId}},
                    {type: sequelize.QueryTypes.SELECT}
                )
                .then(([result]) => result);
        },

        getAverageComplexDistancePerExperiment: (complexId, requester) => {

            const query = getAverageComplexDistancePerExperimentSQL.query();

            return context.dbConnection.query(
                query,
                {
                    replacements: {
                        complexId: complexId,
                        uploader: requester
                    }
                },
                {
                    type: sequelize.QueryTypes.SELECT,
                    plain: true
                }
            )
                .then(([result]) => result);
        }
    };
};
