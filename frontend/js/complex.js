let showModal = !(StorageManager.getProteins().length === 0);
const dropDownSelector = '#experiment-number .dropdown';

const modalIdentifier = '#add-protein-modal';
const addProteinModal = ModalService.createAddProteinToLocalStorageModalWithNoYesAddButtons(modalIdentifier);
const selectAllButtonSelector = '#select-all-button';

// grid proteins from the complex
const proteinCurvesGridIdentifier = '#curves-grid .grid';
const gridItemIdentifier = '.grid-item';
const proteinCurvesGrid = $(proteinCurvesGridIdentifier).isotope({
    itemSelector: gridItemIdentifier,
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});
proteinCurvesGrid.on('click', gridItemIdentifier, function(){
    const data = $(this).data('grid-item-contents');

    // disable selection of proteins without curves
    if(data.obj.present > 1) {
        if(showModal && !gridItemHasDot(this)) {
            ModalService.openModalAndDoAction(
                () => {},
                () => {
                    StorageManager.clear();
                    gridItemToggleDotAll(false);
                    StorageManager.toggle(
                        {uniprotId: data.obj.id, experiment: data.obj.experiments[0].experiment},
                        () => gridItemToggleDot(this)
                    );
                },
                () => {
                    StorageManager.toggle(
                        {uniprotId: data.obj.id, experiment: data.obj.experiments[0].experiment},
                        () => gridItemToggleDot(this)
                    );
                }
            );
        } else {
            showModal = true;
            StorageManager.toggle(
                {uniprotId: data.obj.id, experiment: data.obj.experiments[0].experiment},
                () => gridItemToggleDot(this)
            );
        }
    }

});

const drawComplexMetadata = (complex, avgDistances, experimentId) => {
    return new Promise((resolve, reject) => {

        const dataContainer = $('.column-right');

        const itemContainer = $('<div />').addClass('item-container');
        const text = $('<div />').addClass('text');
        const value = $('<div />').addClass('value');
        const list = $('<div />').addClass('list');
        const listItem = $('<div />').addClass('list-item');

        // protein + names list
        const proteinAndNamesList = $('<div />').addClass('id-and-names-list-container');
        if(complex.proteins && complex.proteins.length > 0) {
            const proteinAndNamesItem = $('<div />').addClass('id-and-names-list-item');
            const pANId = $('<div />').addClass('id-and-names-id');
            const pANText = $('<div />').addClass('id-and-names-text');
            proteinAndNamesList.append(
                proteinAndNamesItem.clone().append([
                    pANId.clone().text('UniprotId'),
                    pANText.clone().text('Name')
                ])
            );
            complex.proteins.forEach((p,i,a) => {
                proteinAndNamesList.append(
                    $('<a />').attr({'target':'_blank', 'href':`https://www.uniprot.org/uniprot/${p}`}).append(
                        proteinAndNamesItem.clone().append([
                            pANId.clone().text(p),
                            pANText.clone().text(
                                complex.proteinNames.length > i ? complex.proteinNames[i] : '-'
                            )
                        ])
                    )
                )
            });
        }

        // gene + names list
        const geneAndNamesList = $('<div />').addClass('id-and-names-list-container');
        if(complex.geneNames && complex.geneNames.length > 0) {
            const geneAndNamesItem = $('<div />').addClass('id-and-names-list-item');
            const gANId = $('<div />').addClass('id-and-names-id');
            const gANText = $('<div />').addClass('id-and-names-text');
            geneAndNamesList.append(
                geneAndNamesItem.clone().append([
                    gANId.clone().text('Name'),
                    gANText.clone().text('Synonym')
                ])
            );
            complex.geneNames.forEach((p,i,a) => {
                geneAndNamesList.append(
                    geneAndNamesItem.clone().append([
                        gANId.clone().text(p),
                        gANText.clone().text(
                            complex.geneNamesynonyms.length > i ? complex.geneNamesynonyms[i] : '-'
                        )
                    ])
                )
            });
        }

        // swissprotOrganism
        const swissprotOrganismList = list.clone().addClass('swissprot-organism-list');
        complex.swissprotOrganism.forEach(p => swissprotOrganismList.append(listItem.clone().text(p)));

        dataContainer.append([
            itemContainer.clone().append([
                text.clone().text('Name'),
                value.clone().text(complex.name)
            ]),
            itemContainer.clone().attr({'id':'ranking-field'}).append([
                text.clone().text('Ranking'),
                value.clone()
            ]),
            itemContainer.clone().append([
                text.clone().text('Purification Method'),
                value.clone().text(complex.purificationMethod)
            ]),
            itemContainer.clone().append([
                text.clone().text('Comment'),
                value.clone().text(complex.comment || '-')
            ]),
            itemContainer.clone().append([
                text.clone().text('Cell line'),
                value.clone().text(complex.cellLine || '-')
            ]),
            itemContainer.clone().append([
                text.clone().text('Organism'),
                value.clone().text(complex.organism || '-')
            ]),
            itemContainer.clone().append([
                text.clone().text('Synonyms'),
                value.clone().text(complex.synonyms || '-')
            ]),
            itemContainer.clone().append([
                text.clone().text('Disease comment'),
                value.clone().text(complex.diseaseComment || '-')
            ]),
            itemContainer.clone().append([
                text.clone().text('Proteins'),
                value.clone().append(proteinAndNamesList)
            ]),
            itemContainer.clone().append([
                text.clone().text('Gene'),
                value.clone().append(geneAndNamesList)
            ]),
            itemContainer.clone().append([
                text.clone().text('GO description'),
                value.clone().append(complex.goDescription)
            ]),
            itemContainer.clone().append([
                text.clone().text('Swissprot Organism'),
                value.clone().append(swissprotOrganismList)
            ]),
            itemContainer.clone().append([
                text.clone().text('Funcat Description'),
                value.clone().append(complex.funCatDescription)
            ]),
        ]);

        // dataContainer.append(
        //     $('<div />').text(`TODO LEFT OUT:
        //         goId GO:0006260,GO:0006281,GO:0005634\n
        //         entrezIds 5111,4436,2956\n
        //         subunitsComment null\n
        //         pubMedId 16303135\n
        //         funCatId 10.01.03,10.01.05.01,70.10\n
        //         createdAt 2018-08-24T17:04:04.840Z\n
        //         updatedAt 2018-08-24T17:04:04.840Z\n
        //         `)
        // );
        resolve(true);
    });
}

const drawRanking = (avgDistances, tempReadsLength, experimentId) => {
    // complex data ranking
    let avgDistanceRanking = tempReadsLength < 2 ? 'not enough data to calculate' : 'not yet calculated';
    let tooltip = `<div class="tooltip-content"><div class="t-line"><div class="t-left">Experiment</div><div class="t-right">Distance</div></div>`;
    avgDistances.forEach((v,i) => {
        if(v.experiment === parseInt(experimentId)) {
            avgDistanceRanking = i+1;
            tooltip+= `<div class="t-line" style="font-weight:bold;"><div class="t-left">${v.name}</div><div class="t-right">${v.avg.toFixed(2)}</div></div>`;
        } else {
            tooltip+= `<div class="t-line"><div class="t-left">${v.name}</div><div class="t-right">${v.avg.toFixed(2)}</div></div>`;
        };

    });
    tooltip+=`</div><div class="ranking-info-text">Distance of all the proteins within a complex for each experiment.</div>`;

    $('#ranking-field').attr({'id':'ranking-tooltip', 'data-html':tooltip});
    $('#ranking-tooltip .value').text(avgDistanceRanking);

    $('#ranking-tooltip').popup({position: 'bottom right'});
}

const drawOtherExperimentsSelect = (experiments, complexId, actualExperiment) => {
    return new Promise((resolve, reject) => {

        const dropDownContainer = $(dropDownSelector).addClass(['ui', 'search', 'dropdown']);
        dropDownContainer.dropdown({});
        $('#experiment-number .dropdown .search').css({'padding': '11 20px'})

        const menuContainer = $('#experiment-number .dropdown .menu');
        const otherExperiments = [];
        experiments.forEach(experiment => {
            if(experiment.id != actualExperiment) {
                otherExperiments.push(
                    $('<a />')
                        .addClass('item')
                        .attr({'data-value':experiment.name, 'href':`/complex?id=${complexId}&experiment=${experiment.id}`})
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


const drawCombinedProteinCurves = (proteins) => {
    return new Promise((resolve, reject) => {
        // creating data series for highcharts
        let series = [];
        proteins.forEach(protein => {
            protein.experiments.forEach(experiment => {
                series.push({
                    name: protein.uniprotId+' '+experiment.experiment,
                    data: experiment.reads.map(r => [r.t, r.r]),
                    color: HelperFunctions.stringToColor(protein.uniprotId+"-E"+experiment.experiment),
                    marker: {symbol: 'circle'}
                })
            })
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
        Highcharts.chart('curvesGraph', highChartsCurvesConfigObject);

        resolve(true);
    })
}


const drawCurvesItems = (proteins, allProteins, experimentId) => {
    return new Promise((resolve, reject) => {

        const proteinsToDraw = [];
        allProteins.forEach(protein => {
            const obj = {
                id: protein,
                experiments:[],
                present: 1
            };
            const tmpPrt = proteins.find(v => v.uniprotId === protein);
            if(tmpPrt) {
                obj.experiments.push({
                    reads: tmpPrt.experiments[0].reads,
                    experiment: tmpPrt.experiments[0].experiment,
                    uniprotId: protein
                });
                obj.present++;
            } else {
                obj.experiments.push({
                    experiment: parseInt(experimentId),
                    uniprotId: protein
                })
            }
            proteinsToDraw.push(obj);
        })

        const alreadyInStorage = StorageManager.getProteins();

        const toAppend = (obj, exp) => {
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
                    .text(obj.id)
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
                    .addClass(
                        'dot-div'+
                        (
                            alreadyInStorage.find(p =>
                                p.uniprotId === obj.id &&
                                p.experiment.find(e => e === obj.experiments[0].experiment)
                            ) ? ' selected-curve-dot' : ''
                        )
                    )
                );

            return ret;
        };

        HelperFunctions.drawItemsAllExperimentsInOneItem(proteinCurvesGridIdentifier, proteinsToDraw, toAppend);

        // add functionality to select all button
        document.querySelector(selectAllButtonSelector).addEventListener(
            'click',
            () => {
                if(showModal) {
                    ModalService.openModalAndDoAction(
                        () => {},
                        () => {
                            StorageManager.clear();
                            StorageManager.add(
                                proteins.map(p => ({uniprotId: p.uniprotId, experiment: p.experiments[0].experiment})),
                                (c,a) => {
                                    document.querySelector(selectAllButtonSelector).classList.add('green');
                                    document.querySelector(selectAllButtonSelector).classList.add('disabled');
                                    gridItemToggleDotAll(true);
                                }
                            );
                        },
                        () => {
                            StorageManager.add(
                                proteins.map(p => ({uniprotId: p.uniprotId, experiment: p.experiments[0].experiment})),
                                () => {
                                    document.querySelector(selectAllButtonSelector).classList.add('green');
                                    document.querySelector(selectAllButtonSelector).classList.add('disabled');
                                    gridItemToggleDotAll(true);
                                }
                            );
                        }
                    )
                } else {
                    showModal = true;
                    StorageManager.add(
                        proteins.map(p => ({uniprotId: p.uniprotId, experiment: p.experiments[0].experiment})),
                        () => {
                            document.querySelector(selectAllButtonSelector).classList.add('green');
                            document.querySelector(selectAllButtonSelector).classList.add('disabled');
                            gridItemToggleDotAll(true);
                        }
                    );
                }
            }
        );

        resolve(true);
    })
}

const gridItemHasDot = (gridItem) => {
    return $(gridItem).children('.dot-div').hasClass('selected-curve-dot');
}

const gridItemToggleDot = (gridItem, show) => {
    let dot = $(gridItem).children('.dot-div');
    if(show === true) {
        dot.addClass('selected-curve-dot');
        return true;
    } else if(show === false) {
        dot.removeClass('selected-curve-dot');
        return false;
    } else {
        dot.toggleClass('selected-curve-dot');
        return gridItemHasDot;
    }
}
const gridItemToggleDotAll = (show) => {
    if(show === true) {
        document.querySelectorAll(gridItemIdentifier).forEach(item => gridItemToggleDot(item, true))
    } else if(show === false) {
        document.querySelectorAll(gridItemIdentifier).forEach(item => gridItemToggleDot(item, false))
    } else {
        document.querySelectorAll(gridItemIdentifier).forEach(item => gridItemToggleDot(item))
    }
}


$(document).ready(() => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    console.log('query', query);
    if(query.id) {
        let loading = true;

        const complexData = ComplexService.getComplexById(query.id);
        const experimentsWhichHaveComplex = ExperimentService.experimentsWhichHaveComplex(query.id);
        const averageDistanceToOtherExperimentsComplex = ComplexService.getAverageDistancesToOtherExperiments(query.id);

        experimentsWhichHaveComplex
            .then(exps => {
                console.log('experiments which have complex', exps);
                drawOtherExperimentsSelect(exps, query.id, query.experiment);
                return exps;
            })
            .then((experiments) => Promise.all([
                    complexData,
                    averageDistanceToOtherExperimentsComplex
                ])
            )
            .then(([complex, avgDist]) => {
                console.log('complex', complex);
                console.log('avgDist', avgDist);
                return [complex, avgDist];
            })
            .then(([complex, avgDist]) => {
                drawComplexMetadata(complex, avgDist, query.experiment);
                return Promise.all([
                    averageDistanceToOtherExperimentsComplex,
                    complex
                ]);
            })
            .then(([avgDist, complex]) => {
                if(query.experiment) {
                    return TemperatureService.temperatureReadsToProteinsAndExperimentPairs(
                            complex.proteins.map(protein => ({ uniprotId: protein, experiment: query.experiment }))
                        )
                        .then(proteinData => {
                            console.log('proteinCurves', proteinData);
                            drawRanking(avgDist, proteinData.length, query.experiment);
                            drawCombinedProteinCurves(proteinData);
                            drawCurvesItems(proteinData, complex.proteins, query.experiment);
                        });
                } else {
                    return Promise.resolve();
                }
            })
            .then(done => {
                $(dropDownSelector).dropdown({
                    match: 'both',
                    fullTextSearch: true,
                    glyphWidth: 3.0,
                    placeholder: 'default'
                });
                loading = false;
                console.log('done', done);
            })
            .catch(error => {
                loading = false;
                console.error('loading error', error);
            });
    }
});
