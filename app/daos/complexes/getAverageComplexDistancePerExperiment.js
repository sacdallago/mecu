module.exports = {
    query: () => {
        return `
            select experiment, name, ac.avg
            from average_complex_distance_per_experiment ac, experiments e
            where ac."complexId" = :complexId and
                  e.id = ac.experiment and
                  (e.private = false or e.uploader = :uploader)
            order by ac.avg;
        `;
    }
};
