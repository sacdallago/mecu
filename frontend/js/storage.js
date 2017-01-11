StorageManager = {};

StorageManager.add = function(proteins, callback) {
    if (typeof(proteins) === 'undefined' || proteins === null || typeof(proteins) !== 'object') {
        throw "Invalid parameter passed";
    }
    if (proteins.constructor !== Array) {
        proteins = [proteins];
    }

    let current = JSON.parse(window.localStorage.getItem('proteins')) || {};

    proteins.forEach(function(protein) {
        if(typeof(protein.reads) === 'undefined' || protein.reads === null || typeof(protein.reads) !== 'object'){
            throw "Protein " + protein.uniprotId + " has bad formatted reads.";
        }
        if (protein.reads.constructor !== Array) {
            protein.reads = [protein.reads];
        }

        protein.reads.forEach(function(read) {
            let currentCurveId = protein.uniprotId+"-E"+read.experiment;

            if(current[currentCurveId] === undefined){
                let newItem = (function(p) {
                    let t = {};
                    for(let k in p){
                        if(k != "reads"){
                            t[k] = p.k;
                        }
                    }
                    t.reads = [read];
                    return t;
                })(protein);

                current[currentCurveId] = newItem;
            }
        });
    });

    window.localStorage.setItem('proteins', JSON.stringify(current));

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

    let current = JSON.parse(window.localStorage.getItem('proteins')) || {};

    proteins.forEach(function(protein) {
        if(typeof(protein.reads) === 'undefined' || protein.reads === null || typeof(protein.reads) !== 'object'){
            throw "Protein " + protein.uniprotId + " has bad formatted reads.";
        }
        if (protein.reads.constructor !== Array) {
            protein.reads = [protein.reads];
        }

        protein.reads.forEach(function(read) {
            let currentCurveId = protein.uniprotId+"-E"+read.experiment;
            delete current[currentCurveId];
        });
    });

    window.localStorage.setItem('proteins', JSON.stringify(current));

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

    let current = JSON.parse(window.localStorage.getItem('proteins')) || {};
    let removed = 0;
    let added = 0;

    proteins.forEach(function(protein) {
        if(typeof(protein.reads) === 'undefined' || protein.reads === null || typeof(protein.reads) !== 'object'){
            throw "Protein " + protein.uniprotId + " has bad formatted reads.";
        }
        if (protein.reads.constructor !== Array) {
            protein.reads = [protein.reads];
        }

        protein.reads.forEach(function(read) {
            let currentCurveId = protein.uniprotId+"-E"+read.experiment;

            if(current[currentCurveId] === undefined){
                let newItem = (function(p) {
                    let t = {};
                    for(let k in p){
                        if(k != "reads"){
                            t[k] = p.k;
                        }
                    }
                    t.reads = [read];
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

    window.localStorage.setItem('proteins', JSON.stringify(current));
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

    let current = JSON.parse(window.localStorage.getItem('proteins')) || {};
    let has = 0;
    let hasNot = 0;

    proteins.forEach(function(protein) {
        if(typeof(protein.reads) === 'undefined' || protein.reads === null || typeof(protein.reads) !== 'object'){
            throw "Protein " + protein.uniprotId + " has bad formatted reads.";
        }
        if (protein.reads.constructor !== Array) {
            protein.reads = [protein.reads];
        }

        protein.reads.forEach(function(read) {
            let currentCurveId = protein.uniprotId+"-E"+read.experiment;

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