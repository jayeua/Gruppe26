// server/index.js — small webhook receiver to forward Jira events to GitHub repo_dispatch
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO || 'jayeua/Gruppe22';

app.post('/jira-webhook', async (req, res) => {
  try{
    // Optional: verify a shared secret here (compare headers or payload signature)
    await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ event_type: 'jira-updated', client_payload: { from: 'jira' }})
    });
    return res.sendStatus(204);
  }catch(err){
    console.error('forward error', err);
    return res.status(500).send('error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Webhook receiver listening on ${port}`));
