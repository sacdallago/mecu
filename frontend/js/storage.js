StorageManager = {};

StorageManager.add = function(proteins, callback) {
    if (typeof(proteins) === 'undefined' || proteins === null || typeof(proteins) !== 'object') {
        throw "Invalid parameter passed";
    }
    if (proteins.constructor !== Array) {
        proteins = [proteins];
    }

    let current = store.get('proteins') || {};

    proteins.forEach(function(protein) {
        if(typeof(protein.experiments) === 'undefined' || protein.experiments === null || typeof(protein.experiments) !== 'object'){
            throw "Protein " + protein.uniprotId + " has bad formatted reads.";
        }
        if (protein.experiments.constructor !== Array) {
            protein.experiments = [protein.experiments];
        }

        protein.experiments.forEach(function(experiment) {
            let currentCurveId = protein.uniprotId+"-E"+experiment.experiment;

            if(current[currentCurveId] === undefined){
                let newItem = (function(p) {
                    let t = {};
                    for(let k in p){
                        if(k != "experiments"){
                            t[k] = p.k;
                        }
                    }
                    t.experiments = [experiment];
                    return t;
                })(protein);

                current[currentCurveId] = newItem;
            }
        });
    });

    store.set('proteins', current);

    callback(current);
    return current;
};

StorageManager.remove = function(proteins, callback) {
    if (typeof(proteins) === 'undefined' || proteins === null || typeof(proteins) !== 'object') {
        throw "Invalid parameter passed";
    }
    if (proteins.constructor !== Array) {
        proteins = [proteins];
    }

    let current = store.get('proteins') || {};

    proteins.forEach(function(protein) {
        if(typeof(protein.experiments) === 'undefined' || protein.experiments === null || typeof(protein.experiments) !== 'object'){
            throw "Protein " + protein.uniprotId + " has bad formatted reads.";
        }
        if (protein.experiments.constructor !== Array) {
            protein.experiments = [protein.experiments];
        }

        protein.experiments.forEach(function(experiment) {
            let currentCurveId = protein.uniprotId+"-E"+experiment.experiment;
            delete current[currentCurveId];
        });
    });

    store.set('proteins', current);

    callback(current);
    return current;
};

StorageManager.toggle = function(proteins, callback) {
    if (typeof(proteins) === 'undefined' || proteins === null || typeof(proteins) !== 'object') {
        throw "Invalid parameter passed";
    }
    if (proteins.constructor !== Array) {
        proteins = [proteins];
    }

    let current = store.get('proteins') || {};
    let removed = 0;
    let added = 0;

    proteins.forEach(function(protein) {
        if(typeof(protein.experiments) === 'undefined' || protein.experiments === null || typeof(protein.experiments) !== 'object'){
            throw "Protein " + protein.uniprotId + " has bad formatted reads.";
        }
        if (protein.experiments.constructor !== Array) {
            protein.experiments = [protein.experiments];
        }

        protein.experiments.forEach(function(experiment) {
            let currentCurveId = protein.uniprotId+"-E"+experiment.experiment;

            if(current[currentCurveId] === undefined){
                let newItem = (function(p) {
                    let t = {
                        p: protein.uniprotId,
                        e: experiment.experiment,
                        r: experiment.reads
                    };
                    return t;
                })(protein);

                current[currentCurveId] = newItem;
                added++;
            } else {
                delete current[currentCurveId];
                removed++;
            }
        });
    });

    store.set('proteins', current);

    callback(current, added, removed);

    return current;
};

StorageManager.has = function(proteins, callback) {
    if (typeof(proteins) === 'undefined' || proteins === null || typeof(proteins) !== 'object') {
        throw "Invalid parameter passed";
    }
    if (proteins.constructor !== Array) {
        proteins = [proteins];
    }

    let current = store.get('proteins') || {};
    let has = 0;
    let hasNot = 0;

    proteins.forEach(function(protein) {
        if(typeof(protein.experiments) === 'undefined' || protein.experiments === null || typeof(protein.experiments) !== 'object'){
            throw "Protein " + protein.uniprotId + " has bad formatted reads.";
        }
        if (protein.experiments.constructor !== Array) {
            protein.experiments = [protein.experiments];
        }

        protein.experiments.forEach(function(experiment) {
            let currentCurveId = protein.uniprotId+"-E"+experiment.experiment;

            if(current[currentCurveId] === undefined){
                hasNot++;
            } else {
                has++;
            }
        });
    });

    callback(current, has, hasNot);

    return current;
};

StorageManager.get = function() {
    let current = store.get('proteins') || {};
    let result = [];
    for(let k in current){
        let e = current[k];
        result.push({
            uniprotId: e.p,
            experiments: [{
                experiment: e.e,
                reads: e.r
            }]
        });
    }
    return result;
};

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
