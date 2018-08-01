TemperatureService = {};

TemperatureService.temperatureReadsToProteinsAndExperimentPairs = (pairs) => {
    return fetch(
            '/api/proteins/search/exp/',
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
