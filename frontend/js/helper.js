HelperFunctions = {};

/**
 *
 * @param  {[type]} gridIdentifier [description]
 * @param  { {uniprotId: string, experiments: {experiment: number, reads: {}[]} } } data           [description]
 * @return {[type]}                [description]
 */
HelperFunctions.drawItemForEveryExperiment = (gridIdentifierString, data, gridItemAppendexesFun) => {
    const gridIdentifier = $(gridIdentifierString);
    gridIdentifier.empty();

    const itemIdentifierPrefix = 'GRIDITEM'+HelperFunctions.generateRandomString();
    const curves = [];
    const items = [];

    data.forEach(obj => {
        obj.experiments.forEach((expRead, index, a) => {

            const gridItem = $('<div />')
                .addClass('grid-item')
                .attr({'id': [itemIdentifierPrefix, index, obj.uniprotId, expRead.experiment].join('').toLowerCase()});
            gridItem.append(gridItemAppendexesFun(obj, expRead));

            gridItem.data('grid-item-contents', {
                obj: obj,
                experiment: expRead,
                index: index
            });

            items.push(gridItem[0]);
        });
    });

    gridIdentifier.isotope('insert', items);

    data.forEach(obj => {

        obj.experiments.forEach((expRead, index, a) => {
            let curve = new MecuLine({
                element: "#"+[itemIdentifierPrefix, index, obj.uniprotId, expRead.experiment].join('').toLowerCase(),
                width:"200",
                height:"200",
                limit: 5,
                minTemp: 41,
                maxTemp: 64,
                minRatio: 0.1
            });

            curve.add({
                uniprotId: obj.uniprotId,
                experiments: [expRead]
            });

            curves.push(curve);
        });
    });
};

/**
 *
 * @param  {[type]} gridIdentifier [description]
 * @param  { {uniprotId: string, experiments: {experiment: number, reads: {}[]} } } data           [description]
 * @return {[type]}                [description]
 */
HelperFunctions.drawItemsAllExperimentsInOneItem = (gridIdentifierString, data, gridItemAppendexesFun) => {
    const gridIdentifier = $(gridIdentifierString);
    gridIdentifier.empty();

    const itemIdentifierPrefix = 'GRIDITEM'+HelperFunctions.generateRandomString();
    const curves = [];
    const items = [];

    data.forEach((obj,index,a) => {

        const gridItem = $('<div />')
            .addClass('grid-item')
            .attr({'id': [itemIdentifierPrefix, index, obj.id].join('').toLowerCase()});
        gridItem.append(gridItemAppendexesFun(obj));

        gridItem.data('grid-item-contents', {
            obj: obj,
            index: index
        });

        items.push(gridItem[0]);
    });

    gridIdentifier.isotope('insert', items);

    data.forEach((obj,index,a) => {

        let curve = new MecuLine({
            element: "#"+[itemIdentifierPrefix, index, obj.id].join('').toLowerCase(),
            width:"200",
            height:"200",
            limit: 5,
            minTemp: 41,
            maxTemp: 64,
            minRatio: 0.1
        });

        obj.experiments.forEach(expRead => {
            curve.add({
                uniprotId: obj.id,
                experiments: [expRead]
            });

            curves.push(curve);
        });
    });
}

HelperFunctions.generateRandomString = () => Math.random().toString(36).substring(7);

HelperFunctions.dateTimeStringPrettify = (dateTime) => {
    const dt = new Date(Date.parse(dateTime));
    return `${dt.getDate()}-${dt.getMonth()+1}-${dt.getFullYear()} ${dt.getHours()}:${dt.getMinutes()}`;
}

HelperFunctions.stringToColor = (string) => {
    // these 2 functions can eventually be outsourced into own utils(?) file
    let getHashCode = function(str) {
        let hash = 0;
        if (str.length == 0) return hash;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };
    let intToHSL = function(inputInt) {
        let shortened = inputInt % 360;
        return "hsl(" + shortened + ",100%,40%)";
    };
    return getHashCode(string).intToHSL();
}

HelperFunctions.delay = (function(){
    var timer = 0;
    return function(callback, ms){
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();
