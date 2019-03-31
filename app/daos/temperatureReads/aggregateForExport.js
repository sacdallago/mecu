module.exports = {
    createExperimentClause: () => `and e.id = :experimentId`,

    query: (experimentClause) => {
        return `
            select "uniprotId", expId, json_object_agg(temperature, ratio) as obj
            from (
                SELECT p."uniprotId", temperature, ratio, e.id as expId
                FROM "temperatureReads" tr, proteins p, experiments e
                where (e.private = :isPrivate or e.uploader = :uploader) and
                tr."uniprotId" = p."uniprotId" and
                tr.experiment = e.id
                ${experimentClause}
                order by p."uniprotId", temperature asc
            ) as tmp
            group by tmp."uniprotId", expId;
        `;
    }
};
