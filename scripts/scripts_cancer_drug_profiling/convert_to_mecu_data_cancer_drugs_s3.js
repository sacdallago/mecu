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

const createMap = (mappingString) => {
    const lines = mappingString.split("\n");
    lines.splice(0, 1);
    const retObj = {};
    lines.forEach(l => {
        const lineArr = l.split(',');
        retObj[lineArr[0]] = lineArr[1];
    });
    return retObj;
}


const start = function(filePath, mappingFilePath) {

    // result header data
    const resultHeader = "Accession	Description	GeneName	Peptides	PSMs	AAs	MW.kDA	pI	QuantifyingPSMs	T25	T41	T44	T47	T50	T53	T56	T59	T63	T67\n";
    const resultHeaderFieldTypes = [0, 0, 0,  1,  0, 0, 0, 0, 0,  1, 1, 1, 1, 1,  1, 1, 1, 1, 1]

    // load file as string
    const content = readFile(filePath);

    const mapping = createMap(readFile(mappingFilePath));

    // split into lines
    let lines = content.split('\n');

    // header line
    const headerLine = lines[0].split(',');
    lines.splice(0, 1);

    // the base array all experiments will use
    const array = ["IPI acc. no.", undefined, undefined, "undefined", undefined, undefined, undefined, undefined, undefined];
    const upm = ["upm_Vehicle_1", "upm_Vehicle_2", "upm_ATP_1", "upm_ATP_2"];
    // construct temperature strings, which should be extracted
    // Vehicle_1_25C_norm
    // ATP_1_25C_norm
    // Vehicle_2_25C_norm
    // ATP_2_25C_norm
    const tempStrConstructor = (z1, z2) => `Vehicle_${z2}_${z1}_norm`;
    const tempStrConstructor2 = (z1, z2) => `ATP_${z2}_${z1}_norm`;
    const fcs = ["25C", "41C", "44C", "47C", "50C", "53C", "56C", "59C", "63C", "67C"];
    let experimentHeaderArray = createExperimentHeaderArrays(array, tempStrConstructor, [1,2], fcs);
    experimentHeaderArray = experimentHeaderArray
        .concat(createExperimentHeaderArrays(array, tempStrConstructor2, [1,2], fcs));

    console.log('experimentHeaderArray', experimentHeaderArray);

    const experimentHeaders = []
    for(let i=0; i<experimentHeaderArray.length; i++) {
        experimentHeaderArray[i][3] = upm[i];
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
            let skipThisLine = false;
            for(const [idx, index] of experimentHeaderIndizes.entries()) {
                let tmpInsertStr = line[index]
                console.log(idx, tmpInsertStr);
                if (tmpInsertStr == undefined || tmpInsertStr.length == 0) {
                    if (idx >= 9) {
                        skipThisLine = true;
                        break;
                    }
                    tmpInsertStr = resultHeaderFieldTypes[index] == 0 ? "" : 0;
                }
                if (idx == 0) {
                    const newUniProtId = mapping[tmpInsertStr.split('.')[0]];
                    if (newUniProtId == undefined) {
                        skipThisLine = true;
                        break;
                    }
                    lineString += newUniProtId;
                } else {
                    lineString += tmpInsertStr;
                }
                if(idx != experimentHeaderIndizes.length-1) {
                    lineString += "\t";
                }
            };

            if (skipThisLine != true) {
                experimentResultStrings[experimentIndex] += (lineString + "\n");
            }

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
        fs.writeFileSync(`experiment-data/cancer_drugs/experiment_3_`+i+'.txt', str, {flag: `w`}, function (err) {
            if (err) {
                console.log(`appending error`, err);
            }
        });
    });
}


const argv = process.argv;
if(argv.length >= 3) {
    start(process.argv[2], process.argv[3]);
} else {
    console.error(`e.g.: node scripts/scripts_cancer_drug_profiling/convert_to_mecu_data_cancer_drugs_s3.js private/experiment_data/cancer_drugs/Table_S3_Thermal_Profiling_ATP_cell_extract.csv private/experiment_data/cancer_drugs/ipi_uniprot_mapping.csv`);
}

// Accession	Description	GeneName	Peptides	PSMs	AAs	MW.kDA	pI	QuantifyingPSMs	T37	T40	T43	T46	T49	T52	T55	T58	T61	T64
