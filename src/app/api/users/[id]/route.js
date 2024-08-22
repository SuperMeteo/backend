// src/app/api/users/[id]/route.js
import { Client } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();

// Handle GET request
export async function GET(request, { params }) {
  const { id } = params;
  try {
    const result = await client.query('SELECT * FROM tbl_users WHERE id = $1', [id]);
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  try {
    const { firstname, lastname, username, password } = await request.json();

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const query = `
      UPDATE tbl_users
      SET firstname = $1, lastname = $2, username = $3, ${hashedPassword ? 'password = $4,' : ''}
      updated_at = NOW()
      WHERE id = $${hashedPassword ? '5' : '4'}
      RETURNING *;
    `;

    const values = [firstname, lastname, username];
    if (hashedPassword) {
      values.push(hashedPassword);
    }
    values.push(id);

    const res = await client.query(query, values);
    return new Response(JSON.stringify(res.rows[0]), {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user data:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
