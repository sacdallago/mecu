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
    const complexNameDiv = $('#complex-name');
    complexNameDiv.text(complex.name);


    const dataContainer = $('#data-container');

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

    dataContainer.append(
        $('<div />').text(`TODO LEFT OUT:
            goId GO:0006260,GO:0006281,GO:0005634\n
            entrezIds 5111,4436,2956\n
            subunitsComment null\n
            pubMedId 16303135\n
            funCatId 10.01.03,10.01.05.01,70.10\n
            createdAt 2018-08-24T17:04:04.840Z\n
            updatedAt 2018-08-24T17:04:04.840Z\n
            `)
    )
}
