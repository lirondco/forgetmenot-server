const IdeasService = {
  getById(db, id) {
    return db.from("fmn_ideas").where({ id }).first();
  },

  insertIdea(db, newIdea) {
    return db
      .insert(newIdea)
      .into("fmn_ideas")
      .returning("*")
      .then(([idea]) => idea);
  },

  updateIdea(db, id, newIdeaFields) {
    return db("fmn_ideas").where({ id }).update(newIdeaFields);
  },

  deleteIdea(db, id) {
    return db("fmn_ideas").where({ id }).delete();
  },
};

module.exports = IdeasService;
