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
    await createReviewTable();
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados', err);
  }
}

async function createReviewTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      card_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      star INTEGER NOT NULL CHECK (star BETWEEN 1 AND 5),
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await client.query(createTableSQL);
    console.log('Tabela reviews criada com sucesso!');
  } catch (err) {
    console.error('Erro ao criar a tabela reviews', err);
  }
}

async function createReview(reviewData) {
  const query = `
    INSERT INTO reviews (card_id, user_id, star, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [
    reviewData.cardId,
    reviewData.userId,
    reviewData.star,
    reviewData.desc,
  ];

  try {
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao criar avaliação:', err);
    throw err;
  }
}

async function getReviewsByCard(cardId) {
  const query = 'SELECT * FROM reviews WHERE card_id = $1;';
  try {
    const res = await client.query(query, [cardId]);
    return res.rows;
  } catch (err) {
    console.error('Erro ao obter avaliações:', err);
    throw err;
  }
}

export { connectToDatabase, createReview, getReviewsByCard };
