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
      $skip: skipAmount
    },
    {
      $limit: PAGE_SIZE
    }
  ]);

  return results;
}

const searchEntitiesByName = async (req, res) => {
    try {
        // Get both query and page from the route parameters
        const { query } = req.params;
        
        // CHANGE: Read 'page' from req.params instead of req.query
        let page = parseInt(req.params.page, 10); 
        if (isNaN(page) || page < 1) {
            page = 1; // Default to 1 if not provided in URL or is invalid
        }

        if (!query || query.trim() === "") {
            return res.status(400).json({ error: "Query parameter is required" });
        }

        const results = await searchByName(query, page);
        res.json(results);

    } catch (err) {
        console.error("❌ Error searching entities:", err);
        res.status(500).json({ error: err.message });
    }
};

const searchEntityByFaceId = async (req, res) => {
    try {
        const { faceId } = req.params;

        // CHANGE: Read 'page' from req.params instead of req.query
        let page = parseInt(req.params.page, 10);
        if (isNaN(page) || page < 1) {
            page = 1;
        }
        const skipAmount = (page - 1) * PAGE_SIZE;

        if (!faceId || faceId.trim() === "") {
            return res.status(400).json({ error: "Face ID parameter is required" });
        }

        const entities = await Entity.find({ face_id: faceId })
            .skip(skipAmount)
            .limit(PAGE_SIZE);
            
        res.json(entities);
    } catch (err) {
        console.error("❌ Error searching entity by face ID:", err);
        res.status(500).json({ error: err.message });
    }
}

const searchEntityByCardId = async (req, res) => {
    try {
        const { cardId } = req.params;

        // CHANGE: Read 'page' from req.params instead of req.query
        let page = parseInt(req.params.page, 10);
        if (isNaN(page) || page < 1) {
            page = 1;
        }
        const skipAmount = (page - 1) * PAGE_SIZE;

        if (!cardId || cardId.trim() === "") {
            return res.status(400).json({ error: "Card ID parameter is required" });
        }

        const entities = await Entity.find({ card_id: cardId })
            .skip(skipAmount)
            .limit(PAGE_SIZE);

        res.json(entities);
    } catch (err) {
        console.error("❌ Error searching entity by card ID:", err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    searchEntitiesByName,
    searchEntityByFaceId,
    searchEntityByCardId
};