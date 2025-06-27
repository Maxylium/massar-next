// This file is a placeholder for the API route logic if you want to use the App Router for API routes in Next.js 13+.
// You can move your API logic here if you want to use the new app directory routing for APIs.
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { load } from 'cheerio';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password, semester, year } = req.body;
  if (!username || !password || !semester || !year) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, timeout: 15000 }));

  try {
    const tokenPage = await client.get('https://massarservice.men.gov.ma/moutamadris/Account');
    const $ = load(tokenPage.data);
    const token = $('input[name="__RequestVerificationToken"]').val();

    if (!token) return res.status(500).json({ error: 'Failed to retrieve CSRF token' });

    const loginPayload = new URLSearchParams({
      UserName: username,
      Password: password,
      __RequestVerificationToken: token as string
    }).toString();

    const loginRes = await client.post(
      'https://massarservice.men.gov.ma/moutamadris/Account',
      loginPayload,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://massarservice.men.gov.ma/moutamadris/Account',
          'Origin': 'https://massarservice.men.gov.ma',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    if (!loginRes.data.includes('ChangePassword')) {
      return res.status(401).json({ error: 'Login failed' });
    }

    await client.post('https://massarservice.men.gov.ma/moutamadris/General/SetCulture?culture=en', null);

    const gradesPayload = new URLSearchParams({
      Annee: year.split('/')[0],
      IdSession: semester
    }).toString();

    const gradesRes = await client.post(
      'https://massarservice.men.gov.ma/moutamadris/TuteurEleves/GetBulletins',
      gradesPayload,
      {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://massarservice.men.gov.ma/moutamadris/TuteurEleves/GetNotesEleve',
          'Origin': 'https://massarservice.men.gov.ma',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    if (!gradesRes.data || !gradesRes.data.includes('Classe')) {
      return res.status(500).json({ error: 'Could not fetch grades' });
    }

    res.json({ rawHTML: gradesRes.data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
