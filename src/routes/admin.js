const express = require("express");
const router = express.Router();

router.get("/best-profession/", async (req, res) => {
  //I`m not sure what means "that worked in the query time range". Since we don't have start working date and finish working date,
  // lets assume that it means filter by created_at date

  const { Contract } = req.app.get("models");

  const { start, end } = req.query;
  if (!start || !end) {
    req.send(400);
  }

  co
  

});
module.exports = router();
