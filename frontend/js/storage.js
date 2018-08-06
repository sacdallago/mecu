// store.js https://github.com/marcuswestin/store.js/

StorageManager = {};

/**
 * takes a protein or a list of proteins
 * and creates a list of uniprotId+experiment pairs
 *
 * TODO (remove) cases: either for the protein.experiment, which is used on the client
 *  or  for the protein.experiments, which comes from the server
 *
 * Examples:
 *      {uniprotId: 123, experiment: [4,5]} => [{uniprotId:123, experiment:4},{uniprotId:123, experiment:5}]
 *      [{uniprotId: 1234, experiment:[4]},{uniprotId:5678, experiment:[5]}] =>
 *          [{uniprotId: 1234, experiment:4},{uniprotId:5678, experiment:5}]
 * @param   { ({uniprotId: string, experiment: [number]} | [{uniprotId: string, experiment: [number]}]) } protein - a protein or an array of proteins
 * @return  { {uniprotId: string, experiment}[] } the protein(s) split up to be only arrays of protein/experiment pairs
 */
StorageManager.splitUpProteinIntoExperiments = (protein) => {
    // case if it's protein data used on the client
    if(protein.experiment && protein.experiment.constructor === Array) {
        return protein.experiment.map(e => ({
            uniprotId: protein.uniprotId,
            experiment: e
        }))
    }
    // case if it's protein data from the server
    else if(protein.experiments && protein.experiments.constructor === Array){
        return protein.experiments.map(e => ({
            uniprotId: protein.uniprotId,
            experiment: e.experiment
        }))
    } else {
        return [protein];
    }
}

/**
 * takes a list of proteins, hands them to the StorageManager.splitUpProteinIntoExperiments function
 * @param  { {uniprotId: string, (experiment:string| experiments:{experiment})}[] } proteins - list of proteins
 * @return { {uniprotId: string, experiment}[] } the protein(s) split up to be only arrays of protein/experiment pairs
 */
StorageManager.splitUpProteins = (proteins) => {
    let tmp = [];
    proteins.forEach(p => {
        tmp = tmp.concat(StorageManager.splitUpProteinIntoExperiments(p));
    });
    return tmp;
}

// StorageManager.add = function(proteins, callback) {
//     if (proteins.constructor !== Array) {
//         proteins = StorageManager.splitUpProteinIntoExperiments(proteins);
//     } else {
//         StorageManager.splitUpProteins(proteins);
//     }
//
//     let current = store.get('proteins') || {};
//
//     proteins.forEach(protein => {
//         // if id not present, add it with experiment
//         if(!current[protein.uniprotId]) {
//             current[protein.uniprotId] = [protein.experiment];
//         }
//         // if id present and experiment not in list
//         if(current[protein.uniprotId].indexOf(protein.experiment) === -1) {
//             current[protein.uniprotId].push(protein.experiment);
//         }
//     });
//
//     store.set('proteins', current);
//
//     callback(current);
//     return current;
// };

// StorageManager.remove = function(proteins, callback) {
//     if (proteins.constructor !== Array) {
//         proteins = StorageManager.splitUpProteinIntoExperiments(proteins);
//     } else {
//         StorageManager.splitUpProteins(proteins);
//     }
//
//     let current = store.get('proteins') || {};
//
//     proteins.forEach(protein => {
//         // if id present and experiment in list, remove experiment
//         if(current[protein.uniprotId] && current[protein.uniprotId].indexOf(protein.experiment) > -1) {
//             current[protein.uniprotId].splice(current[protein.uniprotId].indexOf(protein.experiment), 1);
//
//             // remove id if list of experiments is empty
//             if(current[protein.uniprotId] && current[protein.uniprotId].length === 0) {
//                 delete current[protein.uniprotId];
//             }
//         }
//     });
//
//     store.set('proteins', current);
//
//     callback(current);
//     return current;
// };

StorageManager.toggle = function(proteins, callback) {
    if (proteins.constructor !== Array) {
        proteins = StorageManager.splitUpProteinIntoExperiments(proteins);
    } else {
        StorageManager.splitUpProteins(proteins);
    }

    let current = store.get('proteins') || {};
    let removed = 0;
    let added = 0;

    proteins.forEach(protein => {
        // if id not present, add it with experiment
        if(!current[protein.uniprotId]) {
            current[protein.uniprotId] = [protein.experiment];
            added++;
        }
        // if id present and experiment not in list
        else if(current[protein.uniprotId].indexOf(protein.experiment) === -1) {
            current[protein.uniprotId].push(protein.experiment);
            added++;
        }
        // if id present and experiment in list, remove experiment
        else if(current[protein.uniprotId] && current[protein.uniprotId].indexOf(protein.experiment) > -1) {
            current[protein.uniprotId].splice(current[protein.uniprotId].indexOf(protein.experiment), 1);
            removed--;

            // remove id if list of experiments is empty
            if(current[protein.uniprotId] && current[protein.uniprotId].length === 0) {
                delete current[protein.uniprotId];
            }
        }
    });

    store.set('proteins', current);

    // TODO use promise instead of callback
    callback(current, added, removed);

    return current;
};

StorageManager.has = function(proteins, callback) {
    if (proteins.constructor !== Array) {
        proteins = StorageManager.splitUpProteinIntoExperiments(proteins);
    } else {
        StorageManager.splitUpProteins(proteins);
    }


    let current = store.get('proteins') || {};
    let has = 0;
    let hasNot = 0;

    proteins.forEach(protein => {
        // if id not present, add it with experiment
        if(!current[protein.uniprotId]) {
            hasNot++;
        }
        // if id present and experiment not in list
        else if(current[protein.uniprotId].indexOf(protein.experiment) === -1) {
            hasNot++;
        }
        // if id not present, add it with experiment
        else if(current[protein.uniprotId] && current[protein.uniprotId].indexOf(protein.experiment) > -1) {
            has++;
        }
    });

    callback(current, has, hasNot);

    return current;
};

StorageManager.get = function() {
    let proteinsObj = store.get('proteins') || {};
    return Object.keys(proteinsObj).map(i => ({uniprotId:i, experiment: proteinsObj[i]})) || [];
};

StorageManager.clear = function() {
    store.remove('proteins');
    return;
}

StorageManager.setMaxTemp = function(temp) {
    return store.set('maxTemp', parseFloat(temp));
};
StorageManager.setMinTemp = function(temp) {
    return store.setItem('minTemp', parseFloat(temp));
};

StorageManager.getMaxTemp = function() {
    let t = store.get('maxTemp');
    return (t != "NaN" ? t : undefined);
};
StorageManager.getMinTemp = function() {
    let t = store.get('minTemp');
    return (t != "NaN" ? t : undefined);
};
