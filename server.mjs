import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'newtab.html'));
});

app.get('/auth/google', (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const scopes = ['https://www.googleapis.com/auth/calendar.readonly'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const events = await calendar.events.list({
    calendarId: 'primary',
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
    timeMin: new Date().toISOString(),
  });

  res.json(events.data.items);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
