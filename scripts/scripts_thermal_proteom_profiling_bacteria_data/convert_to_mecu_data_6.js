const fs = require(`fs`);
const mecuUtils = require(`mecu-utils`);

const readFile = (filePath) => {
    let content = "";
    try {
        content = fs.readFileSync(filePath)+"";
    } catch(e) {
        console.error(`problem loading/parsing file `, filePath, e);
        return;
    }
    return content;
}

const createExperimentHeaderArrays = (baseArray, temperatureStringConstructor, experimentIdArray, temperatureArray) => {
    const experimentHeaderArray = [];
    for(let exp=0; exp<experimentIdArray.length; exp++) {
        const newArray = baseArray.slice(0);
        for(let fcInd=0; fcInd<temperatureArray.length; fcInd++) {
            newArray.push(temperatureStringConstructor(temperatureArray[fcInd], experimentIdArray[exp]));
        }
        experimentHeaderArray.push(newArray);
    }
    return experimentHeaderArray;
}

const indizesOfDataToExtract = (dataHeader, experimentHeader) => {
    const returnArray = new Array(experimentHeader.length).fill(-1);
    for(let i=0; i<dataHeader.length; i++) {
        for(let j=0; j<experimentHeader.length; j++) {
            if(dataHeader[i] == experimentHeader[j]) {
                returnArray[j] = i;
            }
        }
    }
    return returnArray;
}


const start = function(filePath) {

    // result header data
    const resultHeader = "Accession	Description	GeneName	Peptides	PSMs	AAs	MW.kDA	pI	QuantifyingPSMs	T37	T40	T44	T47	T50	T53	T57	T59	T63	T66\n";
    const resultHeaderFieldTypes = [0, 0, 0,  1,  0, 0, 0, 0, 0,  1, 1, 1, 1, 1,  1, 1, 1, 1, 1]

    // load file as string
    const content = readFile(filePath);

    // split into lines
    let lines = content.split('\n');

    // header line
    const headerLine = lines[0].split(',');
    lines.splice(0, 1);

    // the base array all experiments will use
    const array = ["Uniprot_ID", "description", undefined, undefined, undefined, undefined, undefined, undefined, undefined];
    // construct temperature strings, which should be extracted
    // norm_rel_fc_126_HepG2_1
    // norm_rel_fc_126_HepG2_2
    const tempStrConstructor = (z1, z2) => `norm_rel_fc_${z1}_HepG2_${z2}`;
    const fcs = ["126", "127L", "127H", "128L", "128H", "129L", "129L", "130L", "130H", "131L"];
    let experimentHeaderArray = createExperimentHeaderArrays(array, tempStrConstructor, [1,2], fcs);

    const experimentHeaders = []
    for(let i=0; i<experimentHeaderArray.length; i++) {
        experimentHeaders.push(indizesOfDataToExtract(headerLine, experimentHeaderArray[i]));
    }


    const experimentResultStrings = new Array(experimentHeaders.length)
        .fill(resultHeader);

    // iterate over all the lines
    for(let lineIndex=0; lineIndex<lines.length; lineIndex++) {

        // line currently working on
        const line = lines[lineIndex].split(',');

        // for each line, extract experiment data
        experimentHeaders.forEach((experimentHeaderIndizes, experimentIndex) => {

            let lineString = "";
            experimentHeaderIndizes.forEach((index, idx) => {
                let tmpInsertStr = line[index];
                if (tmpInsertStr == undefined) {
                    tmpInsertStr = resultHeaderFieldTypes[index] == 0 ? "" : 0;
                }
                lineString +=  tmpInsertStr;
                if(idx != experimentHeaderIndizes.length-1) {
                    lineString += "\t";
                }
            });

            experimentResultStrings[experimentIndex] += (lineString + "\n");

        });
    }

    console.log(experimentResultStrings[0].split('\n')[0]);


    // tests
    experimentResultStrings.forEach((str, i) => {
        // console.log(str);
        const parsed = mecuUtils.parse(str);
        console.debug(`Test Experiment ${i}: `, parsed[0]);
    });

    // write to files
    experimentResultStrings.forEach((str, i) => {
        fs.writeFileSync(`scripts/scripts_thermal_proteom_profiling_bacteria_data/experiment_6_`+i+'.txt', str, {flag: `w`}, function (err) {
            if (err) {
                console.log(`appending error`, err);
            }
        });
    });
}


const argv = process.argv;
if(argv.length >= 3) {
    start(process.argv[2]);
} else {
    console.error(`e.g.: node scripts/convert_to_mecu_data.js private/experiment_data/thermal_proteom_profiling_in_bacteria_data`);
}

// Accession	Description	GeneName	Peptides	PSMs	AAs	MW.kDA	pI	QuantifyingPSMs	T37	T40	T43	T46	T49	T52	T55	T58	T61	T64
