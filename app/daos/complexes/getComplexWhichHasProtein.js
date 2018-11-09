module.exports = {
    query: () => {
        return `
            select c.id, c.name, c.comment, c.proteins
            from complexes c, proteins p, protein_complexes cp
            where c.id = cp."complexId" and p."uniprotId" = cp."uniprotId" and p."uniprotId" = :uniprotId;
        `;
    }
};
