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
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      img TEXT,
      country VARCHAR(100) NOT NULL,
      phone VARCHAR(50),
      description TEXT,
      is_seller BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await client.query(createTableSQL);
    console.log('Tabela users criada com sucesso!');
  } catch (err) {
    console.error('Erro ao criar a tabela', err);
  }
}

async function createUser(userData) {
  const query = `
    INSERT INTO users (username, email, password, img, country, phone, description, is_seller)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [
    userData.username,
    userData.email,
    userData.password,
    userData.img,
    userData.country,
    userData.phone,
    userData.description,
    userData.isSeller
  ];

  try {
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    throw err;
  }
}

async function getUsers() {
  const query = 'SELECT * FROM users;';
  try {
    const res = await client.query(query);
    return res.rows;
  } catch (err) {
    console.error('Erro ao obter usuários:', err);
    throw err;
  }
}

export { connectToDatabase, createUser, getUsers };
