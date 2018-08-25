$(document).ready(() => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    console.log('query', query);
    if(query.id) {
        console.log('id', query.id);
        ComplexService.getComplexById(query.id)
            .then(complex => {
                console.log('complex', complex);
                drawComplexMetadata(complex);
            })
    }
});

const drawComplexMetadata = (complex) => {
    $('#complex-name').text(complex.name);

    const dataContainer = $('#data-container');
    Object.keys(complex).forEach(k => {
        dataContainer.append(
            $('<div />').text(k+' '+complex[k])
        );
    });
}
