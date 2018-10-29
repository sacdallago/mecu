const sequelize = require(`sequelize`);

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

            const query = `
                select
                    id,
                    name,
                    proteins,
                    count(*) over() as total
                from
                    complexes c,
                    (select "complexId", count(*) from protein_complexes ${proteinWhereQuery} group by "complexId") sub
                where
                    sub."complexId" = c.id and
                    sub.count >= ${proteinList.length || 1}
                    ${nameWhereQuery}
                order by ${sortBy} ${order}
                offset :offset
                limit :limit;
            `;

            return context.dbConnection.query(
                query,
                {replacements: replacements},
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(([result]) => result);
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
                .then(([result]) => result);
        },

        getAverageComplexDistancePerExperiment: (complexId, requester) => {
            const query = `
            select experiment, name, ac.avg
            from average_complex_distance_per_experiment ac, experiments e
            where ac."complexId" = :complexId and
                  e.id = ac.experiment and
                  (e.private = false or e.uploader = :uploader)
            order by ac.avg;
            `;
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
