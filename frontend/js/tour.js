TourHelper = {};
TourHelper.attachTour = (identifier, steps, onFinish = () => {}, onInterupt = () => {}) => {
    $(identifier).on('click', () => {
        const Tour = window.Tour.default;
        Tour.start(Object.assign({}, tourSettings, {steps:steps}))
            .then(() => {
                console.log('Tour Finished!');
                $(identifier).removeClass(`active`);
                $(identifier).removeClass(`selected`);
                onFinish();
            })
            .catch((e) => {
                console.log('Tour Interrupted!', e);
                $(identifier).removeClass(`active`);
                $(identifier).removeClass(`selected`);
                onInterupt();
            });
    });
}
