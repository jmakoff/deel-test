const express = require("express");
const router = express.Router();
const { getProfile } = require("../middleware/getProfile");
const { Op } = require("sequelize");

router.get("/:id", getProfile, async (req, res) => {
  const { Contract } = req.app.get("models");
  const { id } = req.params;
  const profileId = req.profile.id;
  const contract = await Contract.findOne({
    where: {
      id,
      [Op.or]: [{ ContractorId: profileId }, { ClientId: profileId }],
    },
  });
  if (!contract) return res.status(404).end();
  res.json(contract);
});

router.get("/", getProfile, async (req, res) => {
  const { Contract } = req.app.get("models");
  const profileId = req.profile.id;
  const contracts = await Contract.findAll({
    where: {
      [Op.or]: [{ ContractorId: profileId }, { ClientId: profileId }],
    },
  });
  if (!contracts.length) {
    return res.status(404).end();
  }
  res.json(contracts);
});

module.exports = router;
