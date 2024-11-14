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
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversationId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await client.query(createTableSQL);
    console.log('Tabela messages criada com sucesso!');
  } catch (err) {
    console.error('Erro ao criar a tabela', err);
  }
}

async function createMessages(messageData) {
  const query = `
    INSERT INTO messages (conversationId, userId, description)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [
    messageData.conversationId,
    messageData.userId,
    messageData.desc,
  ];

  try {
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao criar mensagem:', err);
    throw err;
  }
}

async function getMessagesByConversationId(conversationId) {
  const query = 'SELECT * FROM messages WHERE conversationId = $1;';
  try {
    const res = await client.query(query, [conversationId]);
    return res.rows;
  } catch (err) {
    console.error('Erro ao obter mensagens:', err);
    throw err;
  }
}

export { connectToDatabase, createMessages, getMessagesByConversationId };
