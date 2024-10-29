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
    console.log("Conectado ao banco de dados com sucesso!");
    await createTable();
  } catch (err) {
    console.error("Erro ao conectar ao banco de dados", err);
  }
}

async function createTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      card_id VARCHAR(255) NOT NULL,
      img TEXT,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      seller_id VARCHAR(255) NOT NULL,
      buyer_id VARCHAR(255) NOT NULL,
      is_completed BOOLEAN DEFAULT FALSE,
      is_accepted BOOLEAN DEFAULT null,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await client.query(createTableSQL);
    console.log("Tabela bookings criada com sucesso!");
  } catch (err) {
    console.error("Erro ao criar a tabela bookings:", err);
  }
}

async function createBooking(bookingData) {
  const query = `
    INSERT INTO bookings (card_id, img, title, price, seller_id, buyer_id, is_completed)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const values = [
    bookingData.cardId,
    bookingData.img,
    bookingData.title,
    bookingData.price,
    bookingData.sellerId,
    bookingData.buyerId,
    bookingData.isCompleted || false,
  ];

  try {
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error("Erro ao criar booking:", err);
    throw err;
  }
}

async function getBookingById(id) {
  const query = "SELECT * FROM bookings WHERE id = $1";
  try {
    const res = await client.query(query, [id]);
    return res.rows[0];
  } catch (err) {
    console.error("Erro ao obter booking:", err);
    throw err;
  }
}

async function getAllBookings() {
  const query = "SELECT * FROM bookings ORDER BY created_at DESC";
  try {
    const res = await client.query(query);
    return res.rows;
  } catch (err) {
    console.error("Erro ao obter bookings:", err);
    throw err;
  }
}

async function updateBookingStatus(id, isCompleted) {
  const query = `
    UPDATE bookings 
    SET is_completed = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *;
  `;
  try {
    const res = await client.query(query, [isCompleted, id]);
    return res.rows[0];
  } catch (err) {
    console.error("Erro ao atualizar o status do booking:", err);
    throw err;
  }
}

async function deleteBookingById(id) {
  const query = "DELETE FROM bookings WHERE id = $1";
  try {
    await client.query(query, [id]);
    console.log("Booking deletado com sucesso!");
  } catch (err) {
    console.error("Erro ao deletar booking:", err);
    throw err;
  }
}

export {
  connectToDatabase,
  createBooking,
  getBookingById,
  getAllBookings,
  updateBookingStatus,
  deleteBookingById,
};
