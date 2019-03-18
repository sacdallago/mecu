module.exports = {
    query: (whereClause) => {
        return `
        SELECT tmp."uniprotId", json_agg(tmp.experiment) AS experiments
        FROM (
            SELECT tr.experiment, tr."uniprotId"
            FROM
                experiments e,
                "experiment_temperatureReads" e_tr,
                "temperatureReads" tr,
                proteins p,
                "protein_temperatureReads" p_tr,
                protein_experiments pe
            WHERE
                p."uniprotId" = pe."uniprotId" AND
                pe."experimentId" = e.id AND
                e.id = e_tr."experimentId" AND
                (e.private = :isPrivate or e.uploader = :uploader) AND
                e_tr."temperatureReadId" = tr.id AND
                p_tr."uniprotId" = p."uniprotId" AND
                p_tr."temperatureReadId" = tr.id
                ${whereClause}
            GROUP BY tr."experiment", tr."uniprotId"
        ) tmp
        GROUP BY tmp."uniprotId";
        `;
    }
};
