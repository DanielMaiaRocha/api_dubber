import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Conectado ao NeonDB com sucesso!');
    await createTable();
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados', err);
  }
}

async function createTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS cards (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      total_stars INTEGER DEFAULT 0,
      star_number INTEGER DEFAULT 0,
      category VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      cover TEXT NOT NULL,
      video TEXT,
      short_title VARCHAR(255) NOT NULL,
      short_description TEXT NOT NULL,
      delivery_time INTEGER NOT NULL,
      revision_number INTEGER NOT NULL,
      features TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await client.query(createTableSQL);
    console.log('Tabela cards criada com sucesso!');
  } catch (err) {
    console.error('Erro ao criar a tabela cards', err);
  }
}

async function createCard(cardData) {
  const query = `
    INSERT INTO cards (user_id, title, description, total_stars, star_number, category, price, cover, video, short_title, short_description, delivery_time, revision_number, features)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;
  const values = [
    cardData.userId,
    cardData.title,
    cardData.desc,
    cardData.totalStars || 0,
    cardData.starNumber || 0,
    cardData.cat,
    cardData.price,
    cardData.cover,
    cardData.video,
    cardData.shortTitle,
    cardData.shortDesc,
    cardData.deliveryTime,
    cardData.revisionNumber,
    cardData.features,
  ];

  try {
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao criar card:', err);
    throw err;
  }
}

async function getCardById(id) {
  const query = 'SELECT * FROM cards WHERE id = $1';
  try {
    const res = await client.query(query, [id]);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao obter card:', err);
    throw err;
  }
}

async function updateCardStarsInDB(cardId, newTotalStars, newStarNumber) {
  const query = `
    UPDATE cards 
    SET total_stars = $1, 
        star_number = $2,
        updated_at = NOW()
    WHERE id = $3
    RETURNING *;
  `;
  const values = [newTotalStars, newStarNumber, cardId];

  try {
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao atualizar estrelas do card:', err);
    throw err;
  }
}

async function getAllCards(filters = {}, sortBy = 'created_at') {
  let query = 'SELECT * FROM cards';
  const values = [];
  let conditions = [];

  if (filters.user_id) {
    values.push(filters.user_id);
    conditions.push(`user_id = $${values.length}`);
  }
  if (filters.category) {
    values.push(filters.category);
    conditions.push(`category = $${values.length}`);
  }
  if (filters.minPrice || filters.maxPrice) {
    if (filters.minPrice) {
      values.push(filters.minPrice);
      conditions.push(`price >= $${values.length}`);
    }
    if (filters.maxPrice) {
      values.push(filters.maxPrice);
      conditions.push(`price <= $${values.length}`);
    }
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`title ILIKE $${values.length}`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY ${sortBy} DESC`;

  try {
    const res = await client.query(query, values);
    return res.rows;
  } catch (err) {
    console.error('Erro ao obter cards:', err);
    throw err;
  }
}

async function deleteCardById(id) {
  const query = 'DELETE FROM cards WHERE id = $1';
  try {
    await client.query(query, [id]);
    console.log('Card deletado com sucesso!');
  } catch (err) {
    console.error('Erro ao deletar card:', err);
    throw err;
  }
}

export { 
  connectToDatabase, 
  createCard, 
  getCardById, 
  getAllCards, 
  deleteCardById, 
  updateCardStarsInDB 
};
