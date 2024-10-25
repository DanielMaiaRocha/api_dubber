import pkg from "pg";
const { Client } = pkg;
import dotenv from "dotenv";

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
    console.log("Conectado ao NeonDB com sucesso!");
    await createTable();
  } catch (err) {
    console.error("Erro ao conectar ao banco de dados", err);
  }
}

async function createTable() {
  const createTableSQL = `
      CREATE TABLE IF NOT EXISTS conversation (
        id SERIAL PRIMARY KEY,
        conversationId VARCHAR(255) NOT NULL,
        sellerId VARCHAR(255) NOT NULL,
        buyerId VARCHAR(255) NOT NULL,
        lastMessage TEXT NOT NULL,
        readBySeller TEXT NOT NULL,
        readByBuyer TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

  try {
    await client.query(createTableSQL);
    console.log("Tabela messages criada com sucesso!");
  } catch (err) {
    console.error("Erro ao criar a tabela", err);
  }
}

async function getConversations() {
  const query = "SELECT * FROM conversation";
  try {
    const res = await client.query(query);
    return res.rows;
  } catch (err) {
    console.log("Failed to get conversations:", err);
    throw err;
  }
}

async function createConversation() {
  const query = `
   INSERT INTO converstaion ( conversationId ,sellerId, buyerId, lastMessage, readBySeller, readByBuyer )
   VALUES ( $1, $2, $3, $4, $5, $6 )
   RETURNING *;
  `;
  const values = [
    conversationData.sellerId,
    conversationData.buyerId,
    conversationData.conversationId,
    conversationData.lastMessage,
    conversationData.readBySeller,
    conversationData.readByBuyer
  ];

  try {
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao criar mensagem:', err);
    throw err;
  };
}

async function getSingleConversation() {
  const query = 'SELECT '
}

export { getConversations, connectToDatabase, createConversation };
