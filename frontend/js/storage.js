StorageManager = {};

StorageManager.saveProteins = function(proteins) {
    if (typeof(proteins) === 'undefined' || proteins === null || typeof(proteins) !== 'object') {
        throw "Invalid parameter passed";
    }
    if (proteins.constructor !== Array) {
        proteins = [proteins];
    }

    let current = window.localStorage.getItem('proteins') || {};

    proteins.forEach(function(protein) {
        if(typeof(protein.reads) === 'undefined' || protein.reads === null || typeof(protein.reads) !== 'object'){
            throw "Protein " + protein.uniprotId + " has bad formatted reads.";
        }
        if (protein.reads.constructor !== Array) {
            protein.reads = [protein.reads];
        }

        protein.reads.forEach(function(read) {
            let currentCurveId = protein.uniprotId+"-E"+read.experiment;

            if(current.data[currentCurveId] === undefined){
                let current = (function(p) {
                    let t = {};
                    for(let k in p){
                        if(k != "reads"){
                            t[k] = p.k;
                        }
                    }
                    t.reads = [read];
                    return t;
                })(protein);

                current.data[currentCurveId] = current;
            }
        });
    });
}