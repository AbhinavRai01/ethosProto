import * as dialogflow from '@google-cloud/dialogflow';
import { v4 } from 'uuid';

import dotenv from 'dotenv';
dotenv.config();

const credentials = JSON.parse(process.env.DIALOGFLOW_CREDENTIALS)

const projectId = credentials.project_id;

const configuration = {
    credentials: {
        private_key: credentials.private_key,
        client_email: credentials.client_email,
    },
}

const sessionClient = new dialogflow.SessionsClient(configuration);
const sessionId = v4();

const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

export async function sendQueryToDialogflow(userQuery) {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: userQuery,
        languageCode: 'en-US',
      },
    },
  };

  try {
    const [response] = await sessionClient.detectIntent(request);
    console.log('Dialogflow Response:', response);

    return response.queryResult;

  } catch (error) {
    console.error('Error calling Dialogflow detectIntent:', error);
    // Handle error appropriately
    return null; 
  }
}