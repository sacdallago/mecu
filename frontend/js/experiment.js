$(document).ready(() => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    console.log('query', query);
    if(query.id) {
        ExperimentService.getExperiment(query.id)
            .then(r => console.log('data', r));
    }
})
