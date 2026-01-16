#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_JQL = process.env.JIRA_JQL || 'ORDER BY updated DESC';
const OUTPUT = process.env.OUTPUT_PATH || path.join(__dirname, '..', 'data', 'jira.json');
const MAX_RESULTS = process.env.JIRA_MAX_RESULTS || '50';

if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('Missing JIRA_BASE_URL or JIRA_EMAIL or JIRA_API_TOKEN');
  process.exit(1);
}

async function fetchIssues() {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const base = JIRA_BASE_URL.replace(/\/$/, '');
  const url = `${base}/rest/api/3/search?jql=${encodeURIComponent(JIRA_JQL)}&maxResults=${MAX_RESULTS}&fields=summary,issuetype,status,assignee,priority,labels,created,updated`;

  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API error ${res.status}: ${text}`);
  }
  const json = await res.json();
  const out = {
    fetchedAt: new Date().toISOString(),
    total: json.total,
    issues: (json.issues || []).map(i => ({
      key: i.key,
      summary: i.fields.summary,
      issueType: i.fields.issuetype && i.fields.issuetype.name,
      status: i.fields.status && i.fields.status.name,
      assignee: i.fields.assignee && (i.fields.assignee.displayName || i.fields.assignee.emailAddress),
      priority: i.fields.priority && i.fields.priority.name,
      labels: i.fields.labels || [],
      created: i.fields.created,
      updated: i.fields.updated,
      url: `${base}/browse/${i.key}`
    }))
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', OUTPUT);
}

fetchIssues().catch(err => { console.error(err); process.exit(1); });
