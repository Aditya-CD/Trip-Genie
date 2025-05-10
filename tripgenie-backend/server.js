import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = 5000;

app.use(cors());

app.get('/api/hotels', async (req, res) => {
  const { city } = req.query;
  const apiKey = 'AIzaSyCrlHym54K8K8uHiXZ-W4VcP-_qswr1aGg'; 

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          query: `hotels in ${city}`,
          key: apiKey,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching hotels:', error.message);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});

app.post('/api/confirm', (req, res) => {
  // logic to save itinerary
});


