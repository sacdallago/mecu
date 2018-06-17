let selectedExperiments = new Set();
let selectedProteins = new Set();
const uniprotAccessionRegex = /[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/g;
const matchCount = $('.stats > span > strong');
const statsTable = $('pre.statistics');

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
        .then(data => {
            let statistics = "";
            statistics += "UniprotId\t" + experiments.sort().join(" ") + "\n";
            proteins.forEach(p => {
                let e = data.find(protein => protein.uniprotId === p);

                if(e){
                    statistics += p + "\t\t"  +
                    experiments.sort().map(exp => e.experiments.map(redu => redu.experiment).indexOf(exp) !== -1 ? "X" : "-").join(" ") + "\n";
                } else {
                    statistics += p + "\t\t"  + experiments.sort().map(_ => "-").join(" ") + "\n";
                }

            });
            statsTable.text(statistics);

            // empty table and table head on change of input data
            $('#result-table tbody').empty();
            $('#result-table thead tr th:not(:first-child)').remove();


            let header = [];
            data.forEach(d => header.push(d.uniprotId));
            header.forEach(d => $('#result-table thead tr').append('<th>'+d+'</th>'));

            let tableData = [];
            experiments.forEach(e => tableData.push({name: e, values: new Array(proteins.length).fill('no')}));

            data.forEach(d => {
                d.experiments.forEach(e => {
                    tableData.find(d => d.name === e.experiment).values[header.indexOf(d.uniprotId)] = 'yes';
                })
            })

            tableData.forEach(tr => {
                let row = '<tr><td>'+tr.name+'</td>';
                tr.values.forEach(v => row+=('<td>'+v+'</td>'));
                row+='</tr>';
                $('#result-table tbody').append(row);
            })

        })
        .catch(error => console.error(error))
};
