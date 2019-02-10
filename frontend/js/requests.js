TemperatureService = {};
TemperatureService.temperatureReadsToProteinsAndExperimentPairs = (pairs) => {
    return fetch(
        `/api/protein/search/exp/`,
        {
            method: `POST`,
            headers: {
                'Content-Type': `application/json; charset=utf-8`
            },
            body: JSON.stringify(pairs)
        }
    )
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for TemperatureService.temperatureReadsToProteinsAndExperimentPairs: `, error, pairs);
            return [];
        });
};
TemperatureService.queryUniprotIdReceiveTemperatureReads = (query) => {
    return fetch(`/api/reads/temperature/search`, {
        headers: {
            'Accept': `application/json`,
            'Content-Type': `application/json`
        },
        method: `POST`,
        body: JSON.stringify(query)
    })
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for TemperatureService.queryUniprotIdReceiveTemperatureReads: `, error, query);
            return [];
        });
};

ExperimentService = {};
ExperimentService.uploadExperiment = (formData) => {
    return fetch( // edge and IE do not support https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams , consider polyfills?
        `/api/experiment`,
        {
            method: `POST`,
            // headers: {'Content-Type': `multipart/form-data`},
            body: formData
        }
    )
        .then(resp => resp.json())
        .catch(err => {
            console.log(err);
        });
};
ExperimentService.getExperiment = (id) => {
    return fetch(`/api/experiment/`+id) // edge and IE do not support https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams , consider polyfills?
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ExperimentService.getExperiment: `, error, id);
            return [];
        });
};
ExperimentService.paginatedExperiments = (queryObj) => {
    return fetch(`/api/experiments?`+$.param(queryObj)) // edge and IE do not support https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams , consider polyfills?
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ExperimentService.paginatedExperiments: `, error, queryObj);
            return [];
        });
};
ExperimentService.updateExperiment = (id, experiment) => {
    return fetch( // edge and IE do not support https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams , consider polyfills?
        `/api/experiment/${id}`,
        {
            method: `POST`,
            headers: {
                'Content-Type': `application/json; charset=utf-8`,
            },
            body: JSON.stringify(experiment)
        }
    )
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ExperimentService.updateExperiment: `, error, id, experiment);
            return [];
        });
};
ExperimentService.experimentsWhichHaveProtein = (uniprotId) => {
    return fetch(`/api/experiments/containing/protein/${uniprotId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ExperimentService.experimentsWhichHaveProtein: `, error, uniprotId);
            return [];
        });
};
ExperimentService.experimentsWhichHaveComplex = (complexId) => {
    return fetch(`/api/experiments/containing/complex/${complexId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ExperimentService.experimentsWhichHaveComplex: `, error, complexId);
            return [];
        });
};
ExperimentService.allProteinsContainedInExperiment = (experimentId) => {
    return fetch(`/api/experiments/proteins/${experimentId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ExperimentService.experimentsWhichHaveProtein: `, error, experimentId);
            return [];
        });
};


ProteinService = {};
ProteinService.getSpecificProtein = (uniprotId, experimendId) => {
    return fetch(`/api/protein/${uniprotId}/experiment/${experimendId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ProteinService.getSpecificProtein: `, error, uniprotId, experimendId);
            return [];
        });
};
ProteinService.getProteinInteractions = (uniprotId, expId) => {
    return fetch(`/api/protein/interactions/${uniprotId}/exp/${expId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ProteinService.getProteinInteractions: `, error, uniprotId);
            return [];
        });
};
ProteinService.getProteinExperimentCombinations = (proteinExperimentArr) => {
    return fetch(
        `/api//protein/experimentcombinations`,
        {
            method: `POST`,
            headers: {
                'Content-Type': `application/json; charset=utf-8`,
            },
            body: JSON.stringify(proteinExperimentArr)
        }
    )
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ProteinService.getProteinInteractions: `, error, proteinExperimentArr);
            return [];
        });
};
ProteinService.getProteinXProteinDistances = (proteinList, experimentList) => {
    return fetch(
        `/api/protein/proteinxproteindistances`,
        {
            method: `POST`,
            headers: {
                'Content-Type': `application/json; charset=utf-8`,
            },
            body: JSON.stringify({proteinList: proteinList, experimentList: experimentList})
        }
    )
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ProteinService.getProteinXProteinDistances: `, error, proteinList, experimentList);
            return [];
        });
};

ComplexService = {};
ComplexService.getComplexById = (id) => {
    return fetch(`/api/complex/${id}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ComplexService.getComplexById: `, error, id);
            return [];
        });
};
ComplexService.getAllComplexesWhichContainProtein = (uniprotId, experimentId) => {
    return fetch(`/api/complex/hasprotein/${uniprotId}/exp/${experimentId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ComplexService.getAllComplexesWhichContainProtein: `, error, uniprotId);
            return [];
        });
};
ComplexService.getAverageDistancesToOtherExperiments = (complexId) => {
    return fetch(`/api/complex/distancetootherexperiments/${complexId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ComplexService.getAverageDistancesToOtherExperiments: `, error, complexId);
            return [];
        });
};
ComplexService.findComplex = (query) => {
    return fetch(
        `/api/complex/find`,
        {
            method: `POST`,
            headers: {
                'Content-Type': `application/json; charset=utf-8`,
            },
            body: JSON.stringify(query)
        }
    )
        .then(resp => resp.json())
        .catch(error => {
            console.error(`Request error for ComplexService.findComplex: `, query, error);
            return [];
        });
};

ExternalService = {};
ExternalService.getUniprotIdsFromText = (text) => {
    const limit = 10;
    const urlEncodedText = encodeURIComponent(text);
    console.log(`urlEncodedText`, urlEncodedText);
    return fetch(
        `https://www.uniprot.org/uniprot/?format=tab&columns=id&limit=${limit}&query=${urlEncodedText}`
    )
        .then(response => response.text())
        // parse the text
        // example:
        //
        // list Entry
        // B8AFK5
        // E1BM58
        // P03367
        // E9PT37
        // Q9BXM0
        // P02812
        // P30460
        .then(textResponse => {
            let ret = [];
            textResponse.split(`\n`).forEach((line, i) => {
                if(i===0) {
                    return;
                }
                if(line.length > 0) {
                    ret.push(line);
                }
            });
            return ret;
        })
        .catch(error => {
            console.error(`Request error for ExternalService.getUniprotIdsFromText: `, error, text);
            return [];
        });
};
