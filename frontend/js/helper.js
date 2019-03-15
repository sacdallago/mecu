HelperFunctions = {};

/**
 *
 * @param  {[type]} gridIdentifier [description]
 * @param  { {uniprotId: string, experiments: {experiment: number, reads: {}[]} } } data           [description]
 * @return {[type]}                [description]
 *
 * necessary for data:
 * {uniprotId, experiments:[{experiment}]}
 */
HelperFunctions.drawItemForEveryExperiment = (gridIdentifierString, data, gridItemAppendexesFun, maxCubesToDraw) => {
    const gridIdentifier = $(gridIdentifierString);
    gridIdentifier.empty();

    const itemIdentifierPrefix = `GRIDITEM`+HelperFunctions.generateRandomString();
    const curves = [];
    const items = [];

    let cubesNotDrawn = 0;
    let originalLength = data.length;
    if(maxCubesToDraw && originalLength - 1 > maxCubesToDraw) {
        cubesNotDrawn = originalLength -(maxCubesToDraw-1);
        data = data.slice(0,maxCubesToDraw-1);
    }

    data.forEach(obj => {
        obj.experiments.forEach((expRead, index) => {

            const gridItem = $(`<div />`)
                .addClass(`grid-item`)
                .attr({'id': [itemIdentifierPrefix, index, obj.uniprotId, expRead.experiment].join(`-`).toLowerCase()});
            gridItem.append(gridItemAppendexesFun(obj, expRead));

            gridItem.data(`grid-item-contents`, {
                obj: obj,
                experiment: expRead,
                index: index
            });

            items.push(gridItem[0]);
        });
    });

    if(maxCubesToDraw && originalLength - 1 > maxCubesToDraw) {
        const gridItem = $(`<div />`)
            .addClass(`grid-item`)
            .attr({'id':`more-cubes-cube`})
            .append([
                $(`<div />`)
                    .addClass(`center-text`)
                    .css({'position':`absolute`, 'top':`44%`, 'left':`58px`, 'font-size':`13pt`})
                    .text(`${cubesNotDrawn} more...`)
            ]);
        items.push(gridItem[0]);
    }

    gridIdentifier.isotope(`insert`, items);

    data.forEach(obj => {

        obj.experiments.forEach((expRead, index) => {

            const { min, max } = minMaxExpReads(expRead.reads);

            let curve = new MecuLine({
                element: `#`+[itemIdentifierPrefix, index, obj.uniprotId, expRead.experiment].join(`-`).toLowerCase(),
                width:`200`,
                height:`200`,
                minTemp: min,
                maxTemp: max,
                minRatio: 0.0
            });

            if(expRead.reads) {
                curve.add({
                    uniprotId: obj.uniprotId,
                    experiments: [expRead]
                });
            }

            curves.push(curve);
        });
    });

    if(maxCubesToDraw && originalLength - 1 > maxCubesToDraw) {
        new MecuLine({
            element: `#more-cubes-cube`,
            width:`200`,
            height:`200`,
            limit: 5,
            minTemp: 41,
            maxTemp: 64,
            minRatio: 0.2,
            maxRatio: 1.2
        });
    }
};

/**
 *
 * @param  {[type]} gridIdentifier [description]
 * @param  { {uniprotId: string, experiments: {experiment: number, reads: {}[]} } } data           [description]
 * @return {[type]}                [description]
 *
 * necessary for data:
 * {id, experiments}
 */
HelperFunctions.drawItemsAllExperimentsInOneItem = (gridIdentifierString, data, gridItemAppendexesFun, maxCubesToDraw) => {
    const gridIdentifier = $(gridIdentifierString);
    gridIdentifier.empty();

    const itemIdentifierPrefix = `GRIDITEM`+HelperFunctions.generateRandomString();
    const curves = [];
    const items = [];

    let cubesNotDrawn = 0;
    let originalLength = data.length;
    if(maxCubesToDraw && originalLength - 1 > maxCubesToDraw) {
        cubesNotDrawn = originalLength -(maxCubesToDraw-1);
        data = data.slice(0,maxCubesToDraw-1);
    }

    data.forEach((obj,index) => {

        const gridItem = $(`<div />`)
            .addClass(`grid-item`)
            .attr({'id': [itemIdentifierPrefix, index, obj.id].join(`-`).toLowerCase()});
        gridItem.append(gridItemAppendexesFun(obj));

        gridItem.data(`grid-item-contents`, {
            obj: obj,
            index: index
        });

        items.push(gridItem[0]);
    });

    if(maxCubesToDraw && originalLength - 1 > maxCubesToDraw) {
        const gridItem = $(`<div />`)
            .addClass(`grid-item`)
            .attr({'id':`more-cubes-cube`})
            .append([
                $(`<div />`)
                    .addClass(`center-text`)
                    .css({'position':`absolute`, 'top':`44%`, 'left':`58px`, 'font-size':`13pt`})
                    .text(`${cubesNotDrawn} more...`)
            ]);
        items.push(gridItem[0]);
    }

    gridIdentifier.isotope(`insert`, items);

    data.forEach((obj,index) => {

        const { min, max } = minMaxObjExpReads(obj);

        let curve = new MecuLine({
            element: `#`+[itemIdentifierPrefix, index, obj.id].join(`-`).toLowerCase(),
            width:`200`,
            height:`200`,
            limit: 5,
            minTemp: min,
            maxTemp: max,
            minRatio: 0.2,
            maxRatio: 1.2
        });

        obj.experiments.forEach(expRead => {
            if(expRead.reads) {
                curve.add({
                    uniprotId: obj.id,
                    experiments: [expRead]
                });
            }

            curves.push(curve);
        });
    });

    if(maxCubesToDraw && originalLength - 1 > maxCubesToDraw) {
        new MecuLine({
            element: `#more-cubes-cube`,
            width:`200`,
            height:`200`,
            limit: 5,
            minTemp: 41,
            maxTemp: 64,
            minRatio: 0.1
        });
    }
};

HelperFunctions.generateRandomString = () => Math.random().toString(36).substring(7);

HelperFunctions.dateTimeStringPrettify = (dateTime) => {
    const dt = new Date(Date.parse(dateTime));
    return `${dt.getDate()}-${dt.getMonth()+1}-${dt.getFullYear()} ${dt.getHours()}:${dt.getMinutes()}`;
};

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
        return `hsl(` + shortened + `,100%,40%)`;
    };
    return intToHSL(getHashCode(string));
};

HelperFunctions.delay = (function(){
    var timer = 0;
    return function(callback, ms){
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

const minMaxExpReads = (reads) => {
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;

    reads.forEach(r => {
        if (r.t < min) {
            min = r.t;
        }
        if (r.t > max) {
            max = r.t;
        }
    });

    min -= 1;
    max += 2;

    return {min, max};
}

const minMaxObjExpReads = (obj) => {
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;

    obj.experiments.forEach(exp => {
        if (exp.reads) {
            exp.reads.forEach(r => {
                if (r.t < min) {
                    min = r.t;
                }
                if (r.t > max) {
                    max = r.t;
                }
            });
        }
    });

    min -= 1;
    max += 2;

    return {min, max};
}
