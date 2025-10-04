const Entity = require('../models/entityModel');

const PAGE_SIZE = 10;

async function searchByName(name, page) {
  const skipAmount = (page - 1) * PAGE_SIZE;

  const results = await Entity.aggregate([
    {
      $search: {
        index: "userSearch",
        autocomplete: {
          query: name,
          path: "name",
          fuzzy: {
            maxEdits: 2,
            prefixLength: 1,
            maxExpansions: 50
          }
        }
      }
    },
    {
      $facet: {
        data: [
          { $skip: skipAmount },
          { $limit: PAGE_SIZE }
        ],
        totalCount: [
          { $count: "count" }
        ]
      }
    }
  ]);

  return {
    data: results[0]?.data || [],
    total: results[0]?.totalCount[0]?.count || 0
  };
}

const searchEntitiesByName = async (req, res) => {
  try {
    const { query } = req.params;

    let page = parseInt(req.params.page, 10);
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const { data, total } = await searchByName(query, page);
    res.json({
      results: data,
      totalResults: total,
      currentPage: page,
      totalPages: Math.ceil(total / PAGE_SIZE)
    });

  } catch (err) {
    console.error("❌ Error searching entities:", err);
    res.status(500).json({ error: err.message });
  }
};

const searchEntityByFaceId = async (req, res) => {
  try {
    const { faceId } = req.params;

    let page = parseInt(req.params.page, 10);
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    const skipAmount = (page - 1) * PAGE_SIZE;

    if (!faceId || faceId.trim() === "") {
      return res.status(400).json({ error: "Face ID parameter is required" });
    }

    const total = await Entity.countDocuments({ face_id: faceId });
    const entities = await Entity.find({ face_id: faceId })
      .skip(skipAmount)
      .limit(PAGE_SIZE);

    res.json({
      results: entities,
      totalResults: total,
      currentPage: page,
      totalPages: Math.ceil(total / PAGE_SIZE)
    });

  } catch (err) {
    console.error("❌ Error searching entity by face ID:", err);
    res.status(500).json({ error: err.message });
  }
};

const searchEntityByCardId = async (req, res) => {
  try {
    const { cardId } = req.params;

    let page = parseInt(req.params.page, 10);
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    const skipAmount = (page - 1) * PAGE_SIZE;

    if (!cardId || cardId.trim() === "") {
      return res.status(400).json({ error: "Card ID parameter is required" });
    }

    const total = await Entity.countDocuments({ card_id: cardId });
    const entities = await Entity.find({ card_id: cardId })
      .skip(skipAmount)
      .limit(PAGE_SIZE);

    res.json({
      results: entities,
      totalResults: total,
      currentPage: page,
      totalPages: Math.ceil(total / PAGE_SIZE)
    });

  } catch (err) {
    console.error("❌ Error searching entity by card ID:", err);
    res.status(500).json({ error: err.message });
  }
};

const searchEntityByHashId = async (req, res) => {
  try {
    const { hashId } = req.params;

    let page = parseInt(req.params.page, 10);
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    const skipAmount = (page - 1) * PAGE_SIZE;

    if (!hashId || hashId.trim() === "") {
      return res.status(400).json({ error: "hash ID parameter is required" });
    }

    const total = await Entity.countDocuments({ device_hash: hashId });
    const entities = await Entity.find({ device_hash: hashId })
      .skip(skipAmount)
      .limit(PAGE_SIZE);

    res.json({
      results: entities,
      totalResults: total,
      currentPage: page,
      totalPages: Math.ceil(total / PAGE_SIZE)
    });

  } catch (err) {
    console.error("❌ Error searching entity by hash ID:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  searchEntitiesByName,
  searchEntityByFaceId,
  searchEntityByCardId,
  searchEntityByHashId
};
