fetch(`/api/experiments/statistics`)
    .then(function(response) {
        return response.json();
    })
    .then(function(statistics) {
        document.getElementById('number-of-proteins').innerText = statistics.totalUniqueProteins;
        document.getElementById('number-of-experiments').innerText = statistics.experimentStatistics.length;
    });