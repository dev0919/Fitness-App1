import { 
  users, type User, type InsertUser, 
  workouts, type Workout, type InsertWorkout, 
  exercises, type Exercise, type InsertExercise,
  goals, type Goal, type InsertGoal,
  friends, type Friend, type InsertFriend,
  activities, type Activity, type InsertActivity,
  achievements, type Achievement, type InsertAchievement
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workout operations
  getWorkout(id: number): Promise<Workout | undefined>;
  getUserWorkouts(userId: number): Promise<Workout[]>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, workout: Partial<Workout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;
  
  // Exercise operations
  getExercise(id: number): Promise<Exercise | undefined>;
  getWorkoutExercises(workoutId: number): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, exercise: Partial<Exercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<boolean>;
  
  // Goal operations
  getGoal(id: number): Promise<Goal | undefined>;
  getUserGoals(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Friend operations
  getFriend(id: number): Promise<Friend | undefined>;
  getUserFriends(userId: number): Promise<Friend[]>;
  createFriend(friend: InsertFriend): Promise<Friend>;
  updateFriend(id: number, friend: Partial<Friend>): Promise<Friend | undefined>;
  deleteFriend(id: number): Promise<boolean>;
  
  // Activity operations
  getActivity(id: number): Promise<Activity | undefined>;
  getUserActivities(userId: number): Promise<Activity[]>;
  getFriendsActivities(userIds: number[]): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Achievement operations
  getAchievement(id: number): Promise<Achievement | undefined>;
  getUserAchievements(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workouts: Map<number, Workout>;
  private exercises: Map<number, Exercise>;
  private goals: Map<number, Goal>;
  private friends: Map<number, Friend>;
  private activities: Map<number, Activity>;
  private achievements: Map<number, Achievement>;
  
  sessionStore: session.SessionStore;
  private userIdCounter: number;
  private workoutIdCounter: number;
  private exerciseIdCounter: number;
  private goalIdCounter: number;
  private friendIdCounter: number;
  private activityIdCounter: number;
  private achievementIdCounter: number;

  constructor() {
    this.users = new Map();
    this.workouts = new Map();
    this.exercises = new Map();
    this.goals = new Map();
    this.friends = new Map();
    this.activities = new Map();
    this.achievements = new Map();
    
    this.userIdCounter = 1;
    this.workoutIdCounter = 1;
    this.exerciseIdCounter = 1;
    this.goalIdCounter = 1;
    this.friendIdCounter = 1;
    this.activityIdCounter = 1;
    this.achievementIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Workout operations
  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }
  
  async getUserWorkouts(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(
      (workout) => workout.userId === userId,
    );
  }
  
  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.workoutIdCounter++;
    const workout: Workout = { ...insertWorkout, id, completed: false };
    this.workouts.set(id, workout);
    return workout;
  }
  
  async updateWorkout(id: number, workoutUpdate: Partial<Workout>): Promise<Workout | undefined> {
    const workout = this.workouts.get(id);
    if (!workout) return undefined;
    
    const updatedWorkout = { ...workout, ...workoutUpdate };
    this.workouts.set(id, updatedWorkout);
    return updatedWorkout;
  }
  
  async deleteWorkout(id: number): Promise<boolean> {
    return this.workouts.delete(id);
  }
  
  // Exercise operations
  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }
  
  async getWorkoutExercises(workoutId: number): Promise<Exercise[]> {
    return Array.from(this.exercises.values()).filter(
      (exercise) => exercise.workoutId === workoutId,
    );
  }
  
  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.exerciseIdCounter++;
    const exercise: Exercise = { ...insertExercise, id, completed: false };
    this.exercises.set(id, exercise);
    return exercise;
  }
  
  async updateExercise(id: number, exerciseUpdate: Partial<Exercise>): Promise<Exercise | undefined> {
    const exercise = this.exercises.get(id);
    if (!exercise) return undefined;
    
    const updatedExercise = { ...exercise, ...exerciseUpdate };
    this.exercises.set(id, updatedExercise);
    return updatedExercise;
  }
  
  async deleteExercise(id: number): Promise<boolean> {
    return this.exercises.delete(id);
  }
  
  // Goal operations
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }
  
  async getUserGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(
      (goal) => goal.userId === userId,
    );
  }
  
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.goalIdCounter++;
    const goal: Goal = { ...insertGoal, id, current: 0, completed: false };
    this.goals.set(id, goal);
    return goal;
  }
  
  async updateGoal(id: number, goalUpdate: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, ...goalUpdate };
    // Check if goal is completed based on current/target values
    if (updatedGoal.current >= updatedGoal.target) {
      updatedGoal.completed = true;
    }
    
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }
  
  // Friend operations
  async getFriend(id: number): Promise<Friend | undefined> {
    return this.friends.get(id);
  }
  
  async getUserFriends(userId: number): Promise<Friend[]> {
    return Array.from(this.friends.values()).filter(
      (friend) => friend.userId === userId || friend.friendId === userId,
    );
  }
  
  async createFriend(insertFriend: InsertFriend): Promise<Friend> {
    const id = this.friendIdCounter++;
    const friend: Friend = { ...insertFriend, id };
    this.friends.set(id, friend);
    return friend;
  }
  
  async updateFriend(id: number, friendUpdate: Partial<Friend>): Promise<Friend | undefined> {
    const friend = this.friends.get(id);
    if (!friend) return undefined;
    
    const updatedFriend = { ...friend, ...friendUpdate };
    this.friends.set(id, updatedFriend);
    return updatedFriend;
  }
  
  async deleteFriend(id: number): Promise<boolean> {
    return this.friends.delete(id);
  }
  
  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }
  
  async getUserActivities(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async getFriendsActivities(userIds: number[]): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => userIds.includes(activity.userId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const timestamp = new Date();
    const activity: Activity = { ...insertActivity, id, timestamp };
    this.activities.set(id, activity);
    return activity;
  }
  
  // Achievement operations
  async getAchievement(id: number): Promise<Achievement | undefined> {
    return this.achievements.get(id);
  }
  
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
  }
  
  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementIdCounter++;
    const earnedAt = new Date();
    const achievement: Achievement = { ...insertAchievement, id, earnedAt };
    this.achievements.set(id, achievement);
    return achievement;
  }
}

export const storage = new MemStorage();
