import express from 'express';
const router = express.Router();
import {sendQueryToDialogflow} from '../controllers/dialogflowController.js'; // Note: You might need to add the .js extension
router.post('/query', async (req, res) => {
    const { userQuery } = req.body;
    const dialogflowResponse = await sendQueryToDialogflow(userQuery);
    if (dialogflowResponse) {
        res.json(dialogflowResponse.fulfillmentMessages[0].text.text[0]);
    } else {
        res.status(500).json({ error: 'Failed to get response from Dialogflow' });
    }
});

export default router;
