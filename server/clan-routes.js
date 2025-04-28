const express = require('express');
// Create a mock storage for now until we fully implement the database integration
const storage = {
  getUserByFirebaseId: async (firebaseId) => {
    // Mock implementation
    return { id: 1, userId: firebaseId, username: 'User1', clanId: null };
  },
  getUserByUsername: async (username) => {
    // Mock implementation
    return { id: 2, userId: 'user2', username, clanId: null };
  },
  getClanByName: async (name) => {
    // Mock implementation
    return null; // No clan with this name exists yet
  },
  getClanByInviteCode: async (inviteCode) => {
    // Mock implementation
    return { id: 1, name: 'TestClan', inviteCode, memberCount: 5, maxMembers: 50, isPublic: true };
  },
  getClan: async (id) => {
    // Mock implementation
    return { id, name: `Clan${id}`, memberCount: 5, inviteCode: 'ABC123', founderUserId: 1, maxMembers: 50 };
  },
  createClan: async (clanData) => {
    // Mock implementation
    return { id: 1, ...clanData, memberCount: 1, createdAt: new Date() };
  },
  createClanRole: async (roleData) => {
    // Mock implementation
    return { id: roleData.name === 'Owner' ? 1 : roleData.name === 'Officer' ? 2 : 3, ...roleData };
  },
  getClanRole: async (roleId) => {
    // Mock implementation
    return { 
      id: roleId, 
      name: roleId === 1 ? 'Owner' : roleId === 2 ? 'Officer' : 'Member',
      permissions: {
        invite: roleId === 1 || roleId === 2,
        kick: roleId === 1 || roleId === 2, 
        promote: roleId === 1,
        startWar: roleId === 1 || roleId === 2,
        editClan: roleId === 1,
        manageTreasury: roleId === 1
      }
    };
  },
  getClanRolesByName: async (clanId, name) => {
    // Mock implementation
    return [{ 
      id: name === 'Owner' ? 1 : name === 'Officer' ? 2 : 3, 
      name, 
      clanId,
      permissions: {
        invite: name === 'Owner' || name === 'Officer',
        kick: name === 'Owner' || name === 'Officer',
        promote: name === 'Owner',
        startWar: name === 'Owner' || name === 'Officer',
        editClan: name === 'Owner',
        manageTreasury: name === 'Owner'
      }
    }];
  },
  addUserToClan: async (membershipData) => {
    // Mock implementation
    return { ...membershipData, joinedAt: new Date() };
  },
  updateUser: async (userId, userData) => {
    // Mock implementation
    return { id: userId, ...userData };
  },
  updateClan: async (id, update) => {
    // Mock implementation
    return { id, ...update };
  },
  deleteClan: async (id) => {
    // Mock implementation
    return true;
  },
  getClanMembers: async (clanId) => {
    // Mock implementation
    return [
      { id: 1, username: 'User1', clanId },
      { id: 2, username: 'User2', clanId }
    ];
  },
  getMembership: async (userId, clanId) => {
    // Mock implementation 
    return { userId, clanId, roleId: 1 };
  },
  removeUserFromClan: async (userId, clanId) => {
    // Mock implementation
    return true;
  },
  getInvitation: async () => {
    // Mock implementation
    return null;
  },
  updateInvitation: async (id, update) => {
    // Mock implementation
    return { id, ...update };
  },
  listClans: async (limit = 10, offset = 0) => {
    // Mock implementation
    return [
      { id: 1, name: 'Clan1', memberCount: 10, description: 'First clan', createdAt: new Date() },
      { id: 2, name: 'Clan2', memberCount: 5, description: 'Second clan', createdAt: new Date() }
    ];
  },
  searchClans: async (query, limit = 10, offset = 0) => {
    // Mock implementation
    return [
      { id: 1, name: 'Clan1', memberCount: 10, description: 'First clan', createdAt: new Date() }
    ];
  },
  getUser: async (id) => {
    // Mock implementation
    return { id, username: `User${id}`, clanId: 1 };
  },
  createInvitation: async (invitationData) => {
    // Mock implementation
    return { 
      id: 1, 
      ...invitationData, 
      status: 'pending', 
      createdAt: new Date() 
    };
  },
  getUserInvitations: async (userId) => {
    // Mock implementation
    return [
      { 
        id: 1, 
        clanId: 1, 
        invitedUserId: userId, 
        invitedByUserId: 2, 
        status: 'pending', 
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7*24*60*60*1000) 
      }
    ];
  },
  getClanBattles: async (clanId) => {
    // Mock implementation
    return [
      { 
        id: 1, 
        clan1Id: clanId, 
        clan2Id: clanId === 1 ? 2 : 1, 
        startTime: new Date(Date.now() + 24*60*60*1000),
        status: 'scheduled'
      }
    ];
  },
  createClanBattle: async (battleData) => {
    // Mock implementation
    return { 
      id: 1, 
      ...battleData, 
      createdAt: new Date()
    };
  },
  getClanBattle: async (id) => {
    // Mock implementation
    return { 
      id, 
      clan1Id: 1, 
      clan2Id: 2, 
      startTime: new Date(Date.now() + 24*60*60*1000),
      status: 'scheduled'
    };
  },
  getBattleParticipants: async (battleId) => {
    // Mock implementation
    return [
      { id: 1, battleId, userId: 1, clanId: 1 },
      { id: 2, battleId, userId: 2, clanId: 2 }
    ];
  },
  addBattleParticipant: async (participantData) => {
    // Mock implementation
    return { 
      id: 3, 
      ...participantData, 
      joinedAt: new Date()
    };
  }
};

const router = express.Router();

// Helper function to generate unique invite codes
function generateInviteCode(length = 8) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }
  
  next();
}

// Middleware to check if user is a clan member
async function isClanMember(req, res, next) {
  const { userId } = req.body;
  const clanId = parseInt(req.params.clanId);
  
  if (!userId || isNaN(clanId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid request parameters' 
    });
  }
  
  try {
    // Get user by Firebase ID
    const user = await storage.getUserByFirebaseId(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Check if user is a member of the clan
    const membership = await storage.getMembership(user.id, clanId);
    if (!membership) {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not a member of this clan' 
      });
    }
    
    // Add membership and user to request
    req.user = user;
    req.membership = membership;
    next();
  } catch (error) {
    console.error('Error checking clan membership:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}

// Middleware to check if user has clan role permissions
function hasPermission(permission) {
  return async (req, res, next) => {
    const { membership } = req;
    
    if (!membership || !membership.roleId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have the required permissions' 
      });
    }
    
    try {
      // Get the role
      const role = await storage.getClanRole(membership.roleId);
      if (!role || !role.permissions || !role.permissions[permission]) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have the required permissions' 
        });
      }
      
      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  };
}

// ===== CLAN ROUTES =====

// Create a new clan
router.post('/create', isAuthenticated, async (req, res) => {
  const { userId, name, description, logo } = req.body;
  
  if (!name) {
    return res.status(400).json({ 
      success: false, 
      error: 'Clan name is required' 
    });
  }
  
  try {
    // Get user by Firebase ID
    const user = await storage.getUserByFirebaseId(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Check if user is already in a clan
    if (user.clanId) {
      return res.status(400).json({ 
        success: false, 
        error: 'You are already a member of a clan' 
      });
    }
    
    // Check if clan name is already taken
    const existingClan = await storage.getClanByName(name);
    if (existingClan) {
      return res.status(400).json({ 
        success: false, 
        error: 'Clan name is already taken' 
      });
    }
    
    // Generate a unique invite code
    const inviteCode = generateInviteCode();
    
    // Create clan
    const clan = await storage.createClan({
      name,
      description: description || '',
      logo: logo || '',
      founderUserId: user.id,
      inviteCode
    });
    
    // Create default roles for the clan
    const ownerRole = await storage.createClanRole({
      name: 'Owner',
      clanId: clan.id,
      permissions: {
        invite: true,
        kick: true,
        promote: true,
        startWar: true,
        editClan: true,
        manageTreasury: true
      }
    });
    
    const officerRole = await storage.createClanRole({
      name: 'Officer',
      clanId: clan.id,
      permissions: {
        invite: true,
        kick: true,
        promote: false,
        startWar: true,
        editClan: false,
        manageTreasury: false
      }
    });
    
    const memberRole = await storage.createClanRole({
      name: 'Member',
      clanId: clan.id,
      permissions: {
        invite: false,
        kick: false,
        promote: false,
        startWar: false,
        editClan: false,
        manageTreasury: false
      }
    });
    
    // Add creator to clan with owner role
    await storage.addUserToClan({
      userId: user.id,
      clanId: clan.id,
      roleId: ownerRole.id
    });
    
    // Update user with clan ID
    await storage.updateUser(user.id, { clanId: clan.id });
    
    res.json({ 
      success: true, 
      clan,
      roles: [ownerRole, officerRole, memberRole]
    });
  } catch (error) {
    console.error('Error creating clan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create clan' 
    });
  }
});

// Get clan by invite code - Specific route first to avoid parameter conflict
router.get('/invite/:inviteCode', async (req, res) => {
  const { inviteCode } = req.params;
  
  try {
    const clan = await storage.getClanByInviteCode(inviteCode);
    if (!clan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid invite code' 
      });
    }
    
    res.json({ 
      success: true, 
      clan 
    });
  } catch (error) {
    console.error('Error getting clan by invite code:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get clan' 
    });
  }
});

// Get clan by ID
router.get('/:clanId', async (req, res) => {
  const clanId = parseInt(req.params.clanId);
  
  if (isNaN(clanId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid clan ID' 
    });
  }
  
  try {
    const clan = await storage.getClan(clanId);
    if (!clan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Clan not found' 
      });
    }
    
    res.json({ 
      success: true, 
      clan 
    });
  } catch (error) {
    console.error('Error getting clan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get clan' 
    });
  }
});

// List all clans with pagination and search
router.get('/', async (req, res) => {
  const { search, limit = 10, offset = 0 } = req.query;
  
  try {
    let clans;
    if (search) {
      clans = await storage.searchClans(search, parseInt(limit), parseInt(offset));
    } else {
      clans = await storage.listClans(parseInt(limit), parseInt(offset));
    }
    
    res.json({ 
      success: true, 
      clans 
    });
  } catch (error) {
    console.error('Error listing clans:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list clans' 
    });
  }
});

// Update clan
router.put('/:clanId', isAuthenticated, isClanMember, hasPermission('editClan'), async (req, res) => {
  const clanId = parseInt(req.params.clanId);
  const { name, description, logo, banner, isPublic, maxMembers } = req.body;
  
  try {
    // Check if new name is already taken
    if (name) {
      const existingClan = await storage.getClanByName(name);
      if (existingClan && existingClan.id !== clanId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Clan name is already taken' 
        });
      }
    }
    
    // Update clan
    const clan = await storage.updateClan(clanId, {
      name,
      description,
      logo,
      banner,
      isPublic,
      maxMembers
    });
    
    res.json({ 
      success: true, 
      clan 
    });
  } catch (error) {
    console.error('Error updating clan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update clan' 
    });
  }
});

// Delete clan
router.delete('/:clanId', isAuthenticated, isClanMember, hasPermission('editClan'), async (req, res) => {
  const clanId = parseInt(req.params.clanId);
  const { user } = req;
  
  try {
    // Check if user is the founder
    const clan = await storage.getClan(clanId);
    if (!clan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Clan not found' 
      });
    }
    
    if (clan.founderUserId !== user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the clan founder can delete the clan' 
      });
    }
    
    // Get clan members
    const members = await storage.getClanMembers(clanId);
    
    // Update all members to remove clan ID
    for (const member of members) {
      await storage.updateUser(member.id, { clanId: null });
    }
    
    // Delete clan
    await storage.deleteClan(clanId);
    
    res.json({ 
      success: true, 
      message: 'Clan deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting clan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete clan' 
    });
  }
});

// Join clan with invite code
router.post('/join', isAuthenticated, async (req, res) => {
  const { userId, inviteCode } = req.body;
  
  if (!inviteCode) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invite code is required' 
    });
  }
  
  try {
    // Get user by Firebase ID
    const user = await storage.getUserByFirebaseId(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Check if user is already in a clan
    if (user.clanId) {
      return res.status(400).json({ 
        success: false, 
        error: 'You are already a member of a clan' 
      });
    }
    
    // Get clan by invite code
    const clan = await storage.getClanByInviteCode(inviteCode);
    if (!clan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid invite code' 
      });
    }
    
    // Check if clan is full
    if (clan.memberCount >= clan.maxMembers) {
      return res.status(400).json({ 
        success: false, 
        error: 'Clan is full' 
      });
    }
    
    // Check if clan is public or user has an invitation
    if (!clan.isPublic) {
      const invitation = await storage.getInvitation();
      
      if (!invitation) {
        return res.status(403).json({ 
          success: false, 
          error: 'This clan requires an invitation to join' 
        });
      }
      
      // Update invitation status
      await storage.updateInvitation(invitation.id, { status: 'accepted' });
    }
    
    // Get default member role
    const [memberRole] = await storage.getClanRolesByName(clan.id, 'Member');
    if (!memberRole) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to find default member role' 
      });
    }
    
    // Add user to clan
    await storage.addUserToClan({
      userId: user.id,
      clanId: clan.id,
      roleId: memberRole.id
    });
    
    // Update user with clan ID
    await storage.updateUser(user.id, { clanId: clan.id });
    
    res.json({ 
      success: true, 
      message: 'Successfully joined clan',
      clan
    });
  } catch (error) {
    console.error('Error joining clan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to join clan' 
    });
  }
});

// Leave clan
router.post('/:clanId/leave', isAuthenticated, isClanMember, async (req, res) => {
  const clanId = parseInt(req.params.clanId);
  const { user } = req;
  
  try {
    // Check if user is the founder
    const clan = await storage.getClan(clanId);
    if (clan.founderUserId === user.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Clan founder cannot leave. Transfer ownership or delete the clan instead.' 
      });
    }
    
    // Remove user from clan
    await storage.removeUserFromClan(user.id, clanId);
    
    // Update user to remove clan ID
    await storage.updateUser(user.id, { clanId: null });
    
    res.json({ 
      success: true, 
      message: 'Successfully left clan' 
    });
  } catch (error) {
    console.error('Error leaving clan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to leave clan' 
    });
  }
});

// Get clan members
router.get('/:clanId/members', async (req, res) => {
  const clanId = parseInt(req.params.clanId);
  
  if (isNaN(clanId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid clan ID' 
    });
  }
  
  try {
    const members = await storage.getClanMembers(clanId);
    
    res.json({ 
      success: true, 
      members 
    });
  } catch (error) {
    console.error('Error getting clan members:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get clan members' 
    });
  }
});

// Kick member from clan
router.post('/:clanId/kick/:userId', isAuthenticated, isClanMember, hasPermission('kick'), async (req, res) => {
  const clanId = parseInt(req.params.clanId);
  const targetUserId = parseInt(req.params.userId);
  const { user } = req;
  
  if (isNaN(targetUserId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid user ID' 
    });
  }
  
  try {
    // Get target user
    const targetUser = await storage.getUser(targetUserId);
    if (!targetUser || targetUser.clanId !== clanId) {
      return res.status(404).json({ 
        success: false, 
        error: 'User is not a member of this clan' 
      });
    }
    
    // Check if target is the founder
    const clan = await storage.getClan(clanId);
    if (targetUser.id === clan.founderUserId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Cannot kick the clan founder' 
      });
    }
    
    // Get target's role
    const targetMembership = await storage.getMembership(targetUser.id, clanId);
    if (!targetMembership) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }
    
    const userMembership = req.membership;
    
    // Check if target has a higher role
    if (targetMembership.roleId === 2 && userMembership.roleId === 3) {
      return res.status(403).json({ 
        success: false, 
        error: 'Cannot kick a member with a higher role' 
      });
    }
    
    // Remove user from clan
    await storage.removeUserFromClan(targetUser.id, clanId);
    
    // Update user to remove clan ID
    await storage.updateUser(targetUser.id, { clanId: null });
    
    res.json({ 
      success: true, 
      message: 'Member kicked successfully' 
    });
  } catch (error) {
    console.error('Error kicking member:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to kick member' 
    });
  }
});

// Clan invite routes
router.post('/:clanId/invite', isAuthenticated, isClanMember, hasPermission('invite'), async (req, res) => {
  const clanId = parseInt(req.params.clanId);
  const { username } = req.body;
  const { user } = req;
  
  if (!username) {
    return res.status(400).json({ 
      success: false, 
      error: 'Username is required' 
    });
  }
  
  try {
    // Get target user
    const targetUser = await storage.getUserByUsername(username);
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Check if user is already in a clan
    if (targetUser.clanId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User is already a member of a clan' 
      });
    }
    
    // Check if invitation already exists
    const existingInvitation = await storage.getInvitation();
    
    if (existingInvitation) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invitation already sent' 
      });
    }
    
    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
    
    const invitation = await storage.createInvitation({
      clanId,
      invitedUserId: targetUser.id,
      invitedByUserId: user.id,
      expiresAt
    });
    
    res.json({ 
      success: true, 
      invitation 
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to invite user' 
    });
  }
});

// Get user invitations
router.get('/invitations', isAuthenticated, async (req, res) => {
  const { userId } = req.body;
  
  try {
    // Get user by Firebase ID
    const user = await storage.getUserByFirebaseId(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Get invitations
    const invitations = await storage.getUserInvitations(user.id);
    
    res.json({ 
      success: true, 
      invitations 
    });
  } catch (error) {
    console.error('Error getting invitations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get invitations' 
    });
  }
});

// Process invitation (accept/decline)
router.post('/invitation/:invitationId/:action', isAuthenticated, async (req, res) => {
  const { userId } = req.body;
  const invitationId = parseInt(req.params.invitationId);
  const action = req.params.action;
  
  if (isNaN(invitationId) || (action !== 'accept' && action !== 'decline')) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid parameters' 
    });
  }
  
  try {
    // Get user by Firebase ID
    const user = await storage.getUserByFirebaseId(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Get invitation
    const invitation = await storage.getInvitation(invitationId);
    if (!invitation || invitation.invitedUserId !== user.id || invitation.status !== 'pending') {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid invitation' 
      });
    }
    
    if (action === 'decline') {
      // Update invitation status
      await storage.updateInvitation(invitation.id, { status: 'declined' });
      
      return res.json({ 
        success: true, 
        message: 'Invitation declined' 
      });
    }
    
    // Check if user is already in a clan
    if (user.clanId) {
      return res.status(400).json({ 
        success: false, 
        error: 'You are already a member of a clan' 
      });
    }
    
    // Get clan
    const clan = await storage.getClan(invitation.clanId);
    if (!clan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Clan not found' 
      });
    }
    
    // Check if clan is full
    if (clan.memberCount >= clan.maxMembers) {
      return res.status(400).json({ 
        success: false, 
        error: 'Clan is full' 
      });
    }
    
    // Get default member role
    const [memberRole] = await storage.getClanRolesByName(clan.id, 'Member');
    if (!memberRole) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to find default member role' 
      });
    }
    
    // Add user to clan
    await storage.addUserToClan({
      userId: user.id,
      clanId: clan.id,
      roleId: memberRole.id
    });
    
    // Update user with clan ID
    await storage.updateUser(user.id, { clanId: clan.id });
    
    // Update invitation status
    await storage.updateInvitation(invitation.id, { status: 'accepted' });
    
    res.json({ 
      success: true, 
      message: 'Successfully joined clan',
      clan
    });
  } catch (error) {
    console.error('Error processing invitation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process invitation' 
    });
  }
});

// ===== CLAN BATTLE ROUTES =====

// Start a new clan battle (challenge)
router.post('/battle/challenge/:targetClanId', isAuthenticated, isClanMember, hasPermission('startWar'), async (req, res) => {
  const { clanId } = req.membership;
  const targetClanId = parseInt(req.params.targetClanId);
  const { startTime } = req.body;
  
  if (isNaN(targetClanId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid target clan ID' 
    });
  }
  
  if (!startTime) {
    return res.status(400).json({ 
      success: false, 
      error: 'Start time is required' 
    });
  }
  
  try {
    // Check if clans are different
    if (clanId === targetClanId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot challenge your own clan' 
      });
    }
    
    // Check if target clan exists
    const targetClan = await storage.getClan(targetClanId);
    if (!targetClan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Target clan not found' 
      });
    }
    
    // Check if there's already a scheduled battle between these clans
    const existingBattles = await storage.getClanBattles(clanId);
    const scheduledBattle = existingBattles.find(battle => 
      (battle.clan1Id === clanId && battle.clan2Id === targetClanId ||
       battle.clan1Id === targetClanId && battle.clan2Id === clanId) &&
      battle.status === 'scheduled'
    );
    
    if (scheduledBattle) {
      return res.status(400).json({ 
        success: false, 
        error: 'There is already a scheduled battle between these clans' 
      });
    }
    
    // Create the clan battle
    const battle = await storage.createClanBattle({
      clan1Id: clanId,
      clan2Id: targetClanId,
      startTime: new Date(startTime),
      status: 'scheduled'
    });
    
    res.json({ 
      success: true, 
      battle 
    });
  } catch (error) {
    console.error('Error creating clan battle:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create clan battle' 
    });
  }
});

// Get clan battles
router.get('/:clanId/battles', async (req, res) => {
  const clanId = parseInt(req.params.clanId);
  
  if (isNaN(clanId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid clan ID' 
    });
  }
  
  try {
    const battles = await storage.getClanBattles(clanId);
    
    res.json({ 
      success: true, 
      battles 
    });
  } catch (error) {
    console.error('Error getting clan battles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get clan battles' 
    });
  }
});

// Sign up for a clan battle
router.post('/battle/:battleId/signup', isAuthenticated, isClanMember, async (req, res) => {
  const battleId = parseInt(req.params.battleId);
  const { user, membership } = req;
  
  if (isNaN(battleId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid battle ID' 
    });
  }
  
  try {
    // Get battle
    const battle = await storage.getClanBattle(battleId);
    if (!battle) {
      return res.status(404).json({ 
        success: false, 
        error: 'Battle not found' 
      });
    }
    
    // Check if user's clan is participating
    if (battle.clan1Id !== membership.clanId && battle.clan2Id !== membership.clanId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Your clan is not participating in this battle' 
      });
    }
    
    // Check if battle is still in scheduled status
    if (battle.status !== 'scheduled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot sign up for a battle that has already started or ended' 
      });
    }
    
    // Check if user is already signed up
    const participants = await storage.getBattleParticipants(battleId);
    const isAlreadySignedUp = participants.some(p => p.userId === user.id);
    
    if (isAlreadySignedUp) {
      return res.status(400).json({ 
        success: false, 
        error: 'You are already signed up for this battle' 
      });
    }
    
    // Add user as participant
    const participant = await storage.addBattleParticipant({
      battleId,
      userId: user.id,
      clanId: membership.clanId
    });
    
    res.json({ 
      success: true, 
      participant 
    });
  } catch (error) {
    console.error('Error signing up for battle:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sign up for battle' 
    });
  }
});

// Get battle participants
router.get('/battle/:battleId/participants', async (req, res) => {
  const battleId = parseInt(req.params.battleId);
  
  if (isNaN(battleId)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid battle ID' 
    });
  }
  
  try {
    const participants = await storage.getBattleParticipants(battleId);
    
    res.json({ 
      success: true, 
      participants 
    });
  } catch (error) {
    console.error('Error getting battle participants:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get battle participants' 
    });
  }
});

module.exports = router;