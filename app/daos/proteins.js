const sequelize = require(`sequelize`);

const bulkCreateSQL = require(`./proteins/bulkCreate`);
const findProteinExperimentCombinationsSQL = require(`./proteins/findProteinExperimentCombinations`);

module.exports = function(context) {

    // Imports
    const proteinsModel = context.component(`models`).module(`proteins`);

    return {
        create: function(item) {
            return proteinsModel.create(item);
        },

        bulkCreate: function(proteinList) {
            // return proteinsModel.bulkCreate(items, {ignoreDuplicates: true}); // DOES NOT WORK
            let p = Promise.resolve();
            proteinList.forEach(protein => {
                p = p.then(() => context.dbConnection.query(
                    bulkCreateSQL.query(),
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
                ));
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
                    console.error(err);
                    return Promise.reject(err);
                });
        },

        findByUniprotId: function(identifier) {
            return proteinsModel.findOne({uniprotId:  identifier})
                .catch(error => {
                    console.error(error);
                    return Promise.reject(error);
                });
        },

        findProteinExperimentCombinations: function(proteinExperimentPairs, requester) {

            if(proteinExperimentPairs.length === 0) {
                return Promise.resolve([]);
            }

            const replacements = {
                uploader: requester,
                isPrivate: false
            };

            let whereClause = ``;
            proteinExperimentPairs.forEach((v,i) => {
                if(i != 0) {
                    whereClause += ` OR `;
                } else {
                    whereClause += ` AND (`;
                }
                let replStrExp = `Exp`+i;
                let replStrPrt = `Prt`+i;
                whereClause += `(pe."uniprotId" = :${replStrPrt} AND pe."experimentId" = :${replStrExp})`;
                replacements[replStrPrt] = v.uniprotId;
                replacements[replStrExp] = v.experiment;
            });
            if(proteinExperimentPairs.length > 0) {
                whereClause += ` ) `;
            }

            const query = findProteinExperimentCombinationsSQL.query(whereClause);

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
