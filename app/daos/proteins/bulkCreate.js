module.exports = {
    query: () => {
        return `INSERT INTO public.proteins("uniprotId", "createdAt", "updatedAt") VALUES (:uniprotId, :createdAt, :updatedAt) ON CONFLICT DO NOTHING;`;
    }
};
