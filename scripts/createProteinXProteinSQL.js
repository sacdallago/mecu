const fs = require('fs');

const load = function(filePath) {
    return loadFileAndParseAttributes(filePath)
        .then(data => createInsertIntoFile(data))
        .then(() => console.log(`created files:\n\t\tP_1_protein.sql\n\t\tP_2_proteinXprotein.sql\nExecute in this order!`))
        .catch(e => console.error('Problem seeding protein x protein', e));
}

const loadFileAndParseAttributes = function(filePath) {
    return new Promise((resolve,reject) => {
        let content;
        try {
            content = fs.readFileSync(filePath);
            content = JSON.parse(content);
        } catch(e) {
            console.error('problem loading/parsing file ', filePath, e);
            resolve([]);
        }

        // map to database attributes
        let result = content.map(({val0, val1, val2, val3, val4, val5}) => {
            let res = {};
            try {
                res = mapVal5(val5);
            } catch(e) {
                console.log('parsein error', e);
            }
            res['interactor1'] = val0;
            res['geneId1'] = val1;
            res['interactor2'] = val2;
            res['geneId2'] = val3;
            res['correlation'] = parseFloat(val4);
            res['createdAt'] = new Date();
            res['updatedAt'] = new Date();
            return res;
        });
        resolve(result);
    });
}

const mapVal5 = function(val5) {
    const ret = {
        experiments: [],
        pmids: [],
        sources: [],
        species: ''
    };
    let arr = val5.split(';');
    arr.forEach(e => {
        let tmp = e.split(':');
        if(tmp.length >= 2){
            if(tmp[0] === 'experiments') {
                ret['experiments'] = tmp[1].split(',');
            } else if(tmp[0] === 'pmids') {
                ret['pmids'] = tmp[1].split(',');
            } else if(tmp[0] === 'sources') {
                ret['sources'] = tmp[1].split(',')
            } else {
                ret['species'] = tmp[1] || '';
            }
        }
    });
    return ret;
}

const createInsertIntoFile = (data) => {
    try {
        let protein_string = '';
        let protein_proteins_string = '';
        let proteinSet = new Set();
        data.forEach((d,i,a) => {
            proteinSet.add(d.interactor1);
            proteinSet.add(d.interactor2);
            protein_proteins_string +=`INSERT INTO public.protein_proteins VALUES `+
            `('${d.interactor1}', ${d.geneId1}, '${d.interactor2}', ${d.geneId2}, ${d.correlation}, `+
            `'{${d.experiments.map(e => `"${e}"`).join(',')}}',`+
            `'{${d.pmids.map(e => `"${e}"`).join(',')}}',`+
            `'{${d.sources.map(e => `"${e}"`).join(',')}}', '${d.species.replace('\'','\'\'')}', `+
            `'${d.createdAt.toUTCString()}', '${d.updatedAt.toUTCString()}')`+
            ' ON CONFLICT DO NOTHING'+
            `;\n`;
        });
        Array.from(proteinSet).forEach(protein => {
            protein_string += `INSERT INTO public.proteins VALUES `+
            `('${protein}', '${new Date().toUTCString()}', '${new Date().toUTCString()}')  ON CONFLICT DO NOTHING;\n`;
        });
        fs.writeFileSync('scripts/P_2_proteinXprotein.sql', protein_proteins_string, {flag: 'w'}, function (err) {
            if (err) {
                console.log('appending error', err)
            }
        });
        fs.writeFileSync('scripts/P_1_protein.sql', protein_string, {flag: 'w'}, function (err) {
            if (err) {
                console.log('appending error', err)
            }
        })
    } catch(e) {
        console.log('e', e);
    }
}


const argv = process.argv;
if(argv.length >= 3) {
    load(process.argv[2]);
} else {
    console.error(`e.g.: node scripts/createProteinXProteinSQL.js scripts/hippie_current_uniprotID.json\n`+
        `yarn create-complex-sql scripts/hippie_current_uniprotID.json \n`
    )
}
