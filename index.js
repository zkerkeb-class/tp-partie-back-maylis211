
import express from 'express';
import pokemon from './schema/pokemon.js';

import './connect.js';

const app = express();

// Sert les images/types locales depuis /assets
app.use('/assets', express.static('assets'));
// Parse les corps JSON pour POST/PUT
app.use(express.json());

app.use((req, res, next) => {
  // Autorise le frontend Vite à appeler l'API
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/pokemons', async (req, res) => {
    try {
        const limit = Number.parseInt(req.query.limit, 10);
        const page = Number.parseInt(req.query.page, 10);
        const name = (req.query.name || '').trim();
        const type = (req.query.type || '').trim();
        const sortBy = (req.query.sortBy || 'id').trim();
        const order = (req.query.order || 'asc').trim().toLowerCase();
        const safeLimit = Number.isNaN(limit) ? 20 : Math.max(1, limit);
        const safePage = Number.isNaN(page) ? 1 : Math.max(1, page);

        // Décalage de pagination
        const skip = (safePage - 1) * safeLimit;
        // Recherche optionnelle + filtre par type
        const filter = {};
        if (name) {
            filter.$or = [
                { 'name.english': { $regex: name, $options: 'i' } },
                { 'name.french': { $regex: name, $options: 'i' } },
                { 'name.japanese': { $regex: name, $options: 'i' } },
                { 'name.chinese': { $regex: name, $options: 'i' } },
            ];
        }
        if (type) {
            filter.type = { $in: [type] };
        }

        // Options de tri (par défaut: id)
        const sortMap = {
            id: { id: 1 },
            name: { 'name.english': 1 },
            hp: { 'base.HP': 1 },
            attack: { 'base.Attack': 1 },
            defense: { 'base.Defense': 1 },
            speed: { 'base.Speed': 1 },
        };
        const sort = sortMap[sortBy] || sortMap.id;
        const sortDir = order === 'desc' ? -1 : 1;
        const sortWithDir = Object.fromEntries(
            Object.entries(sort).map(([key, value]) => [key, value * sortDir])
        );
        const [pokemons, total] = await Promise.all([
            pokemon.find(filter).sort(sortWithDir).skip(skip).limit(safeLimit),
            pokemon.countDocuments(filter),
        ]);

        res.json({
            data: pokemons,
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
        });
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

app.post('/pokemons', async (req, res) => {
    try {
        // Valide l'id numérique
        const id = Number.parseInt(req.body.id, 10);
        if (Number.isNaN(id)) {
            res.status(400).send('Invalid id');
            return;
        }
        const payload = { ...req.body, id };
        const created = await pokemon.create(payload);
        res.status(201).json(created);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.put('/pokemons/:id', async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id, 10);
        // Écrase par id avec validation
        const payload = { ...req.body, id };
        const updated = await pokemon.findOneAndUpdate({ id }, payload, {
            new: true,
            runValidators: true,
        });
        if (updated) {
            res.json(updated);
        } else {
            res.status(404).send('Pokemon not found');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.delete('/pokemons/:id', async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id, 10);
        // Supprime un pokemon par id
        const result = await pokemon.deleteOne({ id });
        if (result.deletedCount > 0) {
            res.json({ message: 'Pokemon deleted', id });
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
