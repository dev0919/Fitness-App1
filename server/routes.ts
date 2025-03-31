import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertWorkoutSchema, insertExerciseSchema, insertGoalSchema, insertFriendSchema, insertActivitySchema, insertAchievementSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check authentication
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Workout routes
  app.get("/api/workouts", isAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const workouts = await storage.getUserWorkouts(userId);
    res.json(workouts);
  });

  app.post("/api/workouts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const workoutData = { ...req.body, userId };
      const validatedData = insertWorkoutSchema.parse(workoutData);
      const workout = await storage.createWorkout(validatedData);
      
      // Create activity for new workout
      await storage.createActivity({
        userId,
        type: "workout_created",
        content: `Created a new workout: ${workout.title}`,
        metadata: { workoutId: workout.id }
      });
      
      res.status(201).json(workout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid workout data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating workout" });
      }
    }
  });

  app.get("/api/workouts/:id", isAuthenticated, async (req, res) => {
    const workoutId = parseInt(req.params.id);
    const workout = await storage.getWorkout(workoutId);
    
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    
    if (workout.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    res.json(workout);
  });

  app.put("/api/workouts/:id", isAuthenticated, async (req, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const workout = await storage.getWorkout(workoutId);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      if (workout.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedWorkout = await storage.updateWorkout(workoutId, req.body);
      
      // If workout is marked as completed, create an activity
      if (req.body.completed && !workout.completed) {
        await storage.createActivity({
          userId: req.user!.id,
          type: "workout_completed",
          content: `Completed workout: ${updatedWorkout!.title}`,
          metadata: { workoutId }
        });
        
        // Check for achievements
        const completedWorkouts = (await storage.getUserWorkouts(req.user!.id)).filter(w => w.completed).length;
        
        if (completedWorkouts === 1) {
          await storage.createAchievement({
            userId: req.user!.id,
            title: "First Workout",
            description: "Completed your first workout!",
            icon: "ri-award-line"
          });
        } else if (completedWorkouts === 5) {
          await storage.createAchievement({
            userId: req.user!.id,
            title: "Consistency Champion",
            description: "Completed 5 workouts!",
            icon: "ri-trophy-line"
          });
        }
      }
      
      res.json(updatedWorkout);
    } catch (error) {
      res.status(500).json({ message: "Error updating workout" });
    }
  });

  app.delete("/api/workouts/:id", isAuthenticated, async (req, res) => {
    const workoutId = parseInt(req.params.id);
    const workout = await storage.getWorkout(workoutId);
    
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    
    if (workout.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    await storage.deleteWorkout(workoutId);
    res.status(204).send();
  });

  // Exercise routes
  app.get("/api/workouts/:workoutId/exercises", isAuthenticated, async (req, res) => {
    const workoutId = parseInt(req.params.workoutId);
    const workout = await storage.getWorkout(workoutId);
    
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    
    if (workout.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const exercises = await storage.getWorkoutExercises(workoutId);
    res.json(exercises);
  });

  app.post("/api/workouts/:workoutId/exercises", isAuthenticated, async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const workout = await storage.getWorkout(workoutId);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      if (workout.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const exerciseData = { ...req.body, workoutId };
      const validatedData = insertExerciseSchema.parse(exerciseData);
      const exercise = await storage.createExercise(validatedData);
      
      res.status(201).json(exercise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid exercise data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating exercise" });
      }
    }
  });

  app.put("/api/exercises/:id", isAuthenticated, async (req, res) => {
    try {
      const exerciseId = parseInt(req.params.id);
      const exercise = await storage.getExercise(exerciseId);
      
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      const workout = await storage.getWorkout(exercise.workoutId);
      if (workout?.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedExercise = await storage.updateExercise(exerciseId, req.body);
      
      // Check if all exercises are completed to potentially mark the workout as complete
      if (req.body.completed) {
        const exercises = await storage.getWorkoutExercises(exercise.workoutId);
        const allCompleted = exercises.every(e => e.id === exerciseId ? req.body.completed : e.completed);
        
        if (allCompleted) {
          await storage.updateWorkout(exercise.workoutId, { completed: true });
        }
      }
      
      res.json(updatedExercise);
    } catch (error) {
      res.status(500).json({ message: "Error updating exercise" });
    }
  });

  // Goal routes
  app.get("/api/goals", isAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const goals = await storage.getUserGoals(userId);
    res.json(goals);
  });

  app.post("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const goalData = { ...req.body, userId };
      const validatedData = insertGoalSchema.parse(goalData);
      const goal = await storage.createGoal(validatedData);
      
      // Create activity for new goal
      await storage.createActivity({
        userId,
        type: "goal_created",
        content: `Set a new goal: ${goal.title}`,
        metadata: { goalId: goal.id }
      });
      
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating goal" });
      }
    }
  });

  app.put("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedGoal = await storage.updateGoal(goalId, req.body);
      
      // If goal is newly completed, create an activity
      if (updatedGoal!.completed && !goal.completed) {
        await storage.createActivity({
          userId: req.user!.id,
          type: "goal_achieved",
          content: `Achieved goal: ${updatedGoal!.title}`,
          metadata: { goalId }
        });
        
        // Add achievement for completing goal
        await storage.createAchievement({
          userId: req.user!.id,
          title: "Goal Crusher",
          description: `Achieved your goal: ${updatedGoal!.title}`,
          icon: "ri-flag-line"
        });
      }
      
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Error updating goal" });
    }
  });

  // Friend routes
  app.get("/api/friends", isAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const friendConnections = await storage.getUserFriends(userId);
    
    // Get user details for each friend
    const friendPromises = friendConnections.map(async (connection) => {
      const friendId = connection.userId === userId ? connection.friendId : connection.userId;
      const friend = await storage.getUser(friendId);
      
      return {
        id: connection.id,
        status: connection.status,
        friend: friend ? {
          id: friend.id,
          username: friend.username,
          name: friend.name,
          profilePicture: friend.profilePicture
        } : null,
        // If userId is the current user, then they're the requester, otherwise they're the receiver
        isRequester: connection.userId === userId
      };
    });
    
    const friends = await Promise.all(friendPromises);
    res.json(friends);
  });

  app.post("/api/friends", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { friendId } = req.body;
      
      // Validate friend exists
      const friend = await storage.getUser(friendId);
      if (!friend) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if friendship already exists
      const existingFriends = await storage.getUserFriends(userId);
      const alreadyFriends = existingFriends.some(
        f => (f.userId === userId && f.friendId === friendId) || 
             (f.userId === friendId && f.friendId === userId)
      );
      
      if (alreadyFriends) {
        return res.status(400).json({ message: "Friend request already exists" });
      }
      
      const friendData = {
        userId,
        friendId,
        status: "pending"
      };
      
      const validatedData = insertFriendSchema.parse(friendData);
      const friendRequest = await storage.createFriend(validatedData);
      
      res.status(201).json(friendRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid friend request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating friend request" });
      }
    }
  });

  app.put("/api/friends/:id", isAuthenticated, async (req, res) => {
    try {
      const friendId = parseInt(req.params.id);
      const friendConnection = await storage.getFriend(friendId);
      
      if (!friendConnection) {
        return res.status(404).json({ message: "Friend request not found" });
      }
      
      // Only the recipient can accept/reject the request
      if (friendConnection.friendId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { status } = req.body;
      if (status !== "accepted" && status !== "rejected") {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedFriend = await storage.updateFriend(friendId, { status });
      
      // If accepted, create activity
      if (status === "accepted") {
        const requester = await storage.getUser(friendConnection.userId);
        const recipient = await storage.getUser(friendConnection.friendId);
        
        if (requester && recipient) {
          // Create activity for both users
          await storage.createActivity({
            userId: requester.id,
            type: "friend_added",
            content: `You are now friends with ${recipient.name}`,
            metadata: { friendId: recipient.id }
          });
          
          await storage.createActivity({
            userId: recipient.id,
            type: "friend_added",
            content: `You are now friends with ${requester.name}`,
            metadata: { friendId: requester.id }
          });
        }
      }
      
      res.json(updatedFriend);
    } catch (error) {
      res.status(500).json({ message: "Error updating friend request" });
    }
  });

  // Activity feed routes
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const userActivities = await storage.getUserActivities(userId);
    
    // Get friends
    const friendConnections = await storage.getUserFriends(userId);
    const acceptedFriendConnections = friendConnections.filter(f => f.status === "accepted");
    
    const friendIds = acceptedFriendConnections.map(f => 
      f.userId === userId ? f.friendId : f.userId
    );
    
    // Get friend activities
    const friendActivities = await storage.getFriendsActivities(friendIds);
    
    // Combine and sort by timestamp
    const allActivities = [...userActivities, ...friendActivities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Enrich activities with user data
    const enrichedActivities = await Promise.all(allActivities.map(async (activity) => {
      const user = await storage.getUser(activity.userId);
      return {
        ...activity,
        user: user ? {
          id: user.id,
          username: user.username,
          name: user.name,
          profilePicture: user.profilePicture
        } : null
      };
    }));
    
    res.json(enrichedActivities);
  });

  // Achievement routes
  app.get("/api/achievements", isAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const achievements = await storage.getUserAchievements(userId);
    res.json(achievements);
  });

  // Stats route
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    
    // Get workouts
    const workouts = await storage.getUserWorkouts(userId);
    const completedWorkouts = workouts.filter(w => w.completed);
    
    // Get goals
    const goals = await storage.getUserGoals(userId);
    const activeGoals = goals.filter(g => !g.completed);
    
    // Calculate total active minutes
    const totalActiveMinutes = completedWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
    
    // Calculate goal progress
    const goalProgress = activeGoals.length > 0 
      ? activeGoals.reduce((sum, goal) => sum + (goal.current / goal.target), 0) / activeGoals.length * 100
      : 0;
    
    // Get friend activities
    const friendConnections = await storage.getUserFriends(userId);
    const acceptedFriendConnections = friendConnections.filter(f => f.status === "accepted");
    
    const friendIds = acceptedFriendConnections.map(f => 
      f.userId === userId ? f.friendId : f.userId
    );
    
    const friendActivities = await storage.getFriendsActivities(friendIds);
    
    // Get achievements
    const achievements = await storage.getUserAchievements(userId);
    
    const stats = {
      totalWorkouts: workouts.length,
      completedWorkouts: completedWorkouts.length,
      activeMinutes: totalActiveMinutes,
      goalProgress: Math.round(goalProgress),
      friendActivities: friendActivities.length,
      achievements: achievements.length
    };
    
    res.json(stats);
  });

  const httpServer = createServer(app);

  return httpServer;
}
