ExperimentService
    .getStatistics()
    .then(statistics => {
        document.getElementById('number-of-proteins').innerText = statistics.totalUniqueProteins;
        document.getElementById('number-of-experiments').innerText = statistics.experimentStatistics.length;
    });