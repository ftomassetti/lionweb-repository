import dotenv from "dotenv";

dotenv.config()

console.log("process.env.PGDB", process.env.PGDB)
console.log("process.env.PGDB ||  \"lionweb_test\"", process.env.PGDB ||  "lionweb_test")

export const PGHOST = process.env.PGHOST || "postgres"
export const PGUSER = process.env.PGUSER || "postgres"
export const PGDB = process.env.PGDB ||  "lionweb_test"

console.log("PGDB", PGDB)