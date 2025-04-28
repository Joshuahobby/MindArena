// Direct database schema push script
const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('Connecting to database...');
  
  // Create Postgres client
  const connectionString = process.env.DATABASE_URL;
  const sql = postgres(connectionString, { max: 1 });
  
  try {
    // Connect to the database and create tables
    console.log('Creating database schema...');
    
    // Execute each statement separately
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        display_name VARCHAR(100),
        role VARCHAR(20) NOT NULL DEFAULT 'player',
        tokens INTEGER NOT NULL DEFAULT 1000,
        xp INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMP NOT NULL DEFAULT NOW(),
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        profile_picture VARCHAR(255),
        stats JSONB DEFAULT '{"wins": 0, "losses": 0, "draws": 0, "questionsAnswered": 0, "correctAnswers": 0, "averageResponseTime": 0, "highScore": 0}',
        battle_pass_premium BOOLEAN NOT NULL DEFAULT FALSE,
        battle_pass_level INTEGER NOT NULL DEFAULT 1,
        battle_pass_xp INTEGER NOT NULL DEFAULT 0,
        settings JSONB DEFAULT '{"notifications": true, "sound": true, "music": true, "vibration": true, "language": "en"}'
      )
    `;

    console.log('Creating clans table...');
    await sql`
      CREATE TABLE IF NOT EXISTS clans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        logo VARCHAR(255),
        banner VARCHAR(255),
        founder_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        member_count INTEGER NOT NULL DEFAULT 1,
        is_public BOOLEAN NOT NULL DEFAULT TRUE,
        invite_code VARCHAR(20) NOT NULL UNIQUE,
        xp INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        tokens INTEGER NOT NULL DEFAULT 0,
        win_rate INTEGER NOT NULL DEFAULT 50,
        max_members INTEGER NOT NULL DEFAULT 50,
        trophies INTEGER NOT NULL DEFAULT 0
      )
    `;

    console.log('Adding clan_id to users table...');
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS clan_id INTEGER REFERENCES clans(id) ON DELETE SET NULL
    `;

    console.log('Creating clan_roles table...');
    await sql`
      CREATE TABLE IF NOT EXISTS clan_roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL,
        clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
        permissions JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(name, clan_id)
      )
    `;

    console.log('Creating clan_memberships table...');
    await sql`
      CREATE TABLE IF NOT EXISTS clan_memberships (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
        role_id INTEGER REFERENCES clan_roles(id) ON DELETE SET NULL,
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        contributed_xp INTEGER NOT NULL DEFAULT 0,
        contributed_tokens INTEGER NOT NULL DEFAULT 0,
        last_active TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY(user_id, clan_id)
      )
    `;

    console.log('Creating clan_invitations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS clan_invitations (
        id SERIAL PRIMARY KEY,
        clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
        invited_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invited_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP,
        UNIQUE(clan_id, invited_user_id)
      )
    `;

    console.log('Creating clan_battles table...');
    await sql`
      CREATE TABLE IF NOT EXISTS clan_battles (
        id SERIAL PRIMARY KEY,
        clan1_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
        clan2_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        clan1_score INTEGER NOT NULL DEFAULT 0,
        clan2_score INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        winner_id INTEGER REFERENCES clans(id),
        trophies_awarded INTEGER DEFAULT 0,
        tokens_awarded INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    console.log('Creating clan_battle_participants table...');
    await sql`
      CREATE TABLE IF NOT EXISTS clan_battle_participants (
        id SERIAL PRIMARY KEY,
        battle_id INTEGER NOT NULL REFERENCES clan_battles(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
        score INTEGER NOT NULL DEFAULT 0,
        correct_answers INTEGER NOT NULL DEFAULT 0,
        matches_played INTEGER NOT NULL DEFAULT 0,
        matches_won INTEGER NOT NULL DEFAULT 0,
        contributed_points INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    
    console.log('Database schema created successfully!');
  } catch (error) {
    console.error('Error creating database schema:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await sql.end();
  }
}

main();