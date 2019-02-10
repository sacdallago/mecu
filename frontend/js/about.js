$(`#reset-tour-button`).on(`click`, function() {
    Object.keys(pageNames).forEach(k => {
        StorageManager.setPageTourStatus(pageNames[k], true);
    });

    $(`#reset-tour-button`).addClass(`disabled`);
});
