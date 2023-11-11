const express = require("express");
const { sequelize } = require("../model");
const router = express.Router();
const { QueryTypes } = require("sequelize");

router.get("/best-profession/", async (req, res) => {
  //I`m not sure what means "that worked in the query time range". Since we don't have start working date and finish working date,
  // lets assume that it means filter by created_at date

  const { start, end } = req.query;
  if (!start || !end) {
    req.send(400);
  }

  const maxPaidProfession = await sequelize.query(
    `SELECT max(sum_price) as sum, profession FROM (
        SELECT 
        sum(price) as sum_price, 
        'Profile'.'id', 
        'Profile'.'profession'
      FROM 
        'Profiles' AS 'Profile' 
        JOIN 'Contracts' ON 'Contracts'.'ContractorId' = 'Profile'.'id' 
        JOIN 'Jobs' ON 'Contracts'.'id' = 'Jobs'.'ContractId' 
      WHERE 
        'Jobs'.'paid' = true and
        'Profile'.'createdAt' BETWEEN $1 AND $2 
      GROUP BY 
        'Profile'.'id'
    )`,
    {
      bind: [start, end],
      type: QueryTypes.SELECT,
    }
  );

  res.send(maxPaidProfession[0]);
});

router.get("/best-clients/", async (req, res) => {
  const { start, end, limit = 2 } = req.query;

  const result = await sequelize.query(
    `
    SELECT jobs_count, name FROM (
      SELECT 
        count('Jobs'.'id') as jobs_count, 
        'Profile'.'id', 
        firstName || ' ' || lastName as name
      FROM 
        'Profiles' AS 'Profile' 
        JOIN 'Contracts' ON 'Contracts'.'ClientId' = 'Profile'.'id' 
        JOIN 'Jobs' ON 'Contracts'.'id' = 'Jobs'.'ContractId' 
      WHERE 
        'Jobs'.'paid' = true and
        paymentDate BETWEEN $1 
      AND $2
      GROUP BY 
        'Profile'.'id'
    ) Order by jobs_count desc limit $3
    `,
    {
      bind: [start, end, limit],
      type: QueryTypes.SELECT,
    }
  );

  res.send(result);
});

module.exports = router;
