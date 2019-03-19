const fs = require(`fs`);
const FILE_TO_CREATE_NAME = `1_COMPLEXES.sql`;


const load = function(filePath) {

    return loadFileAndParseAttributes(filePath)
        .then(complexes => {
            createProteinSql(extractProteins(complexes));
            return complexes;
        })
        .then(complexes => createComplexesAndMtoNSQL(complexes))
        .then(() => console.log(`Created files:\n\t\tscripts/${FILE_TO_CREATE_NAME}\n`))
        .catch(e => console.error(`Problem seeding`, e));
};

/**
 * load the file content, read and map attributes
 * @param  { string } filePath string, where the file lies in  relation to app.js
 * @return { {...attributes:values}[] }          the data read from the file (mapped to the correct variables)
 */
const loadFileAndParseAttributes = function(filePath) {
    return new Promise(resolve => {
        let content;
        try {
            content = fs.readFileSync(filePath);
            content = JSON.parse(content);
        } catch(e) {
            console.error(`problem loading/parsing file `, filePath, e);
            resolve([]);
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
            name: (ComplexName || ``),
            purificationMethod: (purifMethod || ``),
            comment: (complexComment || ``),
            cellLine: (cellLine || ``),
            organism: (Organism || ``),
            synonyms: (Synonyms || ``),
            complexIdExtern: ComplexID,
            diseaseComment: (diseaseComment || ``),
            proteins: (uniprotIds || ``).split(`;`),
            proteinNames: (proteinNames || ``).split(`;`),
            geneNames: (geneNames || ``).split(`;`),
            geneNamesynonyms: (geneNameSyns || ``).split(`;`),

            goId: (goId || ``).split(`;`),
            goDescription: (goDesc || ``),

            entrezIds: (entrezIDs || ``).split(`;`),
            subunitsComment: (subunitsComment || ``),
            swissprotOrganism: (swissprotOrganism || ``).split(`;`),

            pubMedId,
            funCatId: (funCatId || ``).split(`;`),
            funCatDescription: (funCatDesc || ``),
            createdAt: new Date(),
            updatedAt: new Date()
        })
        );

        resolve(result);
    });
};

/**
 * extract proteins from an array of complexes
 * @param  { complex[] }        complexes   array of complexes
 * @return { string[] }         proteins    array of proteins, contained in complexes[] (distinct)
 */
const extractProteins = (complexes) => {
    const res = new Set();
    complexes.forEach(d => (d.proteins || []).forEach(p => res.add(p)));
    return Array.from(res);
};

const createProteinSql = (proteins) => {

    let protein_string = ``;
    proteins.forEach(protein => {
        protein_string += `INSERT INTO public.proteins VALUES `+
        `('${protein}', '${new Date().toUTCString()}', '${new Date().toUTCString()}')  ON CONFLICT DO NOTHING;\n`;
    });

    fs.writeFileSync(`scripts/`+FILE_TO_CREATE_NAME, protein_string, {flag: `w`}, function (err) {
        if (err) {
            console.log(`appending error`, err);
        }
    });
};

const createComplexesAndMtoNSQL = (complexes) => {
    let complexes_string = ``;
    let m_to_n_string = ``;
    let index = 1; // start here, from where the last entry of the complexes is +1

    complexes.forEach(complex => {
        complexes_string += `INSERT INTO public.complexes`+
            `(id, name, "purificationMethod", comment, "cellLine", organism, synonyms, `+
            `"complexIdExtern", "diseaseComment", proteins, "proteinNames", "geneNames", `+
            `"geneNamesynonyms", "goId", "goDescription", "entrezIds", "subunitsComment", `+
            `"swissprotOrganism", "pubMedId", "funCatId", "funCatDescription", "createdAt", "updatedAt")`+
            ` VALUES (`+
            `${index}, `+
            `'${complex.name.replace(/\'/g,``)}', `+
            `'${complex.purificationMethod.replace(/\'/g,`^`)}',`+
            `'${complex.comment.replace(/\'/g,`^`)}',`+
            `'${complex.cellLine.replace(/\'/g,`^`)}',`+
            `'${complex.organism.replace(/\'/g,`^`)}',`+
            `'${complex.synonyms.replace(/\'/g,`^`)}',`+
            `${complex.complexIdExtern},`+
            `'${complex.diseaseComment.replace(/\'/g,`^`)}',`+
            `'{${complex.proteins.map(p => `"${p.replace(/\'/g,`^`)}"`).join(`,`)}}',`+
            `'{${complex.proteinNames.map(p => `"${p.replace(/\'/g,`^`)}"`).join(`,`)}}',`+
            `'{${complex.geneNames.map(p => `"${p.replace(/\'/g,`^`)}"`).join(`,`)}}',`+
            `'{${complex.geneNamesynonyms.map(p => `"${p.replace(/\'/g,`^`)}"`).join(`,`)}}',`+
            `'{${complex.goId.map(p => `"${p.replace(/\'/g,`^`)}"`).join(`,`)}}',`+
            `'${complex.goDescription.replace(/\'/g,`^`)}',`+
            `'{${complex.entrezIds.map(p => `"${p.replace(/\'/g,`^`)}"`).join(`,`)}}',`+
            `'${complex.subunitsComment.replace(/\'/g,`^`)}',`+
            `'{${complex.swissprotOrganism.map(p => `"${p.replace(/\'/g,`^`)}"`).join(`,`)}}',`+
            `${complex.pubMedId},`+
            `'{${complex.funCatId.map(p => `"${p.replace(/\'/g,`^`)}"`).join(`,`)}}',`+
            `'${complex.funCatDescription.replace(/\'/g,`^`)}',`+
            `'${complex.createdAt.toUTCString()}',`+
            `'${complex.updatedAt.toUTCString()}'`+
            `) ON CONFLICT DO NOTHING;\n`;

        complex.proteins.forEach(protein => {
            m_to_n_string += `INSERT INTO public.protein_complexes`+
                `("uniprotId", "complexId", "createdAt", "updatedAt")`+
                ` VALUES (` +
                `'${protein}', `+
                `${index}, `+
                `'${complex.createdAt.toUTCString()}',`+
                `'${complex.updatedAt.toUTCString()}'`+
                `) ON CONFLICT DO NOTHING;\n`;
        });

        index++;
    });

    fs.appendFileSync(`scripts/`+FILE_TO_CREATE_NAME, complexes_string, function (err) {
        if (err) {
            console.log(`appending error`, err);
        }
    });
    fs.appendFileSync(`scripts/`+FILE_TO_CREATE_NAME, m_to_n_string, function (err) {
        if (err) {
            console.log(`appending error`, err);
        }
    });

};


const argv = process.argv;
if(argv.length >= 3) {
    load(process.argv[2]);
} else {
    console.error(`e.g.: node scripts/createComplexesSQL.js scripts/010718corum_complexes.json\n`+
        `yarn create-complex-sql scripts/010718corum_complexes.json \n`
    );
}
