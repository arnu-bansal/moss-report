const { Client } = require("pg");
const client = new Client({
  connectionString: "postgres://e090abc9d5a5606d19ed67103590bcfe7537f3aeee775158608124218dcf93e0:sk_MXWjEBecCd0XpgUaKo9d2@db.prisma.io:5432/postgres?sslmode=require",
});
async function main() {
  await client.connect();
  console.log("Connected!");
  const res = await client.query("SELECT COUNT(*) FROM \"User\"");
  console.log("Users:", res.rows[0].count);
  await client.end();
}
main().catch(e => console.error("Error:", e.message));
