import { pgTable, serial, text, varchar, boolean, timestamp, integer, json, uniqueIndex, primaryKey, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(), // Firebase UID
  username: varchar('username', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  displayName: varchar('display_name', { length: 100 }),
  role: varchar('role', { length: 20 }).default('player').notNull(),
  tokens: integer('tokens').default(1000).notNull(),
  xp: integer('xp').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at').defaultNow().notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  profilePicture: varchar('profile_picture', { length: 255 }),
  stats: json('stats').$type<{
    wins: number;
    losses: number;
    draws: number;
    questionsAnswered: number;
    correctAnswers: number;
    averageResponseTime: number;
    highScore: number;
  }>().default({
    wins: 0,
    losses: 0,
    draws: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    averageResponseTime: 0,
    highScore: 0,
  }),
  battlePassPremium: boolean('battle_pass_premium').default(false).notNull(),
  battlePassLevel: integer('battle_pass_level').default(1).notNull(),
  battlePassXp: integer('battle_pass_xp').default(0).notNull(),
  clanId: integer('clan_id').references(() => clans.id, { onDelete: 'set null' }),
  settings: json('settings').$type<{
    notifications: boolean;
    sound: boolean;
    music: boolean;
    vibration: boolean;
    language: string;
  }>().default({
    notifications: true,
    sound: true,
    music: true,
    vibration: true,
    language: 'en',
  }),
});

// Clans/Teams table
export const clans = pgTable('clans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  logo: varchar('logo', { length: 255 }),
  banner: varchar('banner', { length: 255 }),
  founderUserId: integer('founder_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  memberCount: integer('member_count').default(1).notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  inviteCode: varchar('invite_code', { length: 20 }).notNull().unique(),
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  tokens: integer('tokens').default(0).notNull(),
  winRate: integer('win_rate').default(50).notNull(),
  maxMembers: integer('max_members').default(50).notNull(),
  trophies: integer('trophies').default(0).notNull(),
});

// Clan member roles table 
export const clanRoles = pgTable('clan_roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 30 }).notNull(),
  clanId: integer('clan_id').notNull().references(() => clans.id, { onDelete: 'cascade' }),
  permissions: json('permissions').$type<{
    invite: boolean;
    kick: boolean;
    promote: boolean;
    startWar: boolean;
    editClan: boolean;
    manageTreasury: boolean;
  }>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Make role names unique within a clan
  unique: uniqueIndex('clan_role_unique_idx').on(clanRoles.name, clanRoles.clanId),
});

// Clan memberships table (Many-to-Many between users and clans)
export const clanMemberships = pgTable('clan_memberships', {
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clanId: integer('clan_id').references(() => clans.id, { onDelete: 'cascade' }).notNull(),
  roleId: integer('role_id').references(() => clanRoles.id, { onDelete: 'set null' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  contributedXp: integer('contributed_xp').default(0).notNull(),
  contributedTokens: integer('contributed_tokens').default(0).notNull(),
  lastActive: timestamp('last_active').defaultNow().notNull(),
  // Primary key is a composite of user_id and clan_id
  primary: primaryKey(clanMemberships.userId, clanMemberships.clanId),
});

// Clan invitations table
export const clanInvitations = pgTable('clan_invitations', {
  id: serial('id').primaryKey(),
  clanId: integer('clan_id').notNull().references(() => clans.id, { onDelete: 'cascade' }),
  invitedUserId: integer('invited_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  invitedByUserId: integer('invited_by_user_id').notNull().references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, accepted, declined, expired
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  // Make sure a user can only be invited to a clan once
  unique: uniqueIndex('clan_invitation_unique_idx').on(clanInvitations.clanId, clanInvitations.invitedUserId),
});

// Clan battles/wars table
export const clanBattles = pgTable('clan_battles', {
  id: serial('id').primaryKey(),
  clan1Id: integer('clan1_id').notNull().references(() => clans.id, { onDelete: 'cascade' }),
  clan2Id: integer('clan2_id').notNull().references(() => clans.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  clan1Score: integer('clan1_score').default(0).notNull(),
  clan2Score: integer('clan2_score').default(0).notNull(),
  status: varchar('status', { length: 20 }).default('scheduled').notNull(), // scheduled, in_progress, completed, cancelled
  winnerId: integer('winner_id').references(() => clans.id),
  trophiesAwarded: integer('trophies_awarded').default(0),
  tokensAwarded: integer('tokens_awarded').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Clan battle participants table
export const clanBattleParticipants = pgTable('clan_battle_participants', {
  id: serial('id').primaryKey(),
  battleId: integer('battle_id').notNull().references(() => clanBattles.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clanId: integer('clan_id').notNull().references(() => clans.id, { onDelete: 'cascade' }),
  score: integer('score').default(0).notNull(),
  correctAnswers: integer('correct_answers').default(0).notNull(),
  matchesPlayed: integer('matches_played').default(0).notNull(),
  matchesWon: integer('matches_won').default(0).notNull(),
  contributedPoints: integer('contributed_points').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type definitions for models
export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

export type Clan = InferSelectModel<typeof clans>;
export type InsertClan = InferInsertModel<typeof clans>;

export type ClanRole = InferSelectModel<typeof clanRoles>;
export type InsertClanRole = InferInsertModel<typeof clanRoles>;

export type ClanMembership = InferSelectModel<typeof clanMemberships>;
export type InsertClanMembership = InferInsertModel<typeof clanMemberships>;

export type ClanInvitation = InferSelectModel<typeof clanInvitations>;
export type InsertClanInvitation = InferInsertModel<typeof clanInvitations>;

export type ClanBattle = InferSelectModel<typeof clanBattles>;
export type InsertClanBattle = InferInsertModel<typeof clanBattles>;

export type ClanBattleParticipant = InferSelectModel<typeof clanBattleParticipants>;
export type InsertClanBattleParticipant = InferInsertModel<typeof clanBattleParticipants>;

// Define relations between tables
export const usersRelations = relations(users, ({ one, many }) => ({
  clan: one(clans, {
    fields: [users.clanId],
    references: [clans.id]
  }),
  memberships: many(clanMemberships),
  invitations: many(clanInvitations, { relationName: 'invitedUser' }),
  sentInvitations: many(clanInvitations, { relationName: 'invitedByUser' }),
  battleParticipations: many(clanBattleParticipants),
}));

export const clansRelations = relations(clans, ({ one, many }) => ({
  founder: one(users, {
    fields: [clans.founderUserId],
    references: [users.id]
  }),
  members: many(clanMemberships),
  roles: many(clanRoles),
  invitations: many(clanInvitations),
  battles1: many(clanBattles, { relationName: 'clan1Battles' }),
  battles2: many(clanBattles, { relationName: 'clan2Battles' }),
  wins: many(clanBattles, { relationName: 'battleWins' }),
}));

export const clanMembershipsRelations = relations(clanMemberships, ({ one }) => ({
  user: one(users, {
    fields: [clanMemberships.userId],
    references: [users.id]
  }),
  clan: one(clans, {
    fields: [clanMemberships.clanId],
    references: [clans.id]
  }),
  role: one(clanRoles, {
    fields: [clanMemberships.roleId],
    references: [clanRoles.id]
  }),
}));

export const clanRolesRelations = relations(clanRoles, ({ one, many }) => ({
  clan: one(clans, {
    fields: [clanRoles.clanId],
    references: [clans.id]
  }),
  members: many(clanMemberships),
}));

export const clanInvitationsRelations = relations(clanInvitations, ({ one }) => ({
  clan: one(clans, {
    fields: [clanInvitations.clanId],
    references: [clans.id]
  }),
  invitedUser: one(users, {
    fields: [clanInvitations.invitedUserId],
    references: [users.id],
    relationName: 'invitedUser'
  }),
  invitedByUser: one(users, {
    fields: [clanInvitations.invitedByUserId],
    references: [users.id],
    relationName: 'invitedByUser'
  }),
}));

export const clanBattlesRelations = relations(clanBattles, ({ one, many }) => ({
  clan1: one(clans, {
    fields: [clanBattles.clan1Id],
    references: [clans.id],
    relationName: 'clan1Battles'
  }),
  clan2: one(clans, {
    fields: [clanBattles.clan2Id],
    references: [clans.id],
    relationName: 'clan2Battles'
  }),
  winner: one(clans, {
    fields: [clanBattles.winnerId],
    references: [clans.id],
    relationName: 'battleWins'
  }),
  participants: many(clanBattleParticipants),
}));

export const clanBattleParticipantsRelations = relations(clanBattleParticipants, ({ one }) => ({
  battle: one(clanBattles, {
    fields: [clanBattleParticipants.battleId],
    references: [clanBattles.id]
  }),
  user: one(users, {
    fields: [clanBattleParticipants.userId],
    references: [users.id]
  }),
  clan: one(clans, {
    fields: [clanBattleParticipants.clanId],
    references: [clans.id]
  }),
}));