TourHelper = {};
TourHelper.attachTour = (identifier, steps) => {
    $(identifier).on('click', () => {
        const Tour = window.Tour.default;
        Tour.start(Object.assign({}, tourSettings, {steps:steps}))
            .then(() => {
                console.log('Tour Finished!');
                $(identifier).removeClass(`active`);
                $(identifier).removeClass(`selected`);
            })
            .catch(() => {
                console.log('Tour Interrupted!');
                $(identifier).removeClass(`active`);
                $(identifier).removeClass(`selected`);
            });
    });
}
