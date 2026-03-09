const { Client } = require("pg");
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await client.connect();
  const res = await client.query('SELECT id, name, email, role FROM "User" ORDER BY "createdAt"');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main().catch(e => console.error(e.message));
