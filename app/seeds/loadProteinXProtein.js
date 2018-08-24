const fs = require('fs');
const filePath = 'private/hippie_current_uniprotID.json';
load(filePath);
const load = function(filePath) {

    console.warn('SEEDING PROTEIN X PROTEIN INTERACTION');

    return loadFileAndParseAttributes(filePath)
        .then(result => {
            console.warn(`SEEDING PROTEIN X PROTEIN: ${result.length} found`);
            return result;
        })
        // .then(data => seedProteinXProtein(proteinXProteinModel, data))
        .then(data => createInsertIntoFile(data))
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

const seedProteinXProtein = function(pxpiModel, arrOfProteinXProteinInterations) {
    const atOnce = 2000;
    let p = [];
    for(let i=0, j=-1; i<arrOfProteinXProteinInterations.length; i++) {
        if(i%atOnce === 0) {
            p.push([]);
            j++;
        }
        p[j].push(
            pxpiModel.findOrCreate({
                where: {
                    interactor1: arrOfProteinXProteinInterations[i].interactor1,
                    interactor2: arrOfProteinXProteinInterations[i].interactor2
                },
                defaults: arrOfProteinXProteinInterations[i]
            })
            .catch(e => console.error(`error findOrCreate: ${arrOfProteinXProteinInterations[i]} error: ${e.message}`))
        );
    }
    console.warn('creating promises');
    let ret = Promise.resolve();
    p.forEach(arrOfPromises => ret = ret.then(
        () => Promise.all(arrOfPromises)
        .then(arrRes => {
            let added = 0, notAdded = 0;
            arrRes.forEach(res => res && res[1] ? added++ : notAdded++);
            console.log(`added: ${added}, notAdded: ${notAdded}`);
        })
    ));
    return ret;

    // let ret = Promise.resolve();
    // arrOfProteinXProteinInterations.forEach(pxpi => {
    //     ret = ret.then(() => pxpiModel.findOrCreate({
    //             where: {
    //                 interactor1: pxpi.interactor1,
    //                 interactor2: pxpi.interactor2
    //             },
    //             defaults: pxpi
    //         })
    //         .catch(e => console.error(`error findOrCreate error: ${e.message}`, pxpi))
    //     )
    // })
    // return ret;

    // console.log('context', context);
    // return context.dbConnection.queryInterface.bulkInsert('protein_proteins', arrOfProteinXProteinInterations)
    //     .then(console.warn);
    // let ret = Promise.resolve({added: 0, notAdded: 0});
    // arrOfProteinXProteinInterations.forEach(pxpi => {
    //     // ret = ret.then(stats => Promise.all([
    //             p.push(pxpiModel.findOrCreate({
    //                 where: {
    //                     interactor1: pxpi.interactor1,
    //                     interactor2: pxpi.interactor2
    //                 },
    //                 defaults: pxpi
    //             })
    //             .then(results => {
    //                 // if(results[1]) {console.warn('added', results[0].interactor1)}
    //             })
    //             .catch(e => console.warn(pxpi, e))
    //
    //         );
    //         //     ,
    //         //     Promise.resolve(stats)
    //         // ])
    //         // )
    //         // .then(([results, stats]) => {
    //         //     if(results[1]) {stats.added++}
    //         //     else stats.notAdded++;
    //         //     return stats;
    //         // });
    // });

    // return p;
    //
    // return ret
    //     .then((s) => console.warn(`SEEDING PROTEIN X PROTEIN finished (new:${s.added}, old:${s.notAdded})`));
}


const createInsertIntoFile = (data) => {
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
