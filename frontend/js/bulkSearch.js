let selectedExperiments = new Set();
let selectedProteins = new Set();
let uniprotAccessionRegex = /[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/g;
const matchCount = $('.stats > span > strong')


$('.ui.checkbox')
    .checkbox({
        onChecked: function() {
            let experimentId = $(this).data('id');
            selectedExperiments.add(experimentId);

            fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins));
        },
        onUnchecked: function() {
            let experimentId = $(this).data('id');
            selectedExperiments.delete(experimentId);

            fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins));

        },
    });

$('textarea.inline.prompt.maxWidth.textarea')
    .keyup(function(){
        let matches = $(this).val().match(uniprotAccessionRegex);

        selectedProteins = new Set(matches);
        matchCount.text(selectedProteins.size);

        fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins));
    });

let fetchMeltingCurves = function(experiments, proteins){
    if(experiments.length < 1 || proteins.length < 1){
        return;
    }

    fetch("/api/reads/temperature", {
        method: 'POST',
        body: JSON.stringify({
            experiments: experiments,
            proteins: proteins
        })
    })
        .then(data => console.log(data))
        .catch(error => console.error(error))
};