import { interests, users, userInterests, connections, messages, zones, type User, type InsertUser, type Interest, type UserInterest, type Connection, type Message, type UpdateLocation, type Zone, type InsertZone } from "@shared/schema";
import session from "express-session";
import { Store } from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Helper to calculate distance between two points in kilometers
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  // Convert to miles (1 km = 0.621371 miles)
  return distance * 0.621371;
}

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateUserLocation(id: number, location: UpdateLocation): Promise<User | undefined>;
  getNearbyUsers(userId: number, maxDistance: number): Promise<(User & { distance: number })[]>;
  
  // Interests
  getInterests(): Promise<Interest[]>;
  createInterest(interest: { name: string }): Promise<Interest>;
  getUserInterests(userId: number): Promise<Interest[]>;
  addUserInterest(userId: number, interestId: number): Promise<UserInterest>;
  removeUserInterest(userId: number, interestId: number): Promise<void>;
  
  // Connections
  getConnection(requesterId: number, recipientId: number): Promise<Connection | undefined>;
  createConnection(connection: { requesterId: number, recipientId: number, status: string }): Promise<Connection>;
  updateConnectionStatus(id: number, status: string): Promise<Connection | undefined>;
  getUserConnections(userId: number): Promise<(Connection & { user: User })[]>;
  
  // Messages
  getMessages(userId1: number, userId2: number): Promise<Message[]>;
  createMessage(message: { senderId: number, recipientId: number, content: string }): Promise<Message>;
  markMessagesAsRead(senderId: number, recipientId: number): Promise<void>;
  getConversations(userId: number): Promise<{ user: User, lastMessage: Message }[]>;
  
  // Zones
  getZones(userId: number, city: string): Promise<Zone[]>;
  getZoneById(id: number): Promise<Zone | undefined>;
  createZone(zone: Omit<InsertZone, 'createdBy'> & { createdBy: number }): Promise<Zone>;
  deleteZone(id: number): Promise<void>;
  joinZone(zoneId: number, userId: number): Promise<Zone | undefined>;
  leaveZone(zoneId: number, userId: number): Promise<Zone | undefined>;
  removeParticipant(zoneId: number, participantId: number, requesterId: number): Promise<Zone | undefined>;
  
  // Session store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private interests: Map<number, Interest>;
  private userInterests: Map<number, UserInterest[]>;
  private connections: Map<number, Connection>;
  private messages: Map<number, Message>;
  private zones: Map<number, Zone>;
  
  sessionStore: Store;
  currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.interests = new Map();
    this.userInterests = new Map();
    this.connections = new Map();
    this.messages = new Map();
    this.zones = new Map();
    
    this.currentId = {
      users: 1,
      interests: 1,
      userInterests: 1,
      connections: 1,
      messages: 1,
      zones: 1
    };
    
    // Initialize memory store with more robust options
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Once per day cleanup of expired sessions
      stale: false, // Don't delete stale sessions
      ttl: 7 * 24 * 60 * 60 * 1000, // Match the cookie maxAge (1 week)
    });
    
    // Seed some interests
    const defaultInterests = [
      "Cycling", "Photography", "Yoga", "Travel", "Art", "Music", 
      "Running", "Reading", "Cooking", "Hiking", "Gaming", "Technology",
      "Coffee", "Cinema", "Dancing", "Writing", "Fitness", "Networking"
    ];
    
    defaultInterests.forEach((name) => {
      this.createInterest({ name });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      gender: insertUser.gender || null, // Ensure gender is not undefined
      bio: insertUser.bio || null,
      profession: insertUser.profession || null,
      avatar: insertUser.avatar || null,
      coverImage: insertUser.coverImage || null,
      education: insertUser.education || null,
      experience: insertUser.experience || null,
      hobbies: insertUser.hobbies || null,
      latitude: insertUser.latitude || null,
      longitude: insertUser.longitude || null,
      lastActive: now, 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserLocation(id: number, location: UpdateLocation): Promise<User | undefined> {
    return this.updateUser(id, {
      latitude: location.latitude,
      longitude: location.longitude,
      lastActive: new Date()
    });
  }
  
  async getNearbyUsers(userId: number, maxDistance: number): Promise<(User & { distance: number })[]> {
    const user = await this.getUser(userId);
    if (!user || !user.latitude || !user.longitude) return [];
    
    const nearbyUsers = Array.from(this.users.values())
      .filter(otherUser => {
        // Filter out the current user and users without location
        return otherUser.id !== userId && 
               otherUser.latitude !== null && 
               otherUser.longitude !== null;
      })
      .map(otherUser => {
        // Calculate distance
        const distance = calculateDistance(
          user.latitude!,
          user.longitude!,
          otherUser.latitude!,
          otherUser.longitude!
        );
        
        return { ...otherUser, distance };
      })
      .filter(otherUser => otherUser.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
    
    return nearbyUsers;
  }
  
  // Interest methods
  async getInterests(): Promise<Interest[]> {
    return Array.from(this.interests.values());
  }
  
  async createInterest(interest: { name: string }): Promise<Interest> {
    const id = this.currentId.interests++;
    const newInterest: Interest = { id, name: interest.name };
    this.interests.set(id, newInterest);
    return newInterest;
  }
  
  async getUserInterests(userId: number): Promise<Interest[]> {
    const userInterestsList = this.userInterests.get(userId) || [];
    return Promise.all(
      userInterestsList.map(ui => this.interests.get(ui.interestId)!)
    );
  }
  
  async addUserInterest(userId: number, interestId: number): Promise<UserInterest> {
    const id = this.currentId.userInterests++;
    const userInterest: UserInterest = { id, userId, interestId };
    
    if (!this.userInterests.has(userId)) {
      this.userInterests.set(userId, []);
    }
    
    this.userInterests.get(userId)!.push(userInterest);
    return userInterest;
  }
  
  async removeUserInterest(userId: number, interestId: number): Promise<void> {
    const userInterestsList = this.userInterests.get(userId);
    if (!userInterestsList) return;
    
    const updatedInterests = userInterestsList.filter(ui => ui.interestId !== interestId);
    this.userInterests.set(userId, updatedInterests);
  }
  
  // Connection methods
  async getConnection(requesterId: number, recipientId: number): Promise<Connection | undefined> {
    return Array.from(this.connections.values()).find(
      conn => (conn.requesterId === requesterId && conn.recipientId === recipientId) || 
              (conn.requesterId === recipientId && conn.recipientId === requesterId)
    );
  }
  
  async createConnection(connection: { requesterId: number, recipientId: number, status: string }): Promise<Connection> {
    const id = this.currentId.connections++;
    const now = new Date();
    const newConnection: Connection = { ...connection, id, createdAt: now };
    this.connections.set(id, newConnection);
    return newConnection;
  }
  
  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;
    
    const updatedConnection = { ...connection, status };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  async getUserConnections(userId: number): Promise<(Connection & { user: User })[]> {
    return Array.from(this.connections.values())
      .filter(conn => (conn.requesterId === userId || conn.recipientId === userId) && conn.status === "accepted")
      .map(conn => {
        const otherUserId = conn.requesterId === userId ? conn.recipientId : conn.requesterId;
        const user = this.users.get(otherUserId);
        return { ...conn, user: user! };
      });
  }
  
  // Message methods
  async getMessages(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === userId1 && msg.recipientId === userId2) || 
        (msg.senderId === userId2 && msg.recipientId === userId1)
      )
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeA - timeB;
      });
  }
  
  async createMessage(message: { senderId: number, recipientId: number, content: string }): Promise<Message> {
    const id = this.currentId.messages++;
    const now = new Date();
    const newMessage: Message = { ...message, id, isRead: false, createdAt: now };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessagesAsRead(senderId: number, recipientId: number): Promise<void> {
    Array.from(this.messages.values())
      .filter(msg => msg.senderId === senderId && msg.recipientId === recipientId && !msg.isRead)
      .forEach(msg => {
        const updatedMsg = { ...msg, isRead: true };
        this.messages.set(msg.id, updatedMsg);
      });
  }
  
  async getConversations(userId: number): Promise<{ user: User, lastMessage: Message }[]> {
    // Get all unique users that the current user has messaged with
    const conversationUsers = new Set<number>();
    
    Array.from(this.messages.values())
      .filter(msg => msg.senderId === userId || msg.recipientId === userId)
      .forEach(msg => {
        const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
        conversationUsers.add(otherUserId);
      });
    
    // For each user, get the latest message
    const conversations = Array.from(conversationUsers).map(otherUserId => {
      const messages = Array.from(this.messages.values())
        .filter(msg => 
          (msg.senderId === userId && msg.recipientId === otherUserId) || 
          (msg.senderId === otherUserId && msg.recipientId === userId)
        )
        .sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA;
        });
      
      const lastMessage = messages[0];
      const user = this.users.get(otherUserId)!;
      
      return { user, lastMessage };
    });
    
    // Sort by latest message
    return conversations.sort((a, b) => {
      const timeA = a.lastMessage.createdAt instanceof Date ? a.lastMessage.createdAt.getTime() : 0;
      const timeB = b.lastMessage.createdAt instanceof Date ? b.lastMessage.createdAt.getTime() : 0;
      return timeB - timeA;
    });
  }
  
  // Zone methods
  async getZones(userId: number, city: string): Promise<Zone[]> {
    // Get all zones, filtered by city if provided
    return Array.from(this.zones.values())
      .filter(zone => !city || zone.city.toLowerCase() === city.toLowerCase())
      .sort((a, b) => {
        // Sort by date (most recent first)
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime(); // Reversed to show newest first
      });
  }
  
  async getZoneById(id: number): Promise<Zone | undefined> {
    return this.zones.get(id);
  }
  
  async createZone(zone: Omit<InsertZone, 'createdBy'> & { createdBy: number }): Promise<Zone> {
    const id = this.currentId.zones++;
    const now = new Date();
    // Initialize with empty participants array and ensure participantLimit is not undefined
    const newZone: Zone = { 
      ...zone, 
      id, 
      createdAt: now,
      participants: [],
      participantLimit: zone.participantLimit ?? null
    };
    this.zones.set(id, newZone);
    return newZone;
  }
  
  async deleteZone(id: number): Promise<void> {
    this.zones.delete(id);
  }
  
  async joinZone(zoneId: number, userId: number): Promise<Zone | undefined> {
    const zone = await this.getZoneById(zoneId);
    if (!zone) return undefined;
    
    // Check if participant limit is reached
    if (zone.participantLimit !== null && zone.participantLimit > 0 && zone.participants.length >= zone.participantLimit) {
      // Create a custom error object with participantLimitReached flag
      const error: any = new Error('Participant limit reached');
      error.participantLimitReached = true;
      throw error;
    }
    
    // Only add user if not already a participant
    if (!zone.participants.includes(userId.toString())) {
      const updatedZone = { 
        ...zone, 
        participants: [...zone.participants, userId.toString()]
      };
      this.zones.set(zoneId, updatedZone);
      return updatedZone;
    }
    
    return zone;
  }
  
  async leaveZone(zoneId: number, userId: number): Promise<Zone | undefined> {
    const zone = await this.getZoneById(zoneId);
    if (!zone) return undefined;
    
    const updatedZone = { 
      ...zone, 
      participants: zone.participants.filter(id => id !== userId.toString())
    };
    this.zones.set(zoneId, updatedZone);
    return updatedZone;
  }
  
  async removeParticipant(zoneId: number, participantId: number, requesterId: number): Promise<Zone | undefined> {
    const zone = await this.getZoneById(zoneId);
    if (!zone) return undefined;
    
    // Only the zone creator can remove participants
    if (zone.createdBy !== requesterId) {
      const error: any = new Error('Not authorized to remove participants from this zone');
      error.notAuthorized = true;
      throw error;
    }
    
    const updatedZone = { 
      ...zone, 
      participants: zone.participants.filter(id => id !== participantId.toString())
    };
    this.zones.set(zoneId, updatedZone);
    return updatedZone;
  }
}

export const storage = new MemStorage();
