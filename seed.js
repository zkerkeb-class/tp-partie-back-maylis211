import mongoose from "mongoose";
import pokemon from "./schema/pokemon.js";
import pokemonsList from "./data/pokemonsList.js";

const MONGO_URI = "mongodb://localhost:27017/pokemon-db-2";
const API_URL = process.env.API_URL || "http://localhost:3000";

const normalizeImageUrl = (url) => {
    if (!url) return url;
    return url.replace(/^undefined\//, `${API_URL}/`);
};

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);

        const data = pokemonsList.map((p) => ({
            ...p,
            image: normalizeImageUrl(p.image),
        }));

        await pokemon.deleteMany({});
        await pokemon.insertMany(data);

        console.log(`Seed OK: ${data.length} pokemons inserted.`);
    } catch (error) {
        console.error("Seed error:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seed();
