const uniprotAccessionRegex = /[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/g;
const matchCount = $('.stats > span > strong');
const statsTable = $('pre.statistics');

let selectedExperiments = new Set();
let selectedProteins = new Set();
let localStorageDeleted = StorageManager.get().length === 0;

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

    experiments = experiments.sort();
    proteins = proteins.sort();

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
            experiments.forEach(d => header.push(d));
            header.forEach(d => $('#result-table thead tr').append('<th>'+d+'</th>'));

            let tableData = [];
            let totalRow = {
                name: 'Total',
                values: new Array(experiments.length).fill(0),
                rating: new Array(experiments.length).fill(0)
            };
            proteins.forEach(p => tableData.push({name: p, values: new Array(experiments.length).fill(0)}));

            data.forEach((d, i, a) => {
                let tableProt = tableData.find(td => td.name === d.uniprotId);


                d.experiments.forEach(e => {
                    let idx = experiments.indexOf(e.experiment);
                    tableProt.values[idx] = 1;
                    totalRow.values[idx] += 1;
                })
            })

            // console.log('tableData', tableData);

            tableData.forEach(tr => {
                let row = '<tr class="toggle-protein" id='+tr.name+'><td>'+tr.name+'</td>';
                tr.values.forEach(v => {
                    row+=('<td>'+v+'</td>');
                });
                row+='</tr>';
                $('#result-table tbody').append(row);
            })

            let summaryRow = '<tr><td>Total</td>';
            totalRow.values.forEach((v,i,a) => {
                totalRow.rating[i] = v/proteins.length;
                summaryRow += '<td>'+v+'/'+proteins.length
                // +' ('+(totalRow.rating[i]*100).toFixed(2)+'%)' // can be omitted
                +'</td>';
            });
            summaryRow += '</tr>';
            $('#result-table tbody').append(summaryRow);

        })
        .catch(error => console.error(error))
};

$('body').on('click', 'tr[class=toggle-protein]', function() {

    console.log(this, $(this).attr('id'));

    let self = this;
    const toggleProtein = function(inStorage, added, removed) {
        if(added === 0){
            $(self).removeClass('inStore');
        } else if(removed === 0) {
            $(self).addClass('inStore');
        } else {
            if ($(self).hasClass('inStore')){
                $(self).removeClass('inStore');
            }
        }
    };

    console.log('Storage', StorageManager.get());

    // if the localStorage hasn't been deleted yet and there are some proteins in it
    if(!localStorageDeleted && StorageManager.get().length > 0) {
        if(confirm("There are Proteins still in the local storage. Do you want to overwrite them?")) {
            StorageManager.clear();
            console.log('store cleared');
            localStorageDeleted = true;
            selectedExperiments.forEach(v => {
                let tmp = {uniprotId:$(this).attr('id'), experiment:v};
                console.log('tmp', tmp);
                StorageManager.toggle(tmp, toggleProtein);
            });
        }
    } else {
        console.log('protein toggle', {uniprotId:$(this).attr('id'), experiment:[0]});
        selectedExperiments.forEach(v => {
            StorageManager.toggle({uniprotId:$(this).attr('id'), experiment:v}, toggleProtein);
        });
    }
    console.log('localStorage', StorageManager.get(), StorageManager.get().length);
    console.log('selectedProteins', selectedProteins);
});
