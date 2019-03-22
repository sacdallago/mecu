const lAExperimentNumber = new LoadingAnimation(`.experiment-number-loading-animation`, {size: 30});
const lAComplexCurve = new LoadingAnimation(`#curvesGraph`);
const lAMetaData = new LoadingAnimation(`.column-right-loading-animation`);
const lAComplexCurves = new LoadingAnimation(`#curves-grid .grid`, {size: 50});


let hasProteinExpMemorized = StorageManager.getProteins().length !== 0
const dropDownSelector = `#experiment-number .dropdown`;

const addProteinModalIdentifier = `#add-protein-modal`;
ModalService.createAddProteinToLocalStorageModalWithNoYesAddButtons(addProteinModalIdentifier);

const infoModalIdentifier = `#protein-info-modal`;

const selectAllButtonSelector = `#select-all-button`;
const analyzeButtonSelector = `.analyze-button`;

// grid proteins from the complex
const proteinCurvesGridIdentifier = `#curves-grid .grid`;
const gridItemIdentifier = `.grid-item`;
const proteinCurvesGrid = $(proteinCurvesGridIdentifier).isotope({
    itemSelector: gridItemIdentifier,
    layoutMode: `packery`,
    packery: {
        gutter: 10
    }
});
proteinCurvesGrid.on(`click`, gridItemIdentifier, function(){
    const data = $(this).data(`grid-item-contents`);

    // disable selection of proteins without curves
    if(data.obj.present > 1) {
        if(hasProteinExpMemorized && !gridItemHasDot(this)) {
            ModalService.openProteinAddModalAndWaitForAction(
                addProteinModalIdentifier,
                () => {},
                () => {
                    StorageManager.clear();
                    gridItemToggleDotAll(false);
                    StorageManager.toggle(
                        {uniprotId: data.obj.id, experiment: data.obj.experiments[0].experiment},
                        () => gridItemToggleDot(this)
                    );
                    enableAnalyzeButton();
                },
                () => {
                    StorageManager.toggle(
                        {uniprotId: data.obj.id, experiment: data.obj.experiments[0].experiment},
                        () => gridItemToggleDot(this)
                    );
                    enableAnalyzeButton();
                }
            );
        } else {
            StorageManager.toggle(
                {uniprotId: data.obj.id, experiment: data.obj.experiments[0].experiment},
                () => gridItemToggleDot(this)
            );
            hasProteinExpMemorized = true;
            enableAnalyzeButton();
        }
    }

});

const enableAnalyzeButton = () => {
    const l = document.querySelectorAll(analyzeButtonSelector);
    l.forEach(b => {
        b.classList.remove(`disabled`);
        b.classList.add(`green`);
    });
};

const drawComplexMetadata = (complex, experimentId) => {
    return new Promise((resolve) => {

        lAMetaData.stop();

        const dataContainer = $(`.column-right`);
        dataContainer.empty();

        const itemContainer = $(`<div />`).addClass(`item-container`);
        const text = $(`<div />`).addClass(`text`);
        const value = $(`<div />`).addClass(`value`);
        const list = $(`<div />`).addClass(`list`);
        const listItem = $(`<div />`).addClass(`list-item`);

        // proteins items (+modals)
        const proteinListContainer = $(`<div />`).addClass(`id-and-names-list-container`);

        if(complex.proteins && complex.proteins.length > 0) {
            // table head
            const table = $(`<table />`).addClass('ui celled table');
            table.append(
                $(`<thead />`).append(
                    $(`<tr />`).append([
                        $(`<th />`).text('Protein Name'),
                        $(`<th />`).text('Inspect'),
                    ])
                )
            );

            // table data
            table.append(
                $(`<tbody />`).append(
                    complex.proteins.map((p,i) => {
                        const proteinName = $(`<td />`)
                            .text(p)
                            .addClass('hoverable');
                        proteinName.on(`click`, () => {
                            ModalService.createInfoModal(infoModalIdentifier,
                                `Protein: `+p,
                                `
                                <div class="modal-content">
                                    <div class="row">
                                        <div class="name">Name</div>
                                        <div class="value">${complex.proteinNames[i]}</div>
                                    </div>
                                    <div class="row">
                                        <div class="name">Gene</div>
                                        <div class="value">${complex.geneNames[i]}</div>
                                    </div>
                                    <div class="row">
                                        <div class="name">Synonym</div>
                                        <div class="value">${complex.geneNamesynonyms[i]}</div>
                                    </div>
                                    <div class="row">
                                        <div class="name">Organism</div>
                                        <div class="value">${complex.swissprotOrganism[i]}</div>
                                    </div>
                                    <div class="row">
                                        <div class="name"></div>
                                        <div class="value"><a href="https://www.uniprot.org/uniprot/${p}" target="_blank">Uniprot Link</a></div>
                                    </div>
                                </div>
                                `
                            );
                            ModalService.openInfoModal(infoModalIdentifier);
                        });

                        const inspectTd = $(`<td />`)
                            .data('object', {protein:p, experiment:experimentId})
                            .text('Go to protein page.')
                            .addClass('hoverable');
                        inspectTd.on(`click`, function() {
                            const data = $(this).data(`object`);
                            document.location.href = `/protein?protein=${data.protein}&experiment=${data.experiment}`;
                        });

                        return $(`<tr />`).append([
                            proteinName,
                            inspectTd
                        ]);
                    })
                )
            );

            proteinListContainer.append(table);
        }

        // gene + names list
        const geneAndNamesList = $(`<div />`).addClass(`id-and-names-list-container`);
        if(complex.geneNames && complex.geneNames.length > 0) {
            const geneAndNamesItem = $(`<div />`).addClass(`id-and-names-list-item`);
            const gANId = $(`<div />`).addClass(`id-and-names-id`);
            const gANText = $(`<div />`).addClass(`id-and-names-text`);
            geneAndNamesList.append(
                geneAndNamesItem.clone().append([
                    gANId.clone().text(`Name`),
                    gANText.clone().text(`Synonym`)
                ])
            );
            complex.geneNames.forEach((p,i) => {
                geneAndNamesList.append(
                    geneAndNamesItem.clone().append([
                        gANId.clone().text(p),
                        gANText.clone().text(
                            complex.geneNamesynonyms.length > i ? complex.geneNamesynonyms[i] : `-`
                        )
                    ])
                );
            });
        }

        // swissprotOrganism
        const swissprotOrganismList = list.clone().addClass(`swissprot-organism-list`);
        (complex.swissprotOrganism || []).forEach(p => swissprotOrganismList.append(listItem.clone().text(p)));

        dataContainer.append([
            itemContainer.clone().append([
                text.clone().text(`Name`),
                value.clone().text(complex.name)
            ]),
            itemContainer.clone().attr({'id':`ranking-field`}).append([
                text.clone().text(`Ranking`),
                value.clone()
            ]),
            itemContainer.clone().append([
                text.clone().text(`Purification Method`),
                value.clone().text(complex.purificationMethod)
            ]),
            itemContainer.clone().append([
                text.clone().text(`Comment`),
                value.clone().text(complex.comment || `-`)
            ]),
            itemContainer.clone().append([
                text.clone().text(`Cell line`),
                value.clone().text(complex.cellLine || `-`)
            ]),
            itemContainer.clone().append([
                text.clone().text(`Organism`),
                value.clone().text(complex.organism || `-`)
            ]),
            itemContainer.clone().append([
                text.clone().text(`Synonyms`),
                value.clone().text(complex.synonyms || `-`)
            ]),
            itemContainer.clone().append([
                text.clone().text(`Disease comment`),
                value.clone().text(complex.diseaseComment || `-`)
            ]),
            itemContainer.clone().append([
                text.clone().text(`GO description`),
                value.clone().append(complex.goDescription)
            ]),
            itemContainer.clone().append([
                text.clone().text(`Funcat Description`),
                value.clone().append(complex.funCatDescription)
            ]),
            itemContainer.clone().append([
                text.clone().text(`Proteins`),
                value.clone().append(proteinListContainer)
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
};

const drawRanking = (avgDistances, tempReadsLength, experimentId) => {
    // complex data ranking
    let avgDistanceRanking = tempReadsLength < 2 ? `not enough data to calculate` : `not yet calculated`;
    let tooltip = `<div class="tooltip-content"><div class="t-line"><div class="t-left">Experiment</div><div class="t-right">Distance</div></div>`;
    avgDistances.forEach((v,i) => {
        if(v.experiment === parseInt(experimentId)) {
            avgDistanceRanking = i+1;
            tooltip+= `<div class="t-line" style="font-weight:bold;"><div class="t-left">${v.name}</div><div class="t-right">${v.avg.toFixed(2)}</div></div>`;
        } else {
            tooltip+= `<div class="t-line"><div class="t-left">${v.name}</div><div class="t-right">${v.avg.toFixed(2)}</div></div>`;
        }

    });
    tooltip+=`</div><div class="ranking-info-text">Distance of all the proteins within a complex for each experiment.</div>`;

    $(`#ranking-field`).attr({'id':`ranking-tooltip`, 'data-html':tooltip});
    $(`#ranking-tooltip .value`).text(avgDistanceRanking);

    $(`#ranking-tooltip`).popup({position: `bottom right`});
};

const drawOtherExperimentsSelect = (experiments, complexId, actualExperiment) => {
    return new Promise((resolve) => {

        const dropDownContainer = $(dropDownSelector).addClass([`ui`, `search`, `dropdown`]);
        dropDownContainer.dropdown({});
        $(`#experiment-number .dropdown .search`).css({'padding': `11 20px`});

        const menuContainer = $(`#experiment-number .dropdown .menu`);
        const otherExperiments = [];
        experiments.forEach(experiment => {
            if(experiment.id != actualExperiment) {
                otherExperiments.push(
                    $(`<a />`)
                        .addClass(`item`)
                        .attr({'data-value':experiment.name, 'href':`/complex?id=${complexId}&experiment=${experiment.id}`})
                        .text(experiment.name.slice(0,255))
                );
            } else {
                otherExperiments.push(
                    $(`<a />`)
                        .addClass(`item`)
                        .attr({'data-value':`default`})
                        .text(experiment.name.slice(0,255))
                );
            }
        });
        menuContainer.append(otherExperiments);

        lAExperimentNumber.stop();

        resolve(true);
    });
};


const drawCombinedProteinCurves = (proteins) => {
    return new Promise((resolve) => {
        lAComplexCurve.stop();
        if (proteins.length === 0) {
            const complexCurvesContainer = document.querySelector(`#curvesGraph`);
            const noCurvesText = document.createTextNode(`No protein curves for this complex/experiment pair.`);
            complexCurvesContainer.append(noCurvesText);
            resolve(true);
            return;
        }

        // creating data series for highcharts
        let series = [];
        proteins.forEach(protein => {
            protein.experiments.forEach(experiment => {
                series.push({
                    name: protein.uniprotId+` `+experiment.experiment,
                    data: experiment.reads.map(r => [r.t, r.r]),
                    color: HelperFunctions.stringToColor(protein.uniprotId+`-E`+experiment.experiment),
                    marker: {symbol: `circle`}
                });
            });
        });

        // configuring and plotting highcharts
        highChartsCurvesConfigObject[`title.text`] = `TPCA melting curve`;
        highChartsCurvesConfigObject[`yAxis.title.text`] = `% alive`;
        highChartsCurvesConfigObject[`xAxis.title.text`] = `Temperature`;
        highChartsCurvesConfigObject[`series`] = series;
        highChartsCurvesConfigObject[`tooltip`] = {
            split: true,
            distance: 30,
            padding: 5
        };

        Highcharts.chart(`curvesGraph`, highChartsCurvesConfigObject);

        resolve(true);
    });
};


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
                });
            }
            proteinsToDraw.push(obj);
        });

        const alreadyInStorage = StorageManager.getProteins();

        const toAppend = (obj) => {
            const ret = [
                $(`<p />`)
                    .addClass(`grid-item-text`)
                    .css({
                        'position': `absolute`,
                        'text-align': `center`,
                        'width': `100%`,
                        'line-height': `35px`,
                        'font-size': `1.2rem`
                    })
                    .text(obj.id)
            ];

            if(obj.present === 1) {
                ret.push(
                    $(`<div />`)
                        .addClass([`cube-text-middle`, `grid-item-text`])
                        .text(`No data for this experiment`)
                );
            }
            ret.push(
                $(`<div />`)
                    .addClass(
                        `dot-div`+
                        (
                            alreadyInStorage.find(p =>
                                p.uniprotId === obj.id &&
                                p.experiment.find(e => e === obj.experiments[0].experiment)
                            ) ? ` selected-curve-dot` : ``
                        )
                    )
            );

            return ret;
        };

        lAComplexCurves.stop();

        HelperFunctions.drawItemsAllExperimentsInOneItem(proteinCurvesGridIdentifier, proteinsToDraw, toAppend);

        // add functionality to select all button
        document.querySelector(selectAllButtonSelector).addEventListener(
            `click`,
            () => {
                if(hasProteinExpMemorized) {
                    ModalService.openProteinAddModalAndWaitForAction(
                        addProteinModalIdentifier,
                        () => {},
                        () => {
                            StorageManager.clear();
                            StorageManager.add(
                                proteins.map(p => ({uniprotId: p.uniprotId, experiment: p.experiments[0].experiment})),
                                () => {
                                    document.querySelector(selectAllButtonSelector).classList.add(`green`);
                                    document.querySelector(selectAllButtonSelector).classList.add(`disabled`);
                                    gridItemToggleDotAll(true);
                                    enableAnalyzeButton();
                                }
                            );
                        },
                        () => {
                            StorageManager.add(
                                proteins.map(p => ({uniprotId: p.uniprotId, experiment: p.experiments[0].experiment})),
                                () => {
                                    document.querySelector(selectAllButtonSelector).classList.add(`green`);
                                    document.querySelector(selectAllButtonSelector).classList.add(`disabled`);
                                    gridItemToggleDotAll(true);
                                    enableAnalyzeButton();
                                }
                            );
                        }
                    );
                } else {
                    hasProteinExpMemorized = true;
                    StorageManager.add(
                        proteins.map(p => ({uniprotId: p.uniprotId, experiment: p.experiments[0].experiment})),
                        () => {
                            document.querySelector(selectAllButtonSelector).classList.add(`green`);
                            document.querySelector(selectAllButtonSelector).classList.add(`disabled`);
                            gridItemToggleDotAll(true);
                            enableAnalyzeButton();
                        }
                    );
                }
            }
        );

        resolve(true);
    });
};

const gridItemHasDot = (gridItem) => {
    return $(gridItem).children(`.dot-div`).hasClass(`selected-curve-dot`);
};

const gridItemToggleDot = (gridItem, show) => {
    let dot = $(gridItem).children(`.dot-div`);
    if(show === true) {
        dot.addClass(`selected-curve-dot`);
        return true;
    } else if(show === false) {
        dot.removeClass(`selected-curve-dot`);
        return false;
    } else {
        dot.toggleClass(`selected-curve-dot`);
        return gridItemHasDot;
    }
};
const gridItemToggleDotAll = (show) => {
    if(show === true) {
        document.querySelectorAll(gridItemIdentifier).forEach(item => gridItemToggleDot(item, true));
    } else if(show === false) {
        document.querySelectorAll(gridItemIdentifier).forEach(item => gridItemToggleDot(item, false));
    } else {
        document.querySelectorAll(gridItemIdentifier).forEach(item => gridItemToggleDot(item));
    }
};

const startLoading = (id, experiment) => {
    const complexData = ComplexService.getComplexById(id);
    const experimentsWhichHaveComplex = ExperimentService.experimentsWhichHaveComplex(id);
    const averageDistanceToOtherExperimentsComplex = ComplexService.getAverageDistancesToOtherExperiments(id);

    lAExperimentNumber.start();
    lAComplexCurve.start();
    lAMetaData.start();
    lAComplexCurves.start();

    return experimentsWhichHaveComplex
        .then(exps => {
            console.log(`experiments which have complex`, exps);
            if ((!experiment || experiment === null) && exps.length > 0) {
                experiment = exps[0].id;
            }
            drawOtherExperimentsSelect(exps, id, experiment);
            return exps;
        })
        .then(() => Promise.all([
                complexData,
                averageDistanceToOtherExperimentsComplex
            ])
        )
        .then(([complex, avgDist]) => {
            console.log(`complex`, complex);
            console.log(`avgDist`, avgDist);
            return [complex, avgDist];
        })
        .then(([complex, avgDist]) => {
            drawComplexMetadata(complex, experiment);
            return Promise.all([
                avgDist,
                complex
            ]);
        })
        .then(([avgDist, complex]) => {
            if(experiment) {
                return TemperatureService.temperatureReadsToProteinsAndExperimentPairs(
                    complex.proteins.map(protein => ({ uniprotId: protein, experiment: experiment }))
                )
                    .then(proteinData => {
                        console.log(`proteinCurves`, proteinData);
                        drawRanking(avgDist, proteinData.length, experiment);
                        drawCombinedProteinCurves(proteinData);
                        drawCurvesItems(proteinData, complex.proteins, experiment);
                    });
            } else {
                lAComplexCurve.stop();
                const complexCurvesContainer = document.querySelector(`#curvesGraph`);
                const defaultText = document.createTextNode(`Select experiment (upper right) to view corresponding curves.`);
                complexCurvesContainer.append(defaultText);

                lAComplexCurves.stop();
                const complexCurvesGridContainer = document.querySelector(`#curves-grid .grid`);
                const defaultText2 = document.createTextNode(`Select experiment (upper right) to view corresponding curves.`);
                complexCurvesGridContainer.append(defaultText2);

                return Promise.resolve();
            }
        })
        .then(done => {
            $(dropDownSelector).dropdown({
                match: `both`,
                fullTextSearch: true,
                glyphWidth: 3.0,
                placeholder: `default`
            });
            console.log(`done`, done);

            if(hasProteinExpMemorized) {
                enableAnalyzeButton()
            }
        })
        .catch(error => {
            console.error(`loading error`, error);
        });
}

const loadQuery = () => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    console.log(`query`, query);
    if(query.id) {
        return startLoading(query.id, query.experiment);
    }
}


$(document).ready(() => loadQuery());


TourHelper.attachTour(
    '#help-menu-item',
    [
        {
            after: () => startLoading(21, 4),
            target: '#spacedText',
            content: 'This page shows you complex-centric information.',
            placement: ['bottom']
        },
        {
            target: '#experiment-number',
            content: 'Here you can switch between different experiments containing at least one of the proteins in the complex.',
            placement: ['left', 'right', 'top', 'bottom']
        },

        // combined curves
        {
            target: '#curvesGraph',
            content: 'This graph shows all TPCA curves for the proteins in the given complex for the selected experiment. The graph is interactive.',
            placement: ['top', 'right', 'bottom', 'left']
        },
        {
            target: '.column-right',
            content: 'This panel shows data about the complex (from CORUM).',
            placement: ['top', 'right', 'bottom', 'left']
        },
        {
            target: '.column-right > .item-container:nth-child(9)',
            content: 'The protein UniProt Accession numbers are clickable and will open up more information about the protein obtained from CORUM.',
            placement: ['left', 'top', 'right', 'bottom']
        },
        {
            target: '#curves-grid',
            content: 'Here you can find the proteins belonging to the complex in the selected experiment. Proteins that are in the complex but are not in the experiment are grayed out.',
            placement: ['top', 'right', 'bottom', 'left']
        },
        {
            target: '#curves-grid .grid-item:nth-child(1)',
            content: 'Proteins in this section can be selected for visualization in the Analyze page, which is accessible from the menu or the button in the top-left of this area.',
            placement: ['top', 'right', 'bottom', 'left']
        }
    ],
    () => loadQuery(),
    () => loadQuery()
);
