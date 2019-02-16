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
 * @param   { ({uniprotId: string, experiment: [number]} | {uniprotId: string, experiments: [number]}) } protein - a protein or an array of proteins
 * @return  { {uniprotId: string, experiment}[] } the protein(s) split up to be only arrays of protein/experiment pairs
 */
StorageManager.splitUpProteinIntoExperiments = (protein) => {
    // case if it's protein data used on the client
    if(protein.experiment && protein.experiment.constructor === Array) {
        return protein.experiment.map(e => ({
            uniprotId: protein.uniprotId,
            experiment: e
        }));
    }
    // case if it's protein data from the server
    else if(protein.experiments && protein.experiments.constructor === Array){
        return protein.experiments.map(e => ({
            uniprotId: protein.uniprotId,
            experiment: e.experiment
        }));
    } else {
        return [protein];
    }
};

/**
 * takes a list of proteins, hands them to the StorageManager.splitUpProteinIntoExperiments function
 * @param  { {uniprotId: string, (experiment: string| experiments: {experiment})}[] } proteins - list of proteins
 * @return { {uniprotId: string, experiment: string}[] } the protein(s) split up to be only arrays of protein/experiment pairs
 */
StorageManager.splitUpProteins = (proteins) => {
    let tmp = [];
    proteins.forEach(p => {
        tmp = tmp.concat(StorageManager.splitUpProteinIntoExperiments(p));
    });
    return tmp;
};

/**
 * takes a proteins object:
 * 1. if it's an array (it is of form: {uniprotId: string, (experiment: string| experiments: {experiment})}[] ):
 *      apply function StorageManager.splitUpProteins onto it
 * 2. if it's NOT an array, meaning one or the other protein object (it is of form: {uniprotId: string, experiment: [number]} or {uniprotId: string, experiments: [number]}  )
 *      apply function StorageManager.splitUpProteinIntoExperiments onto it
 *
 * converts the input into the type which is used in the local storage
 * @param  { }                                                      proteins proteins input
 * @return { {uniprotId: string, experiment: string}[] }            proteins output as in localStorage
 */
StorageManager.standardizeProteins = (proteins) => {
    if (proteins.constructor !== Array) {
        return StorageManager.splitUpProteinIntoExperiments(proteins);
    } else {
        return StorageManager.splitUpProteins(proteins);
    }
};

StorageManager.add = function(proteins, callback) {

    proteins = StorageManager.standardizeProteins(proteins);

    let current = store.get(`proteins`) || {};
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
    });

    store.set(`proteins`, current);

    // TODO use promise instead of callback
    callback(current, added, removed);

    return current;
};

/**
 * toggle a protein/list of proteins
 * if the protein is already in memory, it is removed, otherwise it is added
 * @param  {[type]}   proteins same input as for all these functions in storage manager
 * @param  {Function} callback callback which has (current, added, removed) as numbers parameters
 * @return {[type]}            returns the current state of the storage
 */
StorageManager.toggle = function(proteins, callback) {
    proteins = StorageManager.standardizeProteins(proteins);

    let current = store.get(`proteins`) || {};
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

    store.set(`proteins`, current);

    // TODO use promise instead of callback
    callback(current, added, removed);

    return current;
};

/**
 * works the same as toggle, but does not add/remove any
 * @param  {[type]}   proteins same input as for all of these functions
 * @param  {Function} callback callback which has (current, added, removed) as numbers parameters
 * @return {[type]}            current state of the storage
 */
StorageManager.has = function(proteins, callback) {

    proteins = StorageManager.standardizeProteins(proteins);

    let current = store.get(`proteins`) || {};
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

    if(callback) {
        callback(current, has, hasNot);
    }

    return current;
};

StorageManager.getProteins = function() {
    let proteinsObj = store.get(`proteins`) || {};
    return Object.keys(proteinsObj).map(i => ({uniprotId:i, experiment: proteinsObj[i]})) || [];
};

StorageManager.clear = function() {
    store.remove(`proteins`);
    return;
};

StorageManager.setFullScreenProteinsSettings = (proteins, experiments, coloring) => {
    return store.set(
        `fullscreenProteinSettings`,
        {
            proteins: proteins,
            experiments: experiments,
            coloring: coloring
        }
    );
};
StorageManager.getFullScreenProteinsSettings = () => {
    const ret = {proteins: [], experiments: [], coloring: 0};
    return store.get(`fullscreenProteinSettings`) || ret;
};

StorageManager.setFullscreenPPISettings = (proteinList, experimentList, relativeCorrelation) => {
    return store.set(`fullscreenPPISettings`, {data: {proteinList: proteinList, experimentList: experimentList}, relativeCorrelation: relativeCorrelation});
};
StorageManager.getFullScreenPPISettings = () => {
    const ret = {data:{proteinList: [], experimentList: []}, relativeCorrelation: true};
    return store.get(`fullscreenPPISettings`) || ret;
};


// check structure of 'proteins' in local storage
(function (s) {
    let proteins = s.getProteins();
    let ok = true;
    if(proteins.constructor !== Array){
        ok = false;
        console.error(`Local storage had faulty values... (L0)`, proteins);
    } else {
        for(let i = 0; i<proteins.length; i++) {
            if(
                proteins[i].constructor !== Object ||
                proteins[i].uniprotId === undefined ||
                proteins[i].uniprotId.constructor !== String ||
                proteins[i].uniprotId === null ||
                proteins[i].experiment === undefined ||
                proteins[i].experiment.constructor !== Array
            ) {
                ok = false;
                console.error(`Local storage had faulty values... (L1)`, proteins[i]);
                break;
            }

            for(let j = 0; j<proteins[i].experiment.length; j++) {
                if(proteins[i].experiment[j] === null || proteins[i].experiment[j].constructor !== Number) {
                    console.log(`null value found or not a number `);
                    ok = false;
                    console.error(`Local storage had faulty values... (L2)`, proteins[i].experiment);
                    break;
                }
            }
        }

        if(!ok) {
            s.clear();
            console.error(`Local storage had faulty values... cleared local storage`, proteins);
        } else {
            console.log(`Local Storage data is viable`);
        }
    }
})(StorageManager);
