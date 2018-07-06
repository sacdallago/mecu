TemperatureService = {};

TemperatureService.temperatureReadsToProteinsAndExperimentPairs = (pairs) => {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/api/proteins/search/exp/',
            type: 'POST',
            data: JSON.stringify(pairs),
            dataType: 'json',
            contentType: "application/json; charset=utf-8"
        })
        .done(data => resolve(data)) // the way jquery 1.11 does it
        .fail(error => reject(error));
    });
}
