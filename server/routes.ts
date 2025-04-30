import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertInterestSchema, loginSchema, updateLocationSchema, insertZoneSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupSocketServer } from "./socket-server";
import { 
  handleReverseGeocode, 
  handleGeocode, 
  handleNearbyPlaces,
  handlePlacesInCity,
  reverseGeocode
} from "./location-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Endpoint to expose Google Maps API key (without authentication for loading map)
  app.get("/api/google-maps-key", (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    console.log('API Key exists:', !!apiKey, 'Length:', apiKey.length);
    // Log first 3 characters of the key for debugging (never log the whole key)
    if (apiKey.length > 5) {
      console.log('API Key starts with:', apiKey.substring(0, 3) + '...');
    }
    res.json({ key: apiKey });
  });

  // Error handling middleware for Zod validation errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: fromZodError(err).message 
      });
    }
    next(err);
  });

  // Middleware to ensure user is authenticated
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // API Routes
  // Profile endpoints
  app.get("/api/profile", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const interests = await storage.getUserInterests(userId);
    const userData = { ...user, password: undefined, interests };
    
    res.json(userData);
  });
  
  app.put("/api/profile", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const userData = req.body;
    
    // Don't allow updating username, email, or password through this endpoint
    delete userData.username;
    delete userData.email;
    delete userData.password;
    
    const updatedUser = await storage.updateUser(userId, userData);
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userResponse = { ...updatedUser, password: undefined };
    res.json(userResponse);
  });
  
  // Location endpoints
  app.put("/api/location", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const locationData = updateLocationSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserLocation(userId, locationData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Location updated successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      throw error;
    }
  });
  
  // Update location for any user (used for testing purposes)
  app.patch("/api/user/:userId/location", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const locationData = updateLocationSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserLocation(userId, locationData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Try to get location details using reverse geocoding
      const locationInfo = await reverseGeocode(locationData.latitude, locationData.longitude);
      
      res.json({ 
        message: "Location updated successfully",
        location: {
          ...locationData,
          address: locationInfo?.formattedAddress || null,
          city: locationInfo?.details.city || null,
          state: locationInfo?.details.state || null,
          country: locationInfo?.details.country || null
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });
  
  // Get current user location info including city, state, etc.
  app.get("/api/location/info", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If user has no location data yet
      if (!user.latitude || !user.longitude) {
        return res.json({
          hasLocation: false,
          message: "Location not set"
        });
      }
      
      // Get address details from coordinates
      const locationInfo = await reverseGeocode(user.latitude, user.longitude);
      
      if (!locationInfo) {
        return res.json({
          hasLocation: true,
          latitude: user.latitude,
          longitude: user.longitude,
          message: "Could not get location details"
        });
      }
      
      return res.json({
        hasLocation: true,
        latitude: user.latitude,
        longitude: user.longitude,
        address: locationInfo.formattedAddress,
        city: locationInfo.details.city,
        state: locationInfo.details.state,
        country: locationInfo.details.country,
        postalCode: locationInfo.details.postalCode
      });
    } catch (error) {
      console.error("Error getting location info:", error);
      res.status(500).json({ message: "Failed to get location information" });
    }
  });
  
  // Geocode an address to coordinates
  app.get("/api/location/geocode", async (req, res) => {
    handleGeocode(req, res);
  });
  
  // Reverse geocode coordinates to address
  app.get("/api/location/reverse", async (req, res) => {
    handleReverseGeocode(req, res);
  });
  
  // Get nearby places (requires Google Places API key)
  app.get("/api/location/places", ensureAuthenticated, async (req, res) => {
    handleNearbyPlaces(req, res);
  });
  
  // Get places in a specific city (requires Google Places API key)
  app.get("/api/location/places-in-city", async (req, res) => {
    handlePlacesInCity(req, res);
  });
  
  // Endpoint for location suggestions (for autocomplete)
  app.get("/api/location/suggestions", async (req, res) => {
    const query = req.query.query as string;
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    try {
      // Use the geocoding API to get location suggestions
      const encodedAddress = encodeURIComponent(query);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        return res.json([]);
      }
      
      // Format the results similar to how Places API would return them
      const suggestions = data.results.map((result: any) => ({
        place_id: result.place_id,
        description: result.formatted_address,
        structured_formatting: {
          main_text: result.formatted_address.split(',')[0],
          secondary_text: result.formatted_address.split(',').slice(1).join(',').trim()
        }
      }));
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      res.status(500).json({ message: "Failed to fetch location suggestions" });
    }
  });
  
  // Nearby users endpoint
  app.get("/api/nearby", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const maxDistance = Number(req.query.distance) || 5; // Default 5 miles
    
    const nearbyUsers = await storage.getNearbyUsers(userId, maxDistance);
    
    // For each user, get their interests
    const usersWithInterests = await Promise.all(
      nearbyUsers.map(async (user) => {
        const interests = await storage.getUserInterests(user.id);
        return {
          ...user,
          password: undefined,
          interests
        };
      })
    );
    
    res.json(usersWithInterests);
  });
  
  // Interests endpoints
  app.get("/api/interests", async (req, res) => {
    const interests = await storage.getInterests();
    res.json(interests);
  });
  
  app.post("/api/interests", ensureAuthenticated, async (req, res) => {
    try {
      const interestData = insertInterestSchema.parse(req.body);
      const interest = await storage.createInterest(interestData);
      res.status(201).json(interest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      throw error;
    }
  });
  
  app.post("/api/user-interests", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const { interestId } = req.body;
    
    if (!interestId) {
      return res.status(400).json({ message: "Interest ID is required" });
    }
    
    const userInterest = await storage.addUserInterest(userId, interestId);
    res.status(201).json(userInterest);
  });
  
  app.delete("/api/user-interests/:interestId", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const interestId = Number(req.params.interestId);
    
    await storage.removeUserInterest(userId, interestId);
    res.sendStatus(204);
  });
  
  // Connections endpoints
  app.get("/api/connections", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const connections = await storage.getUserConnections(userId);
    res.json(connections);
  });
  
  app.post("/api/connections", ensureAuthenticated, async (req, res) => {
    const requesterId = req.user!.id;
    const { recipientId } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }
    
    // Check if connection already exists
    const existingConnection = await storage.getConnection(requesterId, recipientId);
    
    if (existingConnection) {
      return res.status(400).json({ message: "Connection already exists" });
    }
    
    const connection = await storage.createConnection({
      requesterId,
      recipientId,
      status: "pending"
    });
    
    res.status(201).json(connection);
  });
  
  app.put("/api/connections/:connectionId", ensureAuthenticated, async (req, res) => {
    const connectionId = Number(req.params.connectionId);
    const { status } = req.body;
    
    if (!status || !["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }
    
    const connection = await storage.updateConnectionStatus(connectionId, status);
    
    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }
    
    res.json(connection);
  });
  
  // Messages endpoints
  app.get("/api/messages/:userId", ensureAuthenticated, async (req, res) => {
    const currentUserId = req.user!.id;
    const otherUserId = Number(req.params.userId);
    
    const messages = await storage.getMessages(currentUserId, otherUserId);
    
    // Mark messages from the other user as read
    await storage.markMessagesAsRead(otherUserId, currentUserId);
    
    res.json(messages);
  });
  
  app.post("/api/messages", ensureAuthenticated, async (req, res) => {
    const senderId = req.user!.id;
    const { recipientId, content } = req.body;
    
    if (!recipientId || !content) {
      return res.status(400).json({ message: "Recipient ID and content are required" });
    }
    
    const message = await storage.createMessage({
      senderId,
      recipientId,
      content
    });
    
    res.status(201).json(message);
  });
  
  app.get("/api/conversations", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const conversations = await storage.getConversations(userId);
    
    res.json(conversations);
  });
  
  // Zone endpoints
  app.get("/api/zones", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const city = req.query.city as string;
    
    // Get all zones if city is not specified
    const zones = await storage.getZones(userId, city || '');
    
    // Get creator information and participant details for each zone
    const zonesWithDetails = await Promise.all(
      zones.map(async (zone) => {
        // Get creator details
        const creator = await storage.getUser(zone.createdBy);
        
        // Get participant details if any
        const participantUsers = await Promise.all(
          (zone.participants || []).map(async (participantId) => {
            const user = await storage.getUser(Number(participantId));
            if (user) {
              return {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                profession: user.profession
              };
            }
            return null;
          })
        );
        
        // Filter out null entries (in case some users were not found)
        const validParticipantUsers = participantUsers.filter(user => user !== null);
        
        return {
          ...zone,
          creator: creator ? {
            id: creator.id,
            name: creator.name,
            avatar: creator.avatar,
            profession: creator.profession
          } : null,
          participantUsers: validParticipantUsers
        };
      })
    );
    
    res.json(zonesWithDetails);
  });
  
  app.get("/api/zones/:id", ensureAuthenticated, async (req, res) => {
    const zoneId = Number(req.params.id);
    const zone = await storage.getZoneById(zoneId);
    
    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }
    
    const creator = await storage.getUser(zone.createdBy);
    
    const zoneWithCreator = {
      ...zone,
      creator: creator ? {
        id: creator.id,
        name: creator.name,
        avatar: creator.avatar,
        profession: creator.profession
      } : null
    };
    
    res.json(zoneWithCreator);
  });
  
  app.post("/api/zones", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const zoneData = insertZoneSchema.parse(req.body);
      
      const zone = await storage.createZone({
        ...zoneData,
        createdBy: userId
      });
      
      res.status(201).json(zone);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      throw error;
    }
  });
  
  app.delete("/api/zones/:id", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const zoneId = Number(req.params.id);
    
    const zone = await storage.getZoneById(zoneId);
    
    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }
    
    // Only the creator can delete a zone
    if (zone.createdBy !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this zone" });
    }
    
    await storage.deleteZone(zoneId);
    res.sendStatus(204);
  });
  
  // Join a zone
  app.post("/api/zones/:id/join", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const zoneId = Number(req.params.id);
    
    try {
      const updatedZone = await storage.joinZone(zoneId, userId);
      
      if (!updatedZone) {
        return res.status(404).json({ message: "Zone not found" });
      }
      
      // Add creator and participant user details
      const creator = await storage.getUser(updatedZone.createdBy);
      
      // Get participant details
      const participantUsers = await Promise.all(
        (updatedZone.participants || []).map(async (participantId) => {
          const user = await storage.getUser(Number(participantId));
          if (user) {
            return {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              profession: user.profession
            };
          }
          return null;
        })
      );
      
      // Filter out null entries
      const validParticipantUsers = participantUsers.filter(user => user !== null);
      
      const zoneWithDetails = {
        ...updatedZone,
        creator: creator ? {
          id: creator.id,
          name: creator.name,
          avatar: creator.avatar,
          profession: creator.profession
        } : null,
        participantUsers: validParticipantUsers
      };
      
      res.json(zoneWithDetails);
    } catch (error: any) {
      if (error.participantLimitReached) {
        return res.status(400).json({ message: "Cannot join zone: participant limit reached" });
      }
      console.error("Error joining zone:", error);
      res.status(500).json({ message: "Failed to join zone" });
    }
  });
  
  // Leave a zone
  app.post("/api/zones/:id/leave", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const zoneId = Number(req.params.id);
    
    const updatedZone = await storage.leaveZone(zoneId, userId);
    
    if (!updatedZone) {
      return res.status(404).json({ message: "Zone not found" });
    }
    
    // Add creator and participant user details
    const creator = await storage.getUser(updatedZone.createdBy);
    
    // Get participant details
    const participantUsers = await Promise.all(
      (updatedZone.participants || []).map(async (participantId) => {
        const user = await storage.getUser(Number(participantId));
        if (user) {
          return {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            profession: user.profession
          };
        }
        return null;
      })
    );
    
    // Filter out null entries
    const validParticipantUsers = participantUsers.filter(user => user !== null);
    
    const zoneWithDetails = {
      ...updatedZone,
      creator: creator ? {
        id: creator.id,
        name: creator.name,
        avatar: creator.avatar,
        profession: creator.profession
      } : null,
      participantUsers: validParticipantUsers
    };
    
    res.json(zoneWithDetails);
  });
  
  // Remove a participant from a zone (only zone creator can do this)
  app.post("/api/zones/:id/remove-participant/:participantId", ensureAuthenticated, async (req, res) => {
    const requesterId = req.user!.id;
    const zoneId = Number(req.params.id);
    const participantId = Number(req.params.participantId);
    
    try {
      const updatedZone = await storage.removeParticipant(zoneId, participantId, requesterId);
      
      if (!updatedZone) {
        return res.status(404).json({ message: "Zone not found" });
      }
      
      // Add creator and participant user details
      const creator = await storage.getUser(updatedZone.createdBy);
      
      // Get participant details
      const participantUsers = await Promise.all(
        (updatedZone.participants || []).map(async (participantId) => {
          const user = await storage.getUser(Number(participantId));
          if (user) {
            return {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              profession: user.profession
            };
          }
          return null;
        })
      );
      
      // Filter out null entries
      const validParticipantUsers = participantUsers.filter(user => user !== null);
      
      const zoneWithDetails = {
        ...updatedZone,
        creator: creator ? {
          id: creator.id,
          name: creator.name,
          avatar: creator.avatar,
          profession: creator.profession
        } : null,
        participantUsers: validParticipantUsers
      };
      
      res.json(zoneWithDetails);
    } catch (error: any) {
      if (error.notAuthorized) {
        return res.status(403).json({ message: "Not authorized to remove participants from this zone" });
      }
      console.error("Error removing participant:", error);
      res.status(500).json({ message: "Failed to remove participant" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize socket.io server
  setupSocketServer(httpServer);

  return httpServer;
}
