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
            console.error('Request error for temperatureReadsToProteinsAndExperimentPairs: ', error, pairs);
            return [];
        });
}
TemperatureService.temperatureReads = (experiments, proteins) => {
    return fetch("/api/reads/temperature", {
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
            console.error('Request error for temperatureReads: ', error, experiments, proteins);
            return [];
        })
}

ExperimentService = {};
ExperimentService.paginatedExperiments = (queryObj) => {
    return fetch('/api/experiments?'+$.param(queryObj)) // edge and IE do not support https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams , consider polyfills?
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for paginatedExperiments: ', error, queryObj);
            return [];
        });
}
ExperimentService.experimentsWhichHaveProtein = (uniprotId) => {
    return fetch(`/api/experiments/${uniprotId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for experimentsWhichHaveProtein: ', error, queryObj);
            return [];
        });
}

ProteinService = {};
ProteinService.getSpecificProtein = (uniprotId, experimendId) => {
    return fetch(`/api/protein/${uniprotId}/experiment/${experimendId}`)
        .then(resp => resp.json())
        .catch(error => {
            console.error('Request error for getSpecificProtein: ', error, uniprotId, experimendId);
            return [];
        });
}

ComplexService = {};
ComplexService.getComplexById = (id) => {
    return fetch(`/api/complex/${id}`)
    .then(resp => resp.json())
    .catch(error => {
        console.error('Request error for getComplexById: ', error, uniprotId, experimendId);
        return [];
    });
}
ComplexService.getAllComplexesWhichContainProtein = (uniprotId) => {
    return fetch(`/api/complex/hasprotein/${uniprotId}`)
    .then(resp => resp.json())
    .catch(error => {
        console.error('Request error for getAllComplexesWhichContainProtein: ', error, uniprotId, experimendId);
        return [];
    });
}
