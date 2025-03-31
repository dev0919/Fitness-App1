import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  profilePicture: text("profile_picture").default("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

// Workouts
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(),
  difficulty: text("difficulty").notNull(),
  completed: boolean("completed").default(false),
});

export const insertWorkoutSchema = createInsertSchema(workouts).pick({
  userId: true,
  title: true,
  description: true,
  duration: true,
  difficulty: true,
});

// Exercises
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  name: text("name").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  completed: boolean("completed").default(false),
  type: text("type").notNull(), // 'strength', 'cardio', etc.
});

export const insertExerciseSchema = createInsertSchema(exercises).pick({
  workoutId: true,
  name: true,
  sets: true,
  reps: true,
  type: true,
});

// Goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  target: integer("target").notNull(),
  current: integer("current").default(0),
  completed: boolean("completed").default(false),
  deadline: timestamp("deadline"),
  type: text("type").notNull(), // 'workout_count', 'weight', etc.
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  userId: true,
  title: true,
  description: true,
  target: true,
  type: true,
  deadline: true,
});

// Friend connections
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status").notNull(), // 'pending', 'accepted'
});

export const insertFriendSchema = createInsertSchema(friends).pick({
  userId: true,
  friendId: true,
  status: true,
});

// Activities (social feed)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'workout_completed', 'goal_achieved', etc.
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: json("metadata"), // Additional data specific to activity type
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  type: true,
  content: true,
  metadata: true,
});

// Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  userId: true,
  title: true,
  description: true,
  icon: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;

export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
