let localStorageDeleted = StorageManager.get().length === 0;

// grid proteins from the complex
const proteinCurvesGridIdentifier = '#curves-grid .grid';
const proteinCurvesGrid = $(proteinCurvesGridIdentifier).isotope({
    itemSelector: '.grid-item',
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});
proteinCurvesGrid.on('click', '.grid-item', function(){
    const data = $(this).data('grid-item-contents');
    let dot = $(this).children('.selected-curve-dot');
    console.log('data', data.obj.uniprotId, data.experiment.experiment);
    const hasBeenAdded = saveExperimentToLocalStorage(data.obj.uniprotId, data.experiment.experiment);
    if(hasBeenAdded) dot.css({'visibility': dot.css('visibility') === 'hidden' ? 'visible' : 'hidden'});
});


$(document).ready(() => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    console.log('query', query);
    if(query.id) {
        let loading = true;

        ComplexService.getComplexById(query.id)
            .then(complex => {
                console.log('complex', complex);
                return complex;
            })
            .then(complex => Promise.all([
                drawComplexMetadata(complex),
                TemperatureService.temperatureReadsToProteinsAndExperimentPairs(
                    complex.proteins.map(protein =>
                        ({
                            uniprotId: protein,
                            experiment: query.experiment
                        })
                    )
                )
            ]))
            .then(([done, proteinCurves]) => {
                console.log('proteinCurves', proteinCurves);
                drawCombinedProteinCurves(proteinCurves);
                drawCurvesItems(proteinCurves);
                return done;
            })
            .then(done => {
                loading = false;
                console.log('done', done);
            })
            .catch(error => {
                loading = false;
                console.error('loading error', error);
            });
    }
});

const drawComplexMetadata = (complex) => {
    return new Promise((resolve, reject) => {
        const complexNameDiv = $('#complex-name');
        complexNameDiv.text(complex.name);


        const dataContainer = $('#data-container .column-right');

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


const drawCurvesItems = (proteins) => {
    return new Promise((resolve, reject) => {

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
                    .addClass('selected-curve-dot')
            ];
        };

        HelperFunctions.drawItemForEveryExperiment(proteinCurvesGridIdentifier, proteins, toAppend);

        resolve(true);
    })
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
