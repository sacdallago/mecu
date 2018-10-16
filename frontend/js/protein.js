let localStorageDeleted = StorageManager.getProteins().length === 0;
const modalIdentifier = '#add-protein-modal';
const addProteinModal = ModalService.createAddProteinToLocalStorageModalWithNoYesAddButtons(modalIdentifier);
const selectAllPPIButtonSelector = '#select-all-ppi-button';
const dropDownSelector = '#experiment-number .dropdown';
const AMOUNT_OF_PPI_TO_DRAW = 20;

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
    if(!localStorageDeleted) {
        ModalService.openModalAndDoAction(
            () => {},
            () => {
                StorageManager.clear();
                gridItemToggleDotAll(false);
                StorageManager.toggle(
                    {uniprotId: data.obj.uniprotId, experiment: data.experiment.experiment},
                    () => gridItemToggleDot(this)
                );
                localStorageDeleted = true;
            },
            () => {
                StorageManager.toggle(
                    {uniprotId: data.obj.uniprotId, experiment: data.experiment.experiment},
                    () => gridItemToggleDot(this)
                );
                localStorageDeleted = true;
            }
        );
    } else {
        StorageManager.toggle(
            {uniprotId: data.obj.uniprotId, experiment: data.experiment.experiment},
            () => gridItemToggleDot(this)
        );
    }
});
const gridItemToggleDot = (gridItem, show) => {
    let dot = $(gridItem).children('.dot-div');
    if(show === true) {
        dot.addClass('selected-curve-dot');
    } else if(show === false) {
        dot.removeClass('selected-curve-dot');
    } else {
        dot.toggleClass('selected-curve-dot')
    }
}
const gridItemToggleDotAll = (show) => {
    if(show === true) {
        document.querySelectorAll(expWithProteinGridIdentifier).forEach(item => gridItemToggleDot(item, true))
    } else if(show === false) {
        document.querySelectorAll(expWithProteinGridIdentifier).forEach(item => gridItemToggleDot(item, false))
    } else {
        document.querySelectorAll(expWithProteinGridIdentifier).forEach(item => gridItemToggleDot(item))
    }
}

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
    if(data && data.obj.experiments.length > 0) {
        document.location.href = `/protein?protein=${data.obj.uniprotId}&experiment=${data.obj.experimentId}`;
    }
});


/**
 * [drawProteinData description]
 * @param  {experiment: number, uniprotId: string, reads: {r:number, t:number}[] } data [description]
 */
const drawProtein = (data) => {
    return Promise.all([
        drawProteinCurve(data),
        writeProteinMetaData(data)
    ]);
}

const drawProteinCurve = ({uniprotId, experiment, reads}) => {
    return new Promise((resolve, reject) => {
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
        resolve(true);
    });
}

const writeProteinMetaData = ({
        uniprotId, peptides, psms, p_createdAt, p_updatedAt, experiment, name, description,
        lysate, e_createdAt, e_updatedAt, uploader
    }) => {
    return new Promise((resolve, reject) => {
        $('#protein-data .uniprot-id .value')
        .attr({'target':'_blank', 'href':`https://www.uniprot.org/uniprot/${uniprotId}`})
            .text(uniprotId);
        $('#protein-data .peptides .value').text(peptides);
        $('#protein-data .psms .value').text(psms);
        $('#protein-data .created .value').text(HelperFunctions.dateTimeStringPrettify(p_createdAt));
        $('#protein-data .updated .value').text(HelperFunctions.dateTimeStringPrettify(p_updatedAt));

        $('#experiment-data .name .value').text(name);
        $('#experiment-data .description .value').text(description);
        $('#experiment-data .lysate .value').text(lysate);
        $('#experiment-data .created .value').text(HelperFunctions.dateTimeStringPrettify(e_createdAt));
        $('#experiment-data .updated .value').text(HelperFunctions.dateTimeStringPrettify(e_updatedAt));
        $('#experiment-data .uploader .value').attr({'href':'https://plus.google.com/'+uploader})
            .text('Google Plus Profile');
        resolve(true);
    });
}

const drawOtherExperimentsSelect = (experiments, uniprotId, actualExperiment) => {
    return new Promise((resolve, reject) => {

        const dropDownContainer = $(dropDownSelector).addClass(['ui', 'search', 'dropdown']);
        dropDownContainer.dropdown({});
        $('#experiment-number .dropdown .search').css({'padding': '11 20px'})

        const menuContainer = $('#experiment-number .dropdown .menu');
        const otherExperiments = [];
        experiments.forEach(experiment => {
            if(experiment.experimentId != actualExperiment) {
                otherExperiments.push(
                    $('<a />')
                        .addClass('item')
                        .attr({'data-value':experiment.name, 'href':`/protein?protein=${uniprotId}&experiment=${experiment.experimentId}`})
                        .text(experiment.name)
                )
            } else {
                otherExperiments.push(
                    $('<a />')
                        .addClass('item')
                        .attr({'data-value':'default'})
                        .text(experiment.name)
                )
            }
        });
        menuContainer.append(otherExperiments);

        resolve(true);
    });
}

/**
 * [drawExperimentsWhichHaveProtein description]
 * @param  {[type]} const [description]
 * @return {[type]}       [description]
 */
const drawExperimentsWhichHaveProtein = (arr, actualExperiment) => {
    return new Promise((resolve, reject) => {

        const proteinExperimentObject = [];
        let index = 0;
        arr[0].experiments.forEach((experiment, i, a) => {
            proteinExperimentObject.push({
                uniprotId: arr[0].uniprotId,
                experiments: [experiment],
                index: i
            });
        });

        const alreadyInStorage = StorageManager.getProteins();

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
                    .addClass(
                        'dot-div'+
                        (
                            alreadyInStorage.find(p =>
                                p.uniprotId === obj.uniprotId &&
                                p.experiment.find(e => e === obj.experiments[0].experiment)
                            ) ? ' selected-curve-dot' : ''
                        )
                    )
            ];
        };

        HelperFunctions.drawItemForEveryExperiment(expWithProteinGridIdentifier, proteinExperimentObject, toAppend);

        resolve(true);
    });

}

const drawRelatedComplexes = (complexes, actualExperiment) => {
    return new Promise((resolve, reject) => {
        // split up protein/experiments pairs into protein/experiment(single) pairs
        const proteinExperimentObject = [];
        let index = 0;
        complexes.forEach(complex => {
            const obj = {
                uniprotId: complex.name,
                id: complex.id,
                index: index,
                proteins: [],
                experiments: [],
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
                        'z-index': 100
                    })
                    .text(obj.uniprotId),
                $('<div />')
                    .addClass(['experimentNumber', 'grid-item-text'])
                    .text(obj.present+'/'+obj.total)
            ];
        };

        HelperFunctions.drawItemsAllExperimentsInOneItem(complexesWithProteinGridIdentifier, proteinExperimentObject, toAppend);

        resolve(true);
    });
}

const drawProteinInteractions = (proteinInteractions, proteinsContainedInExperiment, experimentId) => {
    return new Promise((resolve,reject) => {
        interactionsGrid.empty();

        const curves = [];
        const items = [];

        // split up protein/experiments pairs into protein/experiment(single) pairs
        const proteinExperimentObject = [];
        let index = 0;
        proteinInteractions.forEach(interaction => {
            const obj = {
                experimentId: experimentId,
                interactor1: interaction.interactor1.uniprotId,
                uniprotId: interaction.interactor2.uniprotId,
                index: index,
                correlation: interaction.correlation,
                experiments: [],
                total: 2,
                present: 1
            };
            index++;

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
            const ret = [
                $('<p />')
                    .addClass('grid-item-text')
                    .css({
                        'position': 'absolute',
                        'text-align': 'center',
                        'width': '100%',
                        'line-height': '35px',
                        'font-size': '1.2rem'
                    })
                    .text(obj.uniprotId)
            ];

            if(obj.present === 1) {
                ret.push(
                    $('<div />')
                        .addClass(['cube-text-middle', 'grid-item-text'])
                        .text('No data for this experiment')
                )
            }

            ret.push(
                $('<div />')
                    .addClass(['correlation', 'grid-item-text'])
                    .text(obj.correlation)
                );

            return ret;
        };

        HelperFunctions.drawItemsAllExperimentsInOneItem(interactionsGridIdentifier, proteinExperimentObject, toAppend, AMOUNT_OF_PPI_TO_DRAW);


        // add functionality to select all button
        const toAdd = proteinInteractions.map(int => {
                if(int.interactor2 && int.interactor2.experiments) {
                    return ({uniprotId: int.interactor2.uniprotId, experiment: parseInt(experimentId)});
                }
            }).filter(x => !!x);
        document.querySelector(selectAllPPIButtonSelector).addEventListener(
            'click',
            () => {
                ModalService.openModalAndDoAction(
                    () => {},
                    () => {
                        StorageManager.clear();
                        StorageManager.add(
                            toAdd,
                            (c,a) => {
                                document.querySelector(selectAllPPIButtonSelector).classList.add('green');
                                document.querySelector(selectAllPPIButtonSelector).classList.add('disabled');
                                // gridItemToggleDotAll(true);
                            }
                        );
                    },
                    () => {
                        StorageManager.add(
                            toAdd,
                            () => {
                                document.querySelector(selectAllPPIButtonSelector).classList.add('green');
                                document.querySelector(selectAllPPIButtonSelector).classList.add('disabled');
                                // gridItemToggleDotAll(true);
                            }
                        );
                    }
                )
            }
        );

        resolve(true);
    });
}


// on page drawing finished, start requests
$(document).ready(() => {
    let loading = true;
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    console.log('query', query);
    if(query.protein && query.experiment) {

        // data for protein curve and meta data
        const proteinCurveAndMetaData = ProteinService.getSpecificProtein(query.protein, query.experiment)
            .then(proteinData => {
                console.log('proteinCurveData', proteinData);
                if(Object.keys(proteinData).length > 0) {
                    return drawProtein(proteinData);
                } else {
                    return Promise.resolve(true);
                }
            });

            // list of experiments which have this protein
        const otherExperimentsAndSelect = ExperimentService.experimentsWhichHaveProtein(query.protein)
            .then(exps => {
                console.log('exps', exps);
                return Promise.all([
                    // list of experiments, which ahve this protein, but not the actual experiment
                    drawOtherExperimentsSelect(exps, query.protein, query.experiment),
                    TemperatureService.temperatureReadsToProteinsAndExperimentPairs(
                            exps.map(exp =>
                                ({
                                    uniprotId: query.protein,
                                    experiment: exp.experimentId
                                })
                            )
                        )
                        .then(reads => {
                            console.log('reads', reads);
                            // protein curves of other experiments
                            return drawExperimentsWhichHaveProtein(reads, query.experiment);
                        })
                ]);
            });

            // list of complexes which have this protein
        const complexes = ComplexService.getAllComplexesWhichContainProtein(query.protein, query.experiment)
            .then(complexes => {
                console.log('complexes', complexes);
                return drawRelatedComplexes(complexes, query.experiment);
            });

            // list of protein interactions, which have this protein
        const ppi = Promise.all([
                ProteinService.getProteinInteractions(query.protein, query.experiment),
                ExperimentService.allProteinsContainedInExperiment(query.experiment)
            ])
            .then(([proteinInteractions, proteinsContainedInExperiment]) => {
                console.log('proteinInteractions', proteinInteractions);
                console.log('proteinsContainedInExperiment', proteinsContainedInExperiment);
                return drawProteinInteractions(proteinInteractions, proteinsContainedInExperiment, query.experiment);
            });

        proteinCurveAndMetaData
            .then(() => console.log('proteinCurveAndMetaData'))
            .then(() => otherExperimentsAndSelect)
            .then(() => console.log('otherExperimentsAndSelect'))
            .then(() => complexes)
            .then(() => console.log('complexes'))
            .then(() => ppi)
            .then(() => console.log('ppi'))
            .then(() => {
                loading = false;
                $(dropDownSelector).dropdown({
                    match: 'both',
                    fullTextSearch: true,
                    glyphWidth: 3.0
                });
                console.log('done');
            })
            .catch(error => {
                loading = false;
                console.error('loading error', error);
            });

    }
})
