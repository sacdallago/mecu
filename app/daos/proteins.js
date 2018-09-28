const sequelize = require('sequelize');

module.exports = function(context) {

    // Imports
    const proteinsModel = context.component('models').module('proteins');

    return {
        create: function(item) {
            return proteinsModel.create(item);
        },

        bulkCreate: function(proteinList) {
            // return proteinsModel.bulkCreate(items, {ignoreDuplicates: true}); // DOES NOT WORK
            let p = Promise.resolve();
            proteinList.forEach(protein => {
                p = p.then(() => context.dbConnection.query(
                    `INSERT INTO public.proteins("uniprotId", "createdAt", "updatedAt") VALUES (:uniprotId, :createdAt, :updatedAt) ON CONFLICT DO NOTHING;`,
                    {
                        replacements: {
                            uniprotId: protein,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    },
                    {
                        type: sequelize.QueryTypes.INSERT
                    }
                ))
            });
            return p;
        },

        update: function(item) {
            item.updatedAt = Date.now();

            return proteinsModel.update({ "uniprotId": item.uniprotId }, item, {
                    upsert: true,
                    setDefaultsOnInsert : true
                })
                .catch(err => {
                    conole.error(error);
                    return Promise.reject(error);
                });
        },

        findByUniprotId: function(identifier) {
            return proteinsModel.findOne({uniprotId:  identifier})
                .catch(error => {
                    console.error(error);
                    return Promise.reject(error);
                });
        },

        findByUniprotIds: function(uniProtIds) {
            return proteinsModel.find({uniprotId:  uniProtIds})
                .catch(error => {
                    console.error(error);
                    return Promise.reject(error);
                });
        },

        findProteinExperimentCombinations: function(proteinExperimentPairs, uploader) {

            if(proteinExperimentPairs.length === 0) {
                return Promise.resolve([]);
            }
            const replacements = {
                uploader: uploader,
                isPrivate: false
            };
            let whereClause = '';
            proteinExperimentPairs.forEach((v,i,a) => {
                if(i != 0) {
                    whereClause += ' OR '
                };
                let replStrExp = 'Exp'+i;
                let replStrPrt = 'Prt'+i;
                whereClause += `(pe."uniprotId" = :${replStrPrt} AND pe."experimentId" = :${replStrExp})`;
                replacements[replStrPrt] = v.uniprotId;
                replacements[replStrExp] = v.experiment;
            });

            const query = `
            SELECT tmp."uniprotId", json_agg(tmp.experiment) AS experiments
            FROM (
                SELECT tr.experiment, tr."uniprotId"
                FROM
                    experiments e,
                    "experiment_temperatureReads" e_tr,
                    "temperatureReads" tr,
                    proteins p,
                    "protein_temperatureReads" p_tr,
                    protein_experiments pe
                WHERE
                    p."uniprotId" = pe."uniprotId" AND
                    pe."experimentId" = e.id AND
                    e.id = e_tr."experimentId" AND
                    (e.private = :isPrivate or e.uploader = :uploader) AND
                    e_tr."temperatureReadId" = tr.id AND
                    p_tr."uniprotId" = p."uniprotId" AND
                    p_tr."temperatureReadId" = tr.id AND
                    (${whereClause})
                GROUP BY tr."experiment", tr."uniprotId"
            ) tmp
            GROUP BY tmp."uniprotId";
            `;

            const start = new Date();
            return context.dbConnection.query(
                    query,
                    {replacements: replacements},
                    {type: sequelize.QueryTypes.SELECT}
                )
                .then(r => {
                    console.log(`DURATION findProteinExperimentCombinations  ${(Date.now()-start)/1000} ms`);
                    return r;
                })
                .then(r => r.length > 0 ? r[0] : []);
        }
    };
};
