TemperatureService = {};
TemperatureService.temperatureReadsToProteinsAndExperimentPairs = (pairs) => {
    return fetch(
            '/api/protein/search/exp/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(pairs)
            }
        )
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for TemperatureService.temperatureReadsToProteinsAndExperimentPairs: ', error, pairs);
            return [];
        });
}
TemperatureService.temperatureReads = (experiments, proteins) => {
    return fetch('/api/reads/temperature', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
                experiments: experiments,
                proteins: proteins
            })
        })
        .then(res => res.json())
        .catch(error => {
            console.error('Request error for TemperatureService.temperatureReads: ', error, experiments, proteins);
            return [];
        })
}
TemperatureService.queryUniprotIdReceiveTemperatureReads = (query) => {
    return fetch('/api/reads/temperature/search', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(query)
        })
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for TemperatureService.queryUniprotIdReceiveTemperatureReads: ', error, query);
            return [];
        });
}

ExperimentService = {};
ExperimentService.paginatedExperiments = (queryObj) => {
    return fetch('/api/experiments?'+$.param(queryObj)) // edge and IE do not support https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams , consider polyfills?
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for ExperimentService.paginatedExperiments: ', error, queryObj);
            return [];
        });
}
ExperimentService.experimentsWhichHaveProtein = (uniprotId) => {
    return fetch(`/api/experiments/containing/${uniprotId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for ExperimentService.experimentsWhichHaveProtein: ', error, uniprotId);
            return [];
        });
}
ExperimentService.allProteinsContainedInExperiment = (experimentId) => {
    return fetch(`/api/experiments/proteins/${experimentId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for ExperimentService.experimentsWhichHaveProtein: ', error, experimentId);
            return [];
        });
}


ProteinService = {};
ProteinService.getSpecificProtein = (uniprotId, experimendId) => {
    return fetch(`/api/protein/${uniprotId}/experiment/${experimendId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for ProteinService.getSpecificProtein: ', error, uniprotId, experimendId);
            return [];
        });
}
ProteinService.getProteinInteractions = (uniprotId, expId) => {
    return fetch(`/api/protein/interactions/${uniprotId}/exp/${expId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for ProteinService.getProteinInteractions: ', error, uniprotId);
            return [];
        });
}

ComplexService = {};
ComplexService.getComplexById = (id) => {
    return fetch(`/api/complex/${id}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for ComplexService.getComplexById: ', error, id);
            return [];
        });
}
ComplexService.getAllComplexesWhichContainProtein = (uniprotId, experimentId) => {
    return fetch(`/api/complex/hasprotein/${uniprotId}/exp/${experimentId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for ComplexService.getAllComplexesWhichContainProtein: ', error, uniprotId);
            return [];
        });
}

ExternalService = {};
ExternalService.getUniprotIdsFromText = (text) => {
    const urlEncodedText = encodeURIComponent(text);
    console.log('urlEncodedText', urlEncodedText);
    return fetch(
            `https://www.uniprot.org/uniprot/?format=tab&columns=id&limit=7&query=${urlEncodedText}`
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
            textResponse.split('\n').forEach((line, i, a) => {
                if(i===0) {
                    return;
                }
                if(line.length > 0) {
                    ret.push(line);
                }
            })
            return ret;
        })
        .catch(error => {
            console.error('Request error for ExternalService.getUniprotIdsFromText: ', error, text);
            return [];
        });
}
