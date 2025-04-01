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
  getAllTemplateWorkouts(): Promise<Workout[]>; // Add this method to get template workouts
  
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
  sessionStore: any; // Changed from session.SessionStore to avoid TypeScript error
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
    
    // Add pre-existing workout templates
    this.addPreExistingWorkouts();
  }
  
  // Method to add pre-existing workouts to the database
  private addPreExistingWorkouts() {
    const presetWorkouts = [
      {
        name: "Full Body Strength",
        description: "A comprehensive workout targeting all major muscle groups.",
        type: "strength",
        duration: 60,
        difficulty: "intermediate",
        exercises: [
          { name: "Barbell Squat", sets: 4, reps: 8, weight: 135, restTime: 90, notes: "Focus on form" },
          { name: "Bench Press", sets: 4, reps: 8, weight: 115, restTime: 90, notes: "Keep elbows tucked" },
          { name: "Bent Over Row", sets: 4, reps: 10, weight: 95, restTime: 90, notes: "Engage your lats" },
          { name: "Shoulder Press", sets: 3, reps: 10, weight: 65, restTime: 90, notes: "Push straight up" },
          { name: "Romanian Deadlift", sets: 3, reps: 10, weight: 135, restTime: 90, notes: "Hinge at the hips" }
        ]
      },
      {
        name: "HIIT Cardio Blast",
        description: "High-intensity interval training to boost cardiovascular fitness and burn calories.",
        type: "cardio",
        duration: 30,
        difficulty: "advanced",
        exercises: [
          { name: "Burpees", sets: 4, reps: 15, weight: 0, restTime: 30, notes: "Full range of motion" },
          { name: "Mountain Climbers", sets: 4, reps: 30, weight: 0, restTime: 30, notes: "Keep core tight" },
          { name: "Jump Squats", sets: 4, reps: 20, weight: 0, restTime: 30, notes: "Land softly" },
          { name: "High Knees", sets: 4, duration: 30, weight: 0, restTime: 30, notes: "Stay on toes" },
          { name: "Plank Jacks", sets: 4, reps: 20, weight: 0, restTime: 30, notes: "Maintain plank position" }
        ]
      },
      {
        name: "Yoga Flow",
        description: "A rejuvenating yoga sequence to improve flexibility, balance, and mental focus.",
        type: "flexibility",
        duration: 45,
        difficulty: "beginner",
        exercises: [
          { name: "Sun Salutation", sets: 3, reps: 5, weight: 0, restTime: 0, notes: "Flow with breath" },
          { name: "Warrior Sequence", sets: 2, duration: 300, weight: 0, restTime: 60, notes: "Both sides" },
          { name: "Balance Poses", sets: 1, duration: 600, weight: 0, restTime: 60, notes: "Tree, Eagle, Dancer" },
          { name: "Core Yoga", sets: 1, duration: 300, weight: 0, restTime: 60, notes: "Boat pose variations" },
          { name: "Final Relaxation", sets: 1, duration: 600, weight: 0, restTime: 0, notes: "Savasana" }
        ]
      },
      {
        name: "Upper Body Focus",
        description: "Target your chest, back, shoulders, and arms with this comprehensive upper body workout.",
        type: "strength",
        duration: 50,
        difficulty: "intermediate",
        exercises: [
          { name: "Incline Dumbbell Press", sets: 4, reps: 10, weight: 35, restTime: 90, notes: "Control the descent" },
          { name: "Pull-ups", sets: 4, reps: 8, weight: 0, restTime: 90, notes: "Full range of motion" },
          { name: "Lateral Raises", sets: 3, reps: 12, weight: 15, restTime: 60, notes: "Slight bend in elbows" },
          { name: "Tricep Dips", sets: 3, reps: 12, weight: 0, restTime: 60, notes: "Keep elbows close" },
          { name: "Bicep Curls", sets: 3, reps: 12, weight: 25, restTime: 60, notes: "Alternate arms" }
        ]
      },
      {
        name: "Lower Body Blast",
        description: "Build strength and endurance in your legs and glutes with this targeted workout.",
        type: "strength",
        duration: 45,
        difficulty: "intermediate",
        exercises: [
          { name: "Goblet Squats", sets: 4, reps: 12, weight: 50, restTime: 90, notes: "Keep chest up" },
          { name: "Romanian Deadlifts", sets: 4, reps: 10, weight: 115, restTime: 90, notes: "Feel the hamstrings" },
          { name: "Walking Lunges", sets: 3, reps: 20, weight: 20, restTime: 60, notes: "10 each leg" },
          { name: "Calf Raises", sets: 3, reps: 15, weight: 25, restTime: 60, notes: "Full extension" },
          { name: "Glute Bridges", sets: 3, reps: 15, weight: 45, restTime: 60, notes: "Squeeze at the top" }
        ]
      }
    ];
    
    // Add each workout to the storage
    for (const workoutData of presetWorkouts) {
      const { exercises: exerciseList, ...workoutDetails } = workoutData;
      
      // Add the workout
      const workout: Workout = {
        ...workoutDetails,
        id: this.workoutIdCounter++,
        userId: 0, // System workout (0 means it's a template)
        completed: false,
        createdAt: new Date()
      };
      this.workouts.set(workout.id, workout);
      
      // Add the exercises for this workout
      for (const exerciseData of exerciseList) {
        const exercise: Exercise = {
          ...exerciseData,
          id: this.exerciseIdCounter++,
          workoutId: workout.id,
          completed: false
        };
        this.exercises.set(exercise.id, exercise);
      }
    }
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
  
  async getAllTemplateWorkouts(): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(
      workout => workout.userId === 0
    );
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
