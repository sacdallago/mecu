// store.js https://github.com/marcuswestin/store.js/

StorageManager = {};

/*
    protein: {
        uniprotId: string,
        experiment: [number]
    }
    or array of it
 */

StorageManager.splitUpProteinIntoExperiments = (protein) => {
    if(protein.experiment.constructor === Array) {
        protein = protein.experiment.map(e => ({
            uniprotId: protein.uniprotId,
            experiment: e
        }))
    } else {
        protein = [protein];
    }
    return protein;
}

StorageManager.splitUpProteins = (proteins) => {
    let tmp = [];
    proteins.forEach(p => {
        tmp = tmp.concat(StorageManager.splitUpProteinIntoExperiments(p));
    });
    return tmp;
}

StorageManager.add = function(proteins, callback) {
    if (proteins.constructor !== Array) {
        proteins = StorageManager.splitUpProteinIntoExperiments(proteins);
    } else {
        StorageManager.splitUpProteins(proteins);
    }

    let current = store.get('proteins') || {};

    proteins.forEach(protein => {
        // if id not present, add it with experiment
        if(!current[protein.uniprotId]) {
            current[protein.uniprotId] = [protein.experiment];
        }
        // if id present and experiment not in list
        if(current[protein.uniprotId].indexOf(protein.experiment) === -1) {
            current[protein.uniprotId].push(protein.experiment);
        }
    });

    store.set('proteins', current);

    callback(current);
    return current;
};

StorageManager.remove = function(proteins, callback) {
    if (proteins.constructor !== Array) {
        proteins = StorageManager.splitUpProteinIntoExperiments(proteins);
    } else {
        StorageManager.splitUpProteins(proteins);
    }

    let current = store.get('proteins') || {};

    proteins.forEach(protein => {
        // if id not present, add it with experiment
        if(current[protein.uniprotId] && current[protein.uniprotId].indexOf(protein.experiment) > -1) {
            current[protein.uniprotId].splice(current[protein.uniprotId].indexOf(protein.experiment), 1);

            // remove id if list of experiments is empty
            if(current[protein.uniprotId] && current[protein.uniprotId].length === 0) {
                delete current[protein.uniprotId];
            }
        }
    });

    store.set('proteins', current);

    callback(current);
    return current;
};

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
        // if id not present, add it with experiment
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
