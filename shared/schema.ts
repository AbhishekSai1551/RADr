import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  gender: text("gender").default("prefer_not_to_say"), // "male", "female", "non_binary", "prefer_not_to_say"
  bio: text("bio"),
  profession: text("profession"),
  avatar: text("avatar"),
  coverImage: text("cover_image"),
  education: text("education"),
  experience: text("experience"),
  hobbies: text("hobbies"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const userInterests = pgTable("user_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  interestId: integer("interest_id").notNull().references(() => interests.id),
});

export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  status: text("status").notNull(), // "pending", "accepted", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// New table for zones (events)
export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  city: text("city").notNull(), // City where the zone is located
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  participants: text("participants").array().default([]).notNull(), // Store user IDs of participants as strings
  participantLimit: integer("participant_limit").default(0), // 0 means no limit
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    lastActive: true,
    createdAt: true,
  })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const insertInterestSchema = createInsertSchema(interests).omit({
  id: true,
});

export const insertUserInterestSchema = createInsertSchema(userInterests).omit({
  id: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Create a base schema for zones then refine to handle date as string
const baseZoneSchema = createInsertSchema(zones).omit({
  id: true,
  createdAt: true,
  createdBy: true, // Omit createdBy since we set it on the server from the authenticated user
});

// Custom insertZoneSchema that transforms the date string to a Date object
export const insertZoneSchema = baseZoneSchema.extend({
  date: z.string().transform((dateStr) => new Date(dateStr)),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

// Types
export type InsertUser = Omit<z.infer<typeof insertUserSchema>, "confirmPassword">;
export type User = typeof users.$inferSelect;
export type Interest = typeof interests.$inferSelect;
export type UserInterest = typeof userInterests.$inferSelect;
export type Connection = typeof connections.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Zone = typeof zones.$inferSelect;
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateLocation = z.infer<typeof updateLocationSchema>;

// Additional types for frontend
export type UserProfile = User & {
  interests: Interest[];
  distance?: number;
};
