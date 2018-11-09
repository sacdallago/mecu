const sequelize = require(`sequelize`);

const findComplexSQL = require(`./complexes/findComplex`);
const getComplexWhichHasProteinSQL = require(`./complexes/getComplexWhichHasProtein`);
const getAverageComplexDistancePerExperimentSQL = require(`./complexes/getAverageComplexDistancePerExperiment`);

module.exports = (context) => {
    // Imports
    const complexesModel = context.component(`models`).module(`complexes`);

    return {
        getComplex: (id) => {
            return complexesModel.findAll({
                where: {
                    id
                }
            })
                .then(([result]) => result || {});
        },

        findComplex: ({limit, offset, sortBy, order, search}) => {

            const name = search.name || ``;
            const proteinList = search.proteinList || [];

            const replacements = {
                name: `%`+name+`%`,
                limit: limit,
                offset: offset,
                sortBy: sortBy
            };

            let nameWhereQuery = ``;
            if(search.name.length !== 0) {
                nameWhereQuery = ` and name like :name `;
            }

            let proteinWhereQuery = ``;
            if(proteinList && proteinList.length > 0) {
                proteinWhereQuery = `  where `;
                proteinList.forEach((p,i) => {
                    proteinWhereQuery += ` "uniprotId" = :p${i} `;
                    replacements[`p`+i] = p;
                    if(i !== proteinList.length - 1) {
                        proteinWhereQuery += ` or `;
                    }
                });
            }

            const query = findComplexSQL.query(nameWhereQuery, proteinWhereQuery, sortBy, order, proteinList.length || 1);

            return context.dbConnection.query(
                query,
                {replacements: replacements},
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(([result]) => result);
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
