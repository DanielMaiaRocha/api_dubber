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
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      conversation_id VARCHAR(255) NOT NULL UNIQUE,
      seller_id VARCHAR(255) NOT NULL,
      buyer_id VARCHAR(255) NOT NULL,
      read_by_seller BOOLEAN NOT NULL,
      read_by_buyer BOOLEAN NOT NULL,
      last_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await client.query(createTableSQL);
    console.log('Tabela conversations criada com sucesso!');
  } catch (err) {
    console.error('Erro ao criar a tabela conversations', err);
  }
}

async function createConversation(conversationData) {
  const query = `
    INSERT INTO conversations (conversation_id, seller_id, buyer_id, read_by_seller, read_by_buyer, last_message)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [
    conversationData.id,
    conversationData.sellerId,
    conversationData.buyerId,
    conversationData.readBySeller,
    conversationData.readByBuyer,
    conversationData.lastMessage || null,
  ];

  try {
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao criar conversa:', err);
    throw err;
  }
}

async function getConversationById(conversationId) {
  const query = 'SELECT * FROM conversations WHERE conversation_id = $1';
  try {
    const res = await client.query(query, [conversationId]);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao obter conversa:', err);
    throw err;
  }
}

async function updateConversation(conversationId, readBySeller, readByBuyer) {
  const query = `
    UPDATE conversations
    SET read_by_seller = $1, read_by_buyer = $2, updated_at = NOW()
    WHERE conversation_id = $3
    RETURNING *;
  `;
  const values = [readBySeller, readByBuyer, conversationId];

  try {
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao atualizar status de leitura da conversa:', err);
    throw err;
  }
}

export { connectToDatabase, createConversation, getConversationById, updateConversation };
