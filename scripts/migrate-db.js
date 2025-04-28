const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// This file contains a script to directly push schema to the database
// without using drizzle-kit's CLI

async function main() {
  console.log('Pushing database schema...');
  
  try {
    // Run drizzle-kit generate command to create temporary migrations
    await exec('npx drizzle-kit push:pg');
    console.log('Schema successfully pushed to the database!');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }
}

main();