
import express from 'express';
import pokemon from './schema/pokemon.js';

import './connect.js';

const app = express();

app.use('/assets', express.static('assets'));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/pokemons', async (req, res) => {
    try {
        const limit = Number.parseInt(req.query.limit, 10);
        const safeLimit = Number.isNaN(limit) ? 20 : limit;
        const pokemons = await pokemon.find({}).sort({ id: 1 }).limit(safeLimit);
        res.json(pokemons);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/pokemons/:id', async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id, 10);
        const poke = await pokemon.findOne({ id });
        if (poke) {
            res.json(poke);
        } else {
            res.status(404).send('Pokemon not found');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});



app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
