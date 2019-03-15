module.exports = {
    query: (whereClause) => {
        return `
            SELECT tmp."uniprotId", json_agg(json_build_object('experiment', tmp.experiment, 'reads', tmp.reads)) AS experiments
            FROM (
                SELECT tr.experiment, tr."uniprotId", json_agg(json_build_object('t', tr.temperature, 'r', tr.ratio) ORDER BY temperature) AS reads
                FROM experiments e, "experiment_temperatureReads" e_tr, "temperatureReads" tr, proteins p, "protein_temperatureReads" p_tr
                WHERE
                    e.id = e_tr."experimentId" AND
                    (e.private = :isPrivate or e.uploader = :uploader) AND
                    e_tr."temperatureReadId" = tr.id AND
                    p_tr."uniprotId" = p."uniprotId" AND
                    p_tr."temperatureReadId" = tr.id AND
                    ${whereClause}
                GROUP BY tr."experiment", tr."uniprotId"
            ) tmp
            GROUP BY tmp."uniprotId";
        `;
    }
};
