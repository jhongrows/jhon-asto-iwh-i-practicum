// index.js para Custom Object "VideoGames" con propiedades name, ranking, genre, release_year

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

// ----- Vista y estáticos
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----- Config API HubSpot
const PRIVATE_APP_ACCESS = process.env.HUBSPOT_PRIVATE_APP_TOKEN || '';
const OBJECT_ID = process.env.CUSTOM_OBJECT_ID; // ej: "2-1234567"

// Internal names reales (en minúsculas)
const PROP_NAME = process.env.PROP_NAME || 'name';
const PROP_RANKING = process.env.PROP_RANKING || 'ranking';
const PROP_GENRE = process.env.PROP_GENRE || 'genre';
const PROP_RELEASE_YEAR = process.env.PROP_RELEASE_YEAR || 'release_year';

const hubspot = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// =====================================================
// ROUTE 1: Homepage "/" → lista registros de VideoGames
// =====================================================
app.get('/', async (req, res) => {
  try {
    const params = {
      properties: [PROP_NAME, PROP_RANKING, PROP_GENRE, PROP_RELEASE_YEAR].join(','),
      limit: 100,
      archived: false
    };

    const { data } = await hubspot.get(`/crm/v3/objects/${OBJECT_ID}`, { params });

    const rows = (data.results || []).map(r => ({
      id: r.id,
      name: r.properties?.[PROP_NAME] || '',
      ranking: r.properties?.[PROP_RANKING] || '',
      genre: r.properties?.[PROP_GENRE] || '',
      release_year: r.properties?.[PROP_RELEASE_YEAR] || ''
    }));

    res.render('homepage', {
      title: 'Video Games List',
      columns: ['Name', 'Ranking', 'Genre', 'Release Year'],
      rows
    });
  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).send('Error loading VideoGames from HubSpot. Revisa tu .env, permisos y objectTypeId.');
  }
});

// ====================================================================
// ROUTE 2: Formulario GET "/update-cobj" → crear nuevo Video Game
// ====================================================================
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Add a Video Game | Practicum',
    labels: {
      name: 'Name',         // Label en mayúscula
      ranking: 'Ranking',
      genre: 'Genre',
      release_year: 'Release Year'
    },
    action: '/update-cobj'
  });
});

// ==================================================================================
// ROUTE 3: Formulario POST "/update-cobj" → crea registro y redirige al homepage
// ==================================================================================
app.post('/update-cobj', async (req, res) => {
  try {
    const { name, ranking, genre, release_year } = req.body;

    const payload = {
      properties: {
        [PROP_NAME]: name,
        [PROP_RANKING]: ranking,
        [PROP_GENRE]: genre,
        [PROP_RELEASE_YEAR]: release_year
      }
    };

    await hubspot.post(`/crm/v3/objects/${OBJECT_ID}`, payload);

    res.redirect('/');
  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).send('Error creating VideoGame in HubSpot. Verifica internal names.');
  }
});

// * Localhost
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
