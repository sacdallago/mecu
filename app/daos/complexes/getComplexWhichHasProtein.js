module.exports = {
    query: () => {
        return `
            select c.id, c.name, c.comment, c.proteins
            from complexes c
            where :uniprotId = ANY (c.proteins::text[])
        `;
    }
};
