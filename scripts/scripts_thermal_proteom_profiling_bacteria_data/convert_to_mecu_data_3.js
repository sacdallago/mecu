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
    const resultHeader = "Accession	Description	GeneName	Peptides	PSMs	AAs	MW.kDA	pI	QuantifyingPSMs	T37	T40	T47	T53	T63	T69	T75	T81\n";
    const resultHeaderFieldTypes = [0, 0, 0,  1,  0, 0, 0, 0, 0,  1, 1, 1, 1, 1,  1, 1, 1, 1, 1]

    // load file as string
    const content = readFile(filePath);

    // split into lines
    let lines = content.split('\n');

    // header line
    const headerLine = lines[0].split(',');
    lines.splice(0, 1);

    const experimentHeaderArray = [
        "Uniprot_id", "description", "gene_name", undefined,
        "norm_signal_sum_NP40_rep1_126",
        "norm_signal_sum_NP40_rep2_127L",
        "norm_signal_sum_NP40_rep3_127H",
        "norm_signal_sum_NP40_rep4_128L",
        "norm_signal_sum_SDS_rep1_129L",
        "norm_signal_sum_SDS_rep2_129H",
        "norm_signal_sum_SDS_rep3_130L",
        "norm_signal_sum_SDS_rep4_130H"
    ];

    const experimentHeaders = indizesOfDataToExtract(headerLine, experimentHeaderArray);
    console.log('asdf', experimentHeaders);


    let resultString = resultHeader;

    // iterate over all the lines
    for(let lineIndex=0; lineIndex<lines.length; lineIndex++) {

        // line currently working on
        const line = lines[lineIndex].split(',');

        let lineString = "";

        // for each line, extract experiment data
        experimentHeaders.forEach((index, idx) => {

            let tmpInsertStr = line[index];
            if (tmpInsertStr == undefined) {
                tmpInsertStr = resultHeaderFieldTypes[index] == 0 ? "" : 0;
            }
            lineString +=  tmpInsertStr;
            if(idx != experimentHeaders.length-1) {
                lineString += "\t";
            }
        });

        resultString += (lineString + "\n");
    }

    const parsed = mecuUtils.parse(resultString);
    console.debug(`test experiment`, parsed);

    fs.writeFileSync(`scripts/scripts_thermal_proteom_profiling_bacteria_data/experiment_3.txt`, resultString, {flag: `w`}, function (err) {
        if (err) {
            console.log(`appending error`, err);
        }
    });
}


const argv = process.argv;
if(argv.length >= 3) {
    start(process.argv[2]);
} else {
    console.error(`e.g.: node scripts/scripts_thermal_proteom_profiling_bacteria_data/convert_to_mecu_data_3.js private/experiment_data/thermal_proteom_profiling_in_bacteria_data/inline-supplementary-material-3.csv`);
}

// Accession	Description	GeneName	Peptides	PSMs	AAs	MW.kDA	pI	QuantifyingPSMs	T37	T40	T43	T46	T49	T52	T55	T58	T61	T64
