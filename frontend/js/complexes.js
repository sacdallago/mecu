const loadingAnimation = new LoadingAnimation(`.grid-container`);
const lAExperimentNumber = new LoadingAnimation(`.experiment-number-loading-animation`, {size: 30});

const DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME = 400;
const UNIPROT_SPLIT = /(,|\s)/g;
const ITEM_PER_PAGE_COUNT = 25;
const complexesQuery = {
    search: {},
    limit: ITEM_PER_PAGE_COUNT,
    offset: 0,
    sortBy: `id`,
    order: `ASC`
};
let currentlySelectedExperiment;

// search input field
const searchInput = $(`#complex-search`);

const dropDownSelector = `#experiment-number .dropdown`;

const grid = $(`.grid-container`).isotope({
    // main isotope options
    itemSelector: `.grid-item`,
    // set layoutMode
    layoutMode: `packery`,
    packery: {
        gutter: 10
    }
});

grid.on(`click`, `.grid-item`, function(){
    const data = $(this).data(`grid-item-contents`);
    document.location.href = `/complex?id=${data.obj.id}&experiment=${currentlySelectedExperiment}`;
});

searchInput.keydown(function() {
    HelperFunctions.delay(() => handleInput(0, true), DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME);
});


const handleInput = (page, resetOffset) => {

    loadingAnimation.start();

    if(resetOffset) complexesQuery.offset = 0;
    const complexNameInputValue = searchInput.val().trim();

    complexesQuery.search.value = complexNameInputValue;
    complexesQuery.search.experiment = currentlySelectedExperiment;

    ComplexService.findComplex(complexesQuery)
        .then(response => {
            console.log(`response`, response);
            loadingAnimation.stop();
            drawComplexCubes(response);
            drawPaginationComponent(page+1, response.length > 0 ? response[0].total : 0 );
        });
};

const drawPaginationComponent = (actualPage, totalPages) => {
    new PaginationComponent(
        `#pagination-component`,
        totalPages,
        complexesQuery.limit,
        actualPage,
        (newPage) => {
            complexesQuery.offset = (newPage-1)*ITEM_PER_PAGE_COUNT;
            handleInput(newPage-1);
        }
    );
};

const changeURIParams = (searchTerm) => {
    window.history.pushState({search: searchTerm}, `Search for proteins`, `/?search=${searchTerm}`);
};

const drawOtherExperimentsSelect = (experiments, defaultExperiment) => {
    return new Promise((resolve) => {

        const dropDownContainer = $(dropDownSelector).addClass([`ui`, `search`, `dropdown`]);
        dropDownContainer.dropdown({});
        $(`#experiment-number .dropdown .search`).css({'padding': `11 20px`});

        const menuContainer = $(`#experiment-number .dropdown .menu`);
        const otherExperiments = [];
        experiments.forEach((experiment, i) => {
            if(i != defaultExperiment) {
                const experimentEntry = $(`<a />`)
                    .addClass(`item`)
                    .text(experiment.name.slice(0,255))
                    .data('experiment-id', experiment.id);

                experimentEntry.on('click', function() {
                    currentlySelectedExperiment = $(this).data('experiment-id');
                    handleInput(0, true);
                });

                otherExperiments.push(experimentEntry);
            } else {
                const experimentEntry = $(`<a />`)
                    .addClass(`item`)
                    .attr({'data-value':`default`})
                    .text(experiment.name.slice(0,255));

                otherExperiments.push(experimentEntry);
            }
        });
        menuContainer.append(otherExperiments);

        lAExperimentNumber.stop();

        $(dropDownSelector).dropdown({
            match: `both`,
            fullTextSearch: true,
            glyphWidth: 3.0
        });

        resolve(true);
    });
};

const drawComplexCubes = (complexes) => {
    return new Promise((resolve) => {

        if(complexes.length === 0) {
            loadingAnimation.stop();
            resolve(true);
            return;
        }

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
                experiment: '', // TODO add from experiment select
                total: complex.proteins.length,
                present: 0
            };
            index++;

            complex.reads.forEach(reads => {
                if(reads.experiments) {
                    reads.experiments.forEach(experiment => {
                        if(obj.experiments) {
                            obj.experiments.push({
                                experiment: reads.uniprotId,
                                uniprotId: reads.uniprotId,
                                reads: experiment.reads
                            });
                        } else {
                            obj.experiments = [{
                                experiment: reads.uniprotId,
                                uniprotId: reads.uniprotId,
                                reads: experiment.reads
                            }];
                        }
                    });
                    obj.present++;
                }
            });
            proteinExperimentObject.push(obj);
        });

        const toAppend = (obj) => {
            return [
                $(`<p />`)
                    .addClass(`grid-item-text`)
                    .css({
                        'position': `absolute`,
                        'text-align': `center`,
                        'width': `100%`,
                        'line-height': `35px`,
                        'font-size': `1.2rem`,
                        'z-index': 10
                    })
                    .text(obj.uniprotId),
                $(`<div />`)
                    .addClass([`experimentNumber`, `grid-item-text`])
                    .text(obj.present+`/`+obj.total)
            ];
        };

        HelperFunctions.drawItemsAllExperimentsInOneItem(`.grid-container`, proteinExperimentObject, toAppend);

        resolve(true);
    });
};


$(document).ready(() => {
    (function(){

        const currentUri = URI(window.location.href);
        const query = currentUri.search(true);

        if(query.search) {
            searchInput.val(query.search);
            handleInput(0, true);
        }

        searchInput.trigger(`focus`);
        searchInput.trigger($.Event(`keydown`));
    })();

    ExperimentService.paginatedExperiments({
            search: undefined,
            limit: 100,
            offset: 0,
            sortBy: `id`,
            order: 1
        })
        .then(expsResult => {
            console.log('exps', expsResult);
            if (expsResult.data.length > 0) {
                const def = 0;
                currentlySelectedExperiment = expsResult.data[def].id;
                return drawOtherExperimentsSelect(expsResult.data, def); // TODO actual experiment
            }
        })
});
