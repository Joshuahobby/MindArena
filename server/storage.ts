import { db } from './db';
import { eq, and, sql, desc, asc, or, ne, gt, gte, lt, lte, isNull, inArray } from 'drizzle-orm';
import {
  users,
  clans,
  clanRoles,
  clanMemberships,
  clanInvitations,
  clanBattles,
  clanBattleParticipants,
  type User,
  type InsertUser,
  type Clan,
  type InsertClan,
  type ClanRole,
  type InsertClanRole,
  type ClanMembership,
  type InsertClanMembership,
  type ClanInvitation,
  type InsertClanInvitation,
  type ClanBattle,
  type InsertClanBattle,
  type ClanBattleParticipant,
  type InsertClanBattleParticipant
} from '../shared/schema';

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, userUpdate: Partial<User>): Promise<User>;
  
  // Clan methods
  createClan(insertClan: InsertClan): Promise<Clan>;
  getClan(id: number): Promise<Clan | undefined>;
  getClanByName(name: string): Promise<Clan | undefined>;
  getClanByInviteCode(inviteCode: string): Promise<Clan | undefined>;
  updateClan(id: number, clanUpdate: Partial<Clan>): Promise<Clan>;
  deleteClan(id: number): Promise<void>;
  listClans(limit?: number, offset?: number): Promise<Clan[]>;
  searchClans(query: string, limit?: number, offset?: number): Promise<Clan[]>;
  
  // Clan roles methods
  createClanRole(insertRole: InsertClanRole): Promise<ClanRole>;
  getClanRole(id: number): Promise<ClanRole | undefined>;
  getClanRolesByName(clanId: number, name: string): Promise<ClanRole | undefined>;
  getClanRoles(clanId: number): Promise<ClanRole[]>;
  updateClanRole(id: number, roleUpdate: Partial<ClanRole>): Promise<ClanRole>;
  deleteClanRole(id: number): Promise<void>;
  
  // Clan membership methods
  addUserToClan(insertMembership: InsertClanMembership): Promise<ClanMembership>;
  getMembership(userId: number, clanId: number): Promise<ClanMembership | undefined>;
  getClanMembers(clanId: number): Promise<User[]>;
  getUserClans(userId: number): Promise<Clan[]>;
  updateMembership(userId: number, clanId: number, update: Partial<ClanMembership>): Promise<ClanMembership>;
  removeUserFromClan(userId: number, clanId: number): Promise<void>;
  
  // Clan invitation methods
  createInvitation(insertInvitation: InsertClanInvitation): Promise<ClanInvitation>;
  getInvitation(id: number): Promise<ClanInvitation | undefined>;
  getUserInvitations(userId: number): Promise<ClanInvitation[]>;
  getClanInvitations(clanId: number): Promise<ClanInvitation[]>;
  updateInvitation(id: number, update: Partial<ClanInvitation>): Promise<ClanInvitation>;
  deleteInvitation(id: number): Promise<void>;
  
  // Clan battle methods
  createClanBattle(insertBattle: InsertClanBattle): Promise<ClanBattle>;
  getClanBattle(id: number): Promise<ClanBattle | undefined>;
  getClanBattles(clanId: number): Promise<ClanBattle[]>;
  updateClanBattle(id: number, update: Partial<ClanBattle>): Promise<ClanBattle>;
  deleteClanBattle(id: number): Promise<void>;
  
  // Clan battle participant methods
  addBattleParticipant(insertParticipant: InsertClanBattleParticipant): Promise<ClanBattleParticipant>;
  getBattleParticipants(battleId: number): Promise<ClanBattleParticipant[]>;
  updateBattleParticipant(id: number, update: Partial<ClanBattleParticipant>): Promise<ClanBattleParticipant>;
  removeBattleParticipant(id: number): Promise<void>;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.userId, firebaseId));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(userUpdate).where(eq(users.id, id)).returning();
    return user;
  }
  
  // Clan methods
  async createClan(insertClan: InsertClan): Promise<Clan> {
    const [clan] = await db.insert(clans).values(insertClan).returning();
    return clan;
  }
  
  async getClan(id: number): Promise<Clan | undefined> {
    const [clan] = await db.select().from(clans).where(eq(clans.id, id));
    return clan;
  }
  
  async getClanByName(name: string): Promise<Clan | undefined> {
    const [clan] = await db.select().from(clans).where(eq(clans.name, name));
    return clan;
  }
  
  async getClanByInviteCode(inviteCode: string): Promise<Clan | undefined> {
    const [clan] = await db.select().from(clans).where(eq(clans.inviteCode, inviteCode));
    return clan;
  }
  
  async updateClan(id: number, clanUpdate: Partial<Clan>): Promise<Clan> {
    const [clan] = await db.update(clans).set(clanUpdate).where(eq(clans.id, id)).returning();
    return clan;
  }
  
  async deleteClan(id: number): Promise<void> {
    await db.delete(clans).where(eq(clans.id, id));
  }
  
  async listClans(limit: number = 10, offset: number = 0): Promise<Clan[]> {
    return await db.select().from(clans).limit(limit).offset(offset);
  }
  
  async searchClans(query: string, limit: number = 10, offset: number = 0): Promise<Clan[]> {
    return await db.select().from(clans)
      .where(sql`${clans.name} ILIKE ${`%${query}%`}`)
      .limit(limit)
      .offset(offset);
  }
  
  // Clan roles methods
  async createClanRole(insertRole: InsertClanRole): Promise<ClanRole> {
    const [role] = await db.insert(clanRoles).values(insertRole).returning();
    return role;
  }
  
  async getClanRole(id: number): Promise<ClanRole | undefined> {
    const [role] = await db.select().from(clanRoles).where(eq(clanRoles.id, id));
    return role;
  }
  
  async getClanRolesByName(clanId: number, name: string): Promise<ClanRole | undefined> {
    const [role] = await db.select().from(clanRoles)
      .where(and(
        eq(clanRoles.clanId, clanId),
        eq(clanRoles.name, name)
      ));
    return role;
  }
  
  async getClanRoles(clanId: number): Promise<ClanRole[]> {
    return await db.select().from(clanRoles).where(eq(clanRoles.clanId, clanId));
  }
  
  async updateClanRole(id: number, roleUpdate: Partial<ClanRole>): Promise<ClanRole> {
    const [role] = await db.update(clanRoles)
      .set(roleUpdate)
      .where(eq(clanRoles.id, id))
      .returning();
    return role;
  }
  
  async deleteClanRole(id: number): Promise<void> {
    await db.delete(clanRoles).where(eq(clanRoles.id, id));
  }
  
  // Clan membership methods
  async addUserToClan(insertMembership: InsertClanMembership): Promise<ClanMembership> {
    const [membership] = await db.insert(clanMemberships)
      .values(insertMembership)
      .returning();
    
    // Increment clan member count
    await db.update(clans)
      .set({ memberCount: sql`${clans.memberCount} + 1` })
      .where(eq(clans.id, insertMembership.clanId));
      
    return membership;
  }
  
  async getMembership(userId: number, clanId: number): Promise<ClanMembership | undefined> {
    const [membership] = await db.select().from(clanMemberships)
      .where(and(
        eq(clanMemberships.userId, userId),
        eq(clanMemberships.clanId, clanId)
      ));
    return membership;
  }
  
  async getClanMembers(clanId: number): Promise<User[]> {
    const memberships = await db.select({
      userId: clanMemberships.userId
    })
    .from(clanMemberships)
    .where(eq(clanMemberships.clanId, clanId));
    
    if (memberships.length === 0) {
      return [];
    }
    
    const userIds = memberships.map(m => m.userId);
    return await db.select().from(users)
      .where(inArray(users.id, userIds));
  }
  
  async getUserClans(userId: number): Promise<Clan[]> {
    const memberships = await db.select({
      clanId: clanMemberships.clanId
    })
    .from(clanMemberships)
    .where(eq(clanMemberships.userId, userId));
    
    if (memberships.length === 0) {
      return [];
    }
    
    const clanIds = memberships.map(m => m.clanId);
    return await db.select().from(clans)
      .where(inArray(clans.id, clanIds));
  }
  
  async updateMembership(userId: number, clanId: number, update: Partial<ClanMembership>): Promise<ClanMembership> {
    const [membership] = await db.update(clanMemberships)
      .set(update)
      .where(and(
        eq(clanMemberships.userId, userId),
        eq(clanMemberships.clanId, clanId)
      ))
      .returning();
    return membership;
  }
  
  async removeUserFromClan(userId: number, clanId: number): Promise<void> {
    await db.delete(clanMemberships)
      .where(and(
        eq(clanMemberships.userId, userId),
        eq(clanMemberships.clanId, clanId)
      ));
    
    // Decrement clan member count
    await db.update(clans)
      .set({ memberCount: sql`${clans.memberCount} - 1` })
      .where(eq(clans.id, clanId));
  }
  
  // Clan invitation methods
  async createInvitation(insertInvitation: InsertClanInvitation): Promise<ClanInvitation> {
    const [invitation] = await db.insert(clanInvitations)
      .values(insertInvitation)
      .returning();
    return invitation;
  }
  
  async getInvitation(id: number): Promise<ClanInvitation | undefined> {
    const [invitation] = await db.select().from(clanInvitations)
      .where(eq(clanInvitations.id, id));
    return invitation;
  }
  
  async getUserInvitations(userId: number): Promise<ClanInvitation[]> {
    return await db.select().from(clanInvitations)
      .where(and(
        eq(clanInvitations.invitedUserId, userId),
        eq(clanInvitations.status, 'pending')
      ));
  }
  
  async getClanInvitations(clanId: number): Promise<ClanInvitation[]> {
    return await db.select().from(clanInvitations)
      .where(and(
        eq(clanInvitations.clanId, clanId),
        eq(clanInvitations.status, 'pending')
      ));
  }
  
  async updateInvitation(id: number, update: Partial<ClanInvitation>): Promise<ClanInvitation> {
    const [invitation] = await db.update(clanInvitations)
      .set(update)
      .where(eq(clanInvitations.id, id))
      .returning();
    return invitation;
  }
  
  async deleteInvitation(id: number): Promise<void> {
    await db.delete(clanInvitations).where(eq(clanInvitations.id, id));
  }
  
  // Clan battle methods
  async createClanBattle(insertBattle: InsertClanBattle): Promise<ClanBattle> {
    const [battle] = await db.insert(clanBattles)
      .values(insertBattle)
      .returning();
    return battle;
  }
  
  async getClanBattle(id: number): Promise<ClanBattle | undefined> {
    const [battle] = await db.select().from(clanBattles)
      .where(eq(clanBattles.id, id));
    return battle;
  }
  
  async getClanBattles(clanId: number): Promise<ClanBattle[]> {
    return await db.select().from(clanBattles)
      .where(or(
        eq(clanBattles.clan1Id, clanId),
        eq(clanBattles.clan2Id, clanId)
      ))
      .orderBy(desc(clanBattles.startTime));
  }
  
  async updateClanBattle(id: number, update: Partial<ClanBattle>): Promise<ClanBattle> {
    const [battle] = await db.update(clanBattles)
      .set(update)
      .where(eq(clanBattles.id, id))
      .returning();
    return battle;
  }
  
  async deleteClanBattle(id: number): Promise<void> {
    await db.delete(clanBattles).where(eq(clanBattles.id, id));
  }
  
  // Clan battle participant methods
  async addBattleParticipant(insertParticipant: InsertClanBattleParticipant): Promise<ClanBattleParticipant> {
    const [participant] = await db.insert(clanBattleParticipants)
      .values(insertParticipant)
      .returning();
    return participant;
  }
  
  async getBattleParticipants(battleId: number): Promise<ClanBattleParticipant[]> {
    return await db.select().from(clanBattleParticipants)
      .where(eq(clanBattleParticipants.battleId, battleId));
  }
  
  async updateBattleParticipant(id: number, update: Partial<ClanBattleParticipant>): Promise<ClanBattleParticipant> {
    const [participant] = await db.update(clanBattleParticipants)
      .set(update)
      .where(eq(clanBattleParticipants.id, id))
      .returning();
    return participant;
  }
  
  async removeBattleParticipant(id: number): Promise<void> {
    await db.delete(clanBattleParticipants)
      .where(eq(clanBattleParticipants.id, id));
  }
}

// Export the storage instance
export const storage = new DatabaseStorage();