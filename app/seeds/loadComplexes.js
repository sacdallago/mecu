const fs = require('fs');

/*
to load a different file:
0. delete the complexes table from the database
1. change the database fields
2. change the fields below
 */
module.exports = function(context, filePath) {
    const proteinsModel = context.component('models').module('proteins');
    const complexesModel = context.component('models').module('complexes');
    const proteinXcomplexModel = context.component('models').module('proteinXcomplex');

    console.warn('SEEDING COMPLEXES');
    return loadFileAndParseAttributes(filePath)
        .then(arrayOfComplexObjects => {
            console.warn(`SEEDING: ${arrayOfComplexObjects.length} new complexes found`);
            return arrayOfComplexObjects;
        })
        .then(complexes => {
            const distinctProteins = extractProteins(complexes);
            return seedProteins(proteinsModel, distinctProteins).then(() => complexes);
        })
        .then(complexes => seedComplexesAndCreateMtoNTableEntry(complexesModel, proteinXcomplexModel, complexes))
        .catch(e => console.error('Problem seeding', e));
}

/**
 * load the file content, read and map attributes
 * @param  { string } filePath string, where the file lies in  relation to app.js
 * @return { {...attributes:values}[] }          the data read from the file (mapped to the correct variables)
 */
const loadFileAndParseAttributes = function(filePath) {
    return new Promise((resolve,reject) => {
        let content;
        try {
            content = fs.readFileSync(filePath);
            content = JSON.parse(content);
        } catch(e) {
            console.error('problem loading/parsing file ', filePath, e);
            return [];
        }

        // map to database attributes
        let result = content.map(({
                ComplexID,
                'Protein complex purification method': purifMethod,
                'subunits(UniProt IDs)': uniprotIds,
                Synonyms,
                ComplexName,
                'subunits(Gene name)': geneNames,
                'GO ID': goId,
                'Disease comment': diseaseComment,
                'FunCat description': funCatDesc,
                'subunits(Protein name)': proteinNames,
                'subunits(Gene name syn)': geneNameSyns,
                'GO description': goDesc,
                'subunits(Entrez IDs)': entrezIDs,
                'Subunits comment': subunitsComment,
                'SWISSPROT organism': swissprotOrganism,
                'Complex comment': complexComment,
                'Cell line': cellLine,
                Organism,
                'PubMed ID': pubMedId,
                'FunCat ID': funCatId
            }) => ({
                name: ComplexName,
                purificationMethod: purifMethod,
                comment: complexComment,
                cellLine,
                organism: Organism,
                synonyms: Synonyms,
                complexIdExtern: ComplexID,
                diseaseComment,
                proteins: (uniprotIds || '').split(';'),
                proteinNames: (proteinNames || '').split(';'),
                geneNames: (geneNames || '').split(';'),
                geneNamesynonyms: (geneNameSyns || '').split(';'),

                goId: (goId || '').split(';'),
                goDescription: goDesc,

                entrezIds: (entrezIDs || '').split(';'),
                subunitsComment,
                swissprotOrganism: (swissprotOrganism || '').split(';'),

                pubMedId,
                funCatId: (funCatId || '').split(';'),
                funCatDescription: funCatDesc,
                createdAt: new Date(),
                updatedAt: new Date()
            })
        );

        return resolve(result);
    });
}

/**
* create all proteins given as a parameter
 * @param  { {findOrCreate: function() }}   proteinsModel
 * @param  { string[] }                     proteins      array of proteins, which have to be created for the m-to-n relation
 */
const seedProteins = (proteinsModel, proteins) => {
    // too many promises and 'TimeoutError: ResourceRequest timed out' happens
    let ret = Promise.resolve({added: 0, notAdded: 0});
    proteins.forEach(p => {
        ret = ret.then((stats) => Promise.all(
                    [
                        proteinsModel.findOrCreate({
                            where: {
                                uniprotId: p
                            },
                            defaults: {
                                uniprotId: p,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }
                        }),
                        Promise.resolve(stats)
                    ]
                )
            )
            .then(([results, stats]) => {
                if(results[1]) {stats.added++}
                else stats.notAdded++;
                return stats;
            });
    })
    return ret
        .then((s) => console.warn(`SEEDING PROTEINS (for complexes) finished (new:${s.added}, old:${s.notAdded})`))
        .catch(console.error);
}

/**
 * extract proteins from an array of complexes
 * @param  { complex[] }        complexes   array of complexes
 * @return { string[] }         proteins    array of proteins, contained in complexes[] (distinct)
 */
const extractProteins = (complexes) => {
    const res = new Set();
    complexes.forEach(d => (d.proteins || []).forEach(p => res.add(p)));
    return Array.from(res);
}

/**
 * for each complex given:
 * 1. create the complex
 * 2. create all proteinComplex entries (m-to-n relation protein to complex)
 * @param  { { findOrCreate: function() } } complexModel         the complex model
 * @param  { { findOrCreate: function() } } proteinXComplexModel the m-to-n relation model
 * @param  { complex[] }                    complexes            array of complexes
 */
const seedComplexesAndCreateMtoNTableEntry = (complexModel, proteinXComplexModel, complexes) => {
    let ret = Promise.resolve([undefined, {cAdded: 0, cNotAdded: 0, mToNAdded: 0, mToNNotAdded: 0}]);
    complexes.forEach(complex => {
        const proteins = complex.proteins;

        ret = ret
            .then(([res, stats]) =>
                Promise.all([
                    complexModel.findOrCreate({
                        where: {
                            complexIdExtern: complex.complexIdExtern
                        },
                        defaults: complex
                    }),
                    Promise.resolve(stats)
                ])
                .then(([result, stats]) => {
                    if(result[1]) {
                        stats.cAdded++;
                        return [result[0].dataValues, stats];
                    } else {
                        stats.cNotAdded++;
                        return [undefined, stats];
                    }
                })
            );

        ret = ret
            .then(
                ([createdComplex, stats]) => {
                    let retP = [Promise.resolve(stats)];
                    if(createdComplex) {
                        proteins.forEach(protein => {
                            retP.push(proteinXComplexModel.findOrCreate({
                                where: {
                                    'uniprotId': protein,
                                    'complexId': createdComplex.id
                                },
                                defaults: {
                                    'uniprotId': protein,
                                    'complexId': createdComplex.id
                                }
                            }))
                        });
                    }
                    return Promise.all(retP);
                }
            )
            .then(
                (results) => {
                    if(results.length > 1) {
                        for(let i=1; i<results.length; i++) {
                            if(results[i]) {
                                results[0].mToNAdded++;
                            } else {
                                results[0].mToNNotAdded++;
                            }
                        }
                    }
                    return [undefined, results[0]];
                }
            );



    });
    return ret
        .then(([res, s]) => {
            console.warn(`SEEDING COMPLEXES finished (new:${s.cAdded}, old:${s.cNotAdded})`);
            if(s.mToNAdded !== 0 || s.mToNNotAdded !== 0)
                console.warn(`SEEDING M_TO_N (table protein_complexes) finished (new:${s.mToNAdded}, old:${s.mToNNotAdded})`);
        })
        .catch(console.error);
}
