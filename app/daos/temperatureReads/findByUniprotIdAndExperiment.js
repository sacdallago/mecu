module.exports = {
    query: (whereClause) => {
        return `
            SELECT e.id, p."uniprotId", temperature, ratio
            FROM "temperatureReads" tr, proteins p, experiments e
            ${whereClause};
        `;
    },

    constructWhereClause: () => {
        return `
            where
            (e.private = false or e.uploader = :uploader) and
            tr."uniprotId" = p."uniprotId" and
            tr.experiment = e.id
        `;
    }
};
