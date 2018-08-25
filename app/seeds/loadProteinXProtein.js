const fs = require('fs');


module.exports = function(filePath) {
    const proteinsModel = context.component('models').module('proteins');

    console.warn('SEEDING PROTEIN X PROTEIN INTERACTION');

    return loadFileAndParseAttributes(filePath)
        .then(result => {
            console.warn(`SEEDING PROTEIN X PROTEIN: ${result.length} found`);
            return result;
        })
        .then(data => seedNecessaryProteins(proteinsModel, data))
        .then(done => console.warn(`SEEDING PROTEIN X PROTEIN finished`))
        .catch(e => console.error('Problem seeding protein x protein', e));
}

/**
 * load the file content, read and map attributes
 * @param  { string }                       filePath string, where the file lies in  relation to app.js
 * @return { {...attributes:values}[] }     the data read from the file (mapped to the correct variables)
 */
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

        // content = content.slice(0,1000);

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

const seedNecessaryProteins = function(arrOfProteinXProteinInterations) {
    try {
        let str = '';
        data.forEach((d,i,a) => {
            str +=`INSERT INTO public.protein_proteins VALUES `+
            `('${d.interactor1}', ${d.geneId1}, '${d.interactor2}', ${d.geneId2}, ${d.correlation}, `+
            `'{${d.experiments.map(e => `"${e}"`).join(',')}}',`+
            `'{${d.pmids.map(e => `"${e}"`).join(',')}}',`+
            `'{${d.sources.map(e => `"${e}"`).join(',')}}', '${d.species.replace('\'','\'\'')}', `+
            `'${d.createdAt.toUTCString()}', '${d.updatedAt.toUTCString()}')`+
            ' ON CONFLICT DO NOTHING'+
            // `WHERE NOT EXISTS (SELECT interactor1, interactor2, correlation FROM public.protein_proteins`+
            // `WHERE interactor1 = '${d.interactor1}' and interactor2 = '${d.interactor2}' and correlation = ${d.correlation})`+
            `;\n`;
            if(i%10000 === 0) console.log(i);
        });
        fs.writeFileSync('private/insert_into_protein_protein.txt', str, {flag: 'w'}, function (err) {
            if (err) {
                console.log('appending error', err)
            }
        })
    } catch(e) {
        console.log('e', e);
    }
}
