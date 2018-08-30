let localStorageDeleted = StorageManager.get().length === 0;


// grid for experiments which use this protein as well
const expWithProteinGridIdentifier = '#experiments-container .grid';
const expWithProteinGrid = $(expWithProteinGridIdentifier).isotope({
    itemSelector: '.grid-item',
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});
expWithProteinGrid.on('click', '.grid-item', function(){
    const data = $(this).data('grid-item-contents');
    let dot = $(this).children('.selected-curve-dot');
    console.log('data', data.obj.uniprotId, data.experiment.experiment);
    const hasBeenAdded = saveExperimentToLocalStorage(data.obj.uniprotId, data.experiment.experiment);
    if(hasBeenAdded) dot.css({'visibility': dot.css('visibility') === 'hidden' ? 'visible' : 'hidden'});
});

// grid for complexes
const complexesWithProteinGridIdentifier = '#related-complexes-container .grid';
const complexesWithProteinGrid = $(complexesWithProteinGridIdentifier).isotope({
    itemSelector: '.grid-item',
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});
complexesWithProteinGrid.on('click', '.grid-item', function(){
    const data = $(this).data('grid-item-contents');
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    document.location.href = `/complex?id=${data.obj.id}&experiment=${query.experiment}`;
});

// grid for interactions
const interactionsGridIdentifier = '#related-proteins-container .grid';
const interactionsGrid = $(interactionsGridIdentifier).isotope({
    itemSelector: '.grid-item',
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});
interactionsGrid.on('click', '.grid-item', function(){
    const data = $(this).data('grid-item-contents');
    console.log('data', data);
    // document.location.href = `/complex?id=${data.complexId}&experiment=${data.experiment}`;
});

// on page drawing finished, start requests
$(document).ready(() => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    console.log('query', query);
    if(query.protein && query.experiment) {

        // add event, when loading is done
        // Promise.all([

            ProteinService.getSpecificProtein(query.protein, query.experiment)
                .then(proteinData => {
                    console.log('proteinCurveData', proteinData);
                    if(Object.keys(proteinData).length > 0) {
                        drawProtein(proteinData);
                    }
                })
        // ])

        ExperimentService.experimentsWhichHaveProtein(query.protein)
            .then(exps => {
                console.log('exps', exps);
                drawOtherExperiments(exps, query.protein, query.experiment);
                TemperatureService.temperatureReads(exps, [query.protein])
                    .then(reads => {
                        console.log('reads', reads);
                        drawExperimentsWhichHaveProtein(reads, query.experiment);
                    })
            });

        ComplexService.getAllComplexesWhichContainProtein(query.protein, query.experiment)
            .then(complexes => {
                console.log('complexes', complexes);
                drawRelatedComplexes(complexes, query.experiment);
            })

        Promise.all([
                ProteinService.getProteinInteractions(query.protein, query.experiment),
                ExperimentService.allProteinsContainedInExperiment(query.experiment)
            ])
            .then(([proteinInteractions, proteinsContainedInExperiment]) => {
                console.log('proteinInteractions', proteinInteractions);
                console.log('proteinsContainedInExperiment', proteinsContainedInExperiment);
                drawProteinInteractions(proteinInteractions, proteinsContainedInExperiment);
            })

    }
})

/**
 * [drawProteinData description]
 * @param  {experiment: number, uniprotId: string, reads: {r:number, t:number}[] } data [description]
 */
const drawProtein = (data) => {
    drawProteinCurve(data);
    writeProteinMetaData(data);
}

const drawProteinCurve = ({uniprotId, experiment, reads}) => {
    // creating data series for highcharts
    let series = [];
    series.push({
        name: uniprotId+' '+experiment,
        data: reads.map(r => [r.t, r.r]),
        color: HelperFunctions.stringToColor(uniprotId+"-E"+experiment),
        marker: {symbol: 'circle'}
    });

    // configuring and plotting highcharts
    highChartsCurvesConfigObject['title.text'] = 'TPCA melting curve';
    highChartsCurvesConfigObject['yAxis.title.text'] = '% alive';
    highChartsCurvesConfigObject['xAxis.title.text'] = 'Temperature';
    highChartsCurvesConfigObject['series'] = series;
    highChartsCurvesConfigObject['tooltip'] = {
        split: true,
        distance: 30,
        padding: 5
    };
    highChartsCurvesConfigObject['legend'] = {enabled: false};
    Highcharts.chart('protein-curve', highChartsCurvesConfigObject);
}

const writeProteinMetaData = ({
        uniprotId, peptides, psms, p_createdAt, p_updatedAt, experiment, description,
        lysate, e_createdAt, e_updatedAt, uploader
    }) => {
    $('#protein-name').text(uniprotId);
    $('#experiment-number').text('Experiment: '+experiment);

    $('#protein-data .uniprot-id .value')
        .attr({'target':'_blank', 'href':`https://www.uniprot.org/uniprot/${uniprotId}`})
        .text(uniprotId);
    $('#protein-data .peptides .value').text(peptides);
    $('#protein-data .psms .value').text(psms);
    $('#protein-data .created .value').text(HelperFunctions.dateTimeStringPrettify(p_createdAt));
    $('#protein-data .updated .value').text(HelperFunctions.dateTimeStringPrettify(p_updatedAt));

    $('#experiment-data .description .value').text(description);
    $('#experiment-data .lysate .value').text(lysate);
    $('#experiment-data .created .value').text(HelperFunctions.dateTimeStringPrettify(e_createdAt));
    $('#experiment-data .updated .value').text(HelperFunctions.dateTimeStringPrettify(e_updatedAt));
    $('#experiment-data .uploader .value').attr({'href':'https://plus.google.com/'+uploader})
        .text('Google Plus Profile');
}

const drawOtherExperiments = (experiments, uniprotId, actualExperiment) => {
    const dropDownContainer = $('#other-experiments .other-experiments-container .dropdown')
        .addClass(['ui', 'search', 'dropdown']);
    dropDownContainer.dropdown({});
    $('.protein-container .other-experiments-container .dropdown .search')
        .css({'padding': '11 20px'})

    const menuContainer = $('.dropdown .menu');
    const otherExperiments = [];
    experiments.forEach(experiment => {
        if(experiment != actualExperiment) {
            otherExperiments.push(
                $('<a />')
                    .addClass('item')
                    .attr({'data-value':experiment, 'href':`/protein?protein=${uniprotId}&experiment=${experiment}`})
                    .text('Experiment '+experiment)
            )
        }
    });
    menuContainer.append(otherExperiments);
}

/**
 * [drawExperimentsWhichHaveProtein description]
 * @param  {[type]} const [description]
 * @return {[type]}       [description]
 */
const drawExperimentsWhichHaveProtein = (arr, actualExperiment) => {

    const proteinExperimentObject = [];
    let index = 0;
    arr[0].experiments.forEach((experiment, i, a) => {
        proteinExperimentObject.push({
            uniprotId: arr[0].uniprotId,
            experiments: [experiment],
            index: i
        });
    });

    const toAppend = (obj, exp) => {
        return [
            $('<p />')
                .addClass('grid-item-text')
                .css({
                    'position': 'absolute',
                    'text-align': 'center',
                    'width': '100%',
                    'line-height': '35px',
                    'font-size': '1.2rem'
                })
                .text(obj.uniprotId),
            $('<div />')
                .addClass(['experimentNumber', 'grid-item-text'])
                .text(exp.experiment === parseInt(actualExperiment) ?
                    `Experiment ${actualExperiment} (Actual)`:
                    `Experiment ${exp.experiment}`
                ),
            $('<div />')
                .addClass('selected-curve-dot')
        ];
    };

    HelperFunctions.drawItemForEveryExperiment(expWithProteinGridIdentifier, proteinExperimentObject, toAppend);

}

const drawRelatedComplexes = (complexes, actualExperiment) => {

    // split up protein/experiments pairs into protein/experiment(single) pairs
    const proteinExperimentObject = [];
    let index = 0;
    complexes.forEach(complex => {
        const obj = {
            uniprotId: complex.name,
            id: complex.id,
            index: index,
            proteins: [],
            total: 0,
            present: 0
        };
        index++;

        complex.proteins.forEach(protein => {
            if(protein.experiments) {
                protein.experiments.forEach(experiment => {
                    if(obj.experiments) {
                        obj.experiments.push({
                            experiment: protein.uniprotId,
                            uniprotId: protein.uniprotId,
                            reads: experiment.reads
                        })
                    } else {
                        obj.experiments = [{
                            experiment: protein.uniprotId,
                            uniprotId: protein.uniprotId,
                            reads: experiment.reads
                        }];
                    }
                })
                obj.present++;
            }
            obj.total++;
        });
        proteinExperimentObject.push(obj);
    });

    const toAppend = (obj) => {
        return [
            $('<p />')
                .addClass('grid-item-text')
                .css({
                    'position': 'absolute',
                    'text-align': 'center',
                    'width': '100%',
                    'line-height': '35px',
                    'font-size': '1.2rem',
                    'transition-property': 'opacity',
                    'transition-duration': '1s'
                })
                .text(obj.uniprotId),
            $('<div />')
                .addClass(['experimentNumber', 'grid-item-text'])
                .css({
                    'transition-property': 'opacity',
                    'transition-duration': '1s'
                })
                .text(obj.present+'/'+obj.total)
        ];
    };

    HelperFunctions.drawItemsAllExperimentsInOneItem(complexesWithProteinGridIdentifier, proteinExperimentObject, toAppend);

}

const saveExperimentToLocalStorage = (protein, experiment) => {
    let added = true;
    // if the localStorage hasn't been deleted yet and there are some proteins in it
    if(!localStorageDeleted && StorageManager.get().length > 0) {
        added = confirm("There are Proteins still in the local storage. Do you want to overwrite them?");
        if(added) {
            StorageManager.clear();
            console.log('store cleared');
            localStorageDeleted = true;
            console.log('adding', {uniprotId: protein, experiment: experiment});
            StorageManager.toggle({uniprotId: protein, experiment: experiment}, () => {});
        }
    // else just add the protein/experiment pair
    } else {
        console.log('adding', {uniprotId: protein, experiment: experiment});
        StorageManager.toggle({uniprotId: protein, experiment: experiment}, () => {});
    }
    return added;
}

const drawProteinInteractions = (proteinInteractions, proteinsContainedInExperiment) => {
    interactionsGrid.empty();

    const curves = [];
    const items = [];

    // split up protein/experiments pairs into protein/experiment(single) pairs
    const proteinExperimentObject = [];
    let index = 0;
    proteinInteractions.forEach(interaction => {
        const obj = {
            interactor1: interaction.interactor1.uniprotId,
            uniprotId: interaction.interactor2.uniprotId,
            index: index,
            experiments: [],
            total: 2,
            present: 1
        };
        index++;

        if(interaction.interactor1.experiments) {
            obj.experiments.push({
                reads: interaction.interactor1.experiments[0].reads,
                experiment: interaction.interactor1.uniprotId,
                uniprotId: interaction.interactor1.uniprotId
            });
        }

        if(interaction.interactor2.experiments) {
            obj.experiments.push({
                reads: interaction.interactor2.experiments[0].reads,
                experiment: interaction.interactor2.uniprotId,
                uniprotId: interaction.interactor2.uniprotId
            });
            obj.present++;
        }

        proteinExperimentObject.push(obj);
    });

    const toAppend = (obj) => {
        return [
            $('<p />')
                .addClass('grid-item-text')
                .css({
                    'position': 'absolute',
                    'text-align': 'center',
                    'width': '100%',
                    'line-height': '35px',
                    'font-size': '1.2rem',
                    'transition-property': 'opacity',
                    'transition-duration': '1s'
                })
                .text(obj.uniprotId),
            $('<div />')
                .addClass(['experimentNumber', 'grid-item-text'])
                .css({
                    'transition-property': 'opacity',
                    'transition-duration': '1s'
                })
                .text(obj.present+'/'+obj.total)
        ];
    };

    HelperFunctions.drawItemsAllExperimentsInOneItem(interactionsGridIdentifier, proteinExperimentObject, toAppend);
}
