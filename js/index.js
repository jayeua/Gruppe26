// index.js (example)
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'jayeua/Gruppe22';

app.post('/jira-webhook', async (req, res) => {
  // (optional) verify a shared secret here
  // Forward to GitHub repo_dispatch
  await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({ event_type: 'jira-updated', client_payload: { from: 'jira' }})
  });
  res.sendStatus(204);
});

app.listen(process.env.PORT || 3000);