const ListsService = {
  getAllAdv(db) {
    return db
      .from("fmn_lists AS list")
      .select(
        "list.id",
        "list.name",
        "list.theme",
        db.raw(`count(DISTINCT idea) AS number_of_ideas`),
        db.raw(
          `json_strip_nulls(
            json_build_object(
              'id', usr.id,
              'username', usr.username,
              'date_created', usr.date_created
            )
          ) AS "user"`
        )
      )
      .leftJoin("fmn_ideas AS idea", "list.id", "idea.list_id")
      .leftJoin("fmn_users AS usr", "list.user_id", "usr.id")
      .groupBy("list.id", "usr.id")
      .orderBy("list.name");
  },

  getByIdAdv(db, id) {
    return ListsService.getAllAdv(db).where("list.id", id).first();
  },

  insertList(db, newList) {
    return db
      .insert(newList)
      .into("fmn_lists")
      .returning("*")
      .then(([list]) => {
        list.ideas = [];
        return list;
      });
  },

  updateList(db, id, newListFields) {
    return db("fmn_lists").where({ id }).update(newListFields);
  },

  deleteList(db, id) {
    return db("fmn_lists").where({ id }).delete();
  },

  getIdeasForList(db, list_id) {
    return db
      .from("fmn_ideas AS idea")
      .select(
        "idea.id",
        "idea.name",
        "idea.content",
        "idea.posted_date",
        db.raw(
          `row_to_json(
            (SELECT tmp FROM (
              SELECT usr.id, usr.username
            ) tmp)
          ) AS "user"`
        )
      )
      .where("idea.list_id", list_id)
      .leftJoin("fmn_users AS usr", "idea.user_id", "usr.id")
      .groupBy("idea.id", "usr.id")
      .orderBy("idea.posted_date");
  },
};

module.exports = ListsService;
