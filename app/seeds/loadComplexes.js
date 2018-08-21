const fs = require('fs');

/*
to load a diffrent type of file:
0. delete the complexes table from the database
1. change the database fields
2. change the fields below
 */
module.exports = function() {
    return {
        loadComplexes: function(filePath) {

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
                'Protein complex purification method': purifMethod, //
                'subunits(UniProt IDs)': uniprotIds,
                Synonyms,
                ComplexName,
                'subunits(Gene name)': geneNames,
                'GO ID': goId,
                'Disease comment': diseaseComment,
                'FunCat description': funCatDesc, //
                'subunits(Protein name)': proteinNames, //
                'subunits(Gene name syn)': geneNameSyns,
                'GO description': goDesc, //
                'subunits(Entrez IDs)': entrezIDs,
                'Subunits comment': subunitsComment,
                'SWISSPROT organism': swissprotOrganism, //
                'Complex comment': complexComment, //
                'Cell line': cellLine,
                Organism,
                'PubMed ID': pubMedId,
                'FunCat ID': funCatId
            }) => ({
                name: ComplexName,
                purificationMethod: purifMethod, //
                comment: complexComment, //
                cellLine,
                organism: Organism,
                synonyms: Synonyms,
                complexIdExtern: ComplexID,
                diseaseComment,
                proteins: (uniprotIds || '').split(';'),
                proteinNames: (proteinNames || '').split(';'), //
                geneNames: (geneNames || '').split(';'),
                geneNamesynonyms: (geneNameSyns || '').split(';'), //

                goId: (goId || '').split(';'),
                goDescription: goDesc, //

                entrezIds: (entrezIDs || '').split(';'),
                subunitsComment,
                swissprotOrganism: (swissprotOrganism || '').split(';'), //

                pubMedId,
                funCatId: (funCatId || '').split(';'),
                funCatDescription: funCatDesc
                ,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            return Promise.resolve(result);
        }
    }
}
