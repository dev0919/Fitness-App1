import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertWorkoutSchema, insertExerciseSchema, insertGoalSchema, insertFriendSchema, insertActivitySchema, insertAchievementSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

// Helper function to generate mock contacts
function generateMockContacts(domain: string, userId: number): { name: string; email: string }[] {
  const names = [
    "John Smith", "Emily Johnson", "Michael Brown", "Olivia Davis", 
    "William Wilson", "Sophia Martinez", "James Taylor", "Isabella Anderson",
    "Benjamin Thomas", "Mia Garcia", "Lucas White", "Charlotte Lewis"
  ];
  
  // Exclude some random names to have variation
  const selectedNames = names.filter(() => Math.random() > 0.3).slice(0, 5);
  
  return selectedNames.map(name => {
    const firstName = name.split(' ')[0].toLowerCase();
    return {
      name,
      email: `${firstName}${Math.floor(Math.random() * 1000)}@${domain}`
    };
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // User profile update route
  app.put("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user!.id;
      const { name, username, email, profilePicture, bio } = req.body;
      
      // Validate username uniqueness if it's changed
      if (username && username !== req.user!.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // Validate email uniqueness if it's changed
      if (email && email !== req.user!.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, { 
        name, username, email, profilePicture, bio 
      });
      
      // Update the session user data
      if (updatedUser) {
        req.user = updatedUser;
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

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
        content: `Created a new workout: ${workout.name}`,
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
          content: `Completed workout: ${updatedWorkout!.name}`,
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
      // Process deadline field separately to handle date format issues
      const { deadline, ...restData } = req.body;
      
      // Convert string deadline to proper Date object if present
      let parsedDeadline = null;
      if (deadline) {
        try {
          parsedDeadline = new Date(deadline);
          // Check if valid date
          if (isNaN(parsedDeadline.getTime())) {
            parsedDeadline = null;
          }
        } catch (e) {
          parsedDeadline = null;
        }
      }
      
      const goalData = { 
        ...restData, 
        userId,
        deadline: parsedDeadline
      };
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
  app.post("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { content, type = "status_update" } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const activity = await storage.createActivity({
        userId,
        type,
        content,
        metadata: req.body.metadata || {}
      });
      
      // Enrich the activity with user data before returning
      const user = await storage.getUser(userId);
      const enrichedActivity = {
        ...activity,
        user: user ? {
          id: user.id,
          username: user.username,
          name: user.name,
          profilePicture: user.profilePicture
        } : null
      };
      
      res.status(201).json(enrichedActivity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(500).json({ message: "Error creating activity" });
    }
  });
  
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

  // Template workouts - get all system workouts (userId = 0)
  app.get("/api/workouts/templates", isAuthenticated, async (req, res) => {
    try {
      // Get all template workouts (userId = 0)
      const workouts = await storage.getAllTemplateWorkouts();
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching template workouts:", error);
      res.status(500).json({ message: "Error fetching template workouts" });
    }
  });
  
  // Clone a template workout for the current user
  app.post("/api/workouts/clone/:id", isAuthenticated, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getWorkout(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template workout not found" });
      }
      
      if (template.userId !== 0) {
        return res.status(400).json({ message: "Not a template workout" });
      }
      
      // Create a new workout based on the template
      const newWorkout = await storage.createWorkout({
        userId: req.user!.id,
        name: template.name,
        description: template.description,
        type: template.type,
        duration: template.duration,
        difficulty: template.difficulty
      });
      
      // Get exercises from the template
      const exercises = await storage.getWorkoutExercises(templateId);
      
      // Create exercises for the new workout
      for (const exercise of exercises) {
        await storage.createExercise({
          workoutId: newWorkout.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          duration: exercise.duration,
          weight: exercise.weight,
          restTime: exercise.restTime,
          notes: exercise.notes
        });
      }
      
      // Create activity for cloning a workout
      await storage.createActivity({
        userId: req.user!.id,
        type: "workout_cloned",
        content: `${req.user!.name} created a new workout from the '${template.name}' template`,
        metadata: { workoutId: newWorkout.id, templateId }
      });
      
      res.status(201).json(newWorkout);
    } catch (error) {
      console.error("Error cloning workout:", error);
      res.status(500).json({ message: "Error cloning workout" });
    }
  });
  
  // Import contacts API 
  app.post("/api/friends/import", isAuthenticated, async (req, res) => {
    const { source, email } = req.body;
    
    if (!source || !email) {
      return res.status(400).json({ message: "Source and email are required" });
    }
    
    try {
      // Generate some mock contacts based on the provided email domain
      const domain = email.split('@')[1];
      const mockContacts = generateMockContacts(domain, req.user!.id);
      
      // Add these contacts as potential friends
      const addedFriends = [];
      for (const contact of mockContacts) {
        // Check if user exists
        let contactUser = await storage.getUserByEmail(contact.email);
        
        // If not, create a mock user for this contact
        if (!contactUser) {
          contactUser = await storage.createUser({
            username: contact.email.split('@')[0],
            password: crypto.randomBytes(16).toString('hex'), // Random password
            name: contact.name,
            email: contact.email
          });
        }
        
        // Create a friendship request
        const friend = await storage.createFriend({
          userId: req.user!.id,
          friendId: contactUser.id,
          status: 'pending'
        });
        
        addedFriends.push({
          id: friend.id,
          name: contactUser.name,
          email: contactUser.email,
          status: 'pending'
        });
      }
      
      // Create activity for importing contacts
      await storage.createActivity({
        userId: req.user!.id,
        type: "friends_imported",
        content: `${req.user!.name} imported ${addedFriends.length} contacts from ${source}`,
        metadata: { source, count: addedFriends.length }
      });
      
      res.status(201).json({ 
        message: `Successfully imported ${addedFriends.length} contacts from ${source}`,
        friends: addedFriends 
      });
    } catch (error) {
      console.error(`Error importing contacts from ${source}:`, error);
      res.status(500).json({ message: `Error importing contacts from ${source}` });
    }
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
      ? activeGoals.reduce((sum, goal) => sum + (goal.current || 0) / goal.target, 0) / activeGoals.length * 100
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
  
  // Workout statistics and analytics endpoint
  app.get("/api/workout-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get all user workouts
      const workouts = await storage.getUserWorkouts(userId);
      const completedWorkouts = workouts.filter(w => w.completed);
      
      // Get current timestamp and calculate dates for time ranges
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      
      // Filter workouts by time ranges
      const lastWeekWorkouts = completedWorkouts.filter(w => {
        const date = w.completedAt || w.updatedAt || w.createdAt;
        return date ? new Date(date) >= oneWeekAgo : false;
      });
      
      const lastMonthWorkouts = completedWorkouts.filter(w => {
        const date = w.completedAt || w.updatedAt || w.createdAt;
        return date ? new Date(date) >= oneMonthAgo : false;
      });
      
      const lastThreeMonthsWorkouts = completedWorkouts.filter(w => {
        const date = w.completedAt || w.updatedAt || w.createdAt;
        return date ? new Date(date) >= threeMonthsAgo : false;
      });
      
      // Group workouts by type
      const workoutsByType: Record<string, number> = {};
      completedWorkouts.forEach(workout => {
        if (workout.type) {
          workoutsByType[workout.type] = (workoutsByType[workout.type] || 0) + 1;
        }
      });
      
      // Calculate workout frequency (workouts per week)
      const weekCount = Math.max(1, Math.ceil(completedWorkouts.length / 4)); // Estimate weeks based on workout count
      const workoutsPerWeek = completedWorkouts.length / weekCount;
      
      // Calculate recent performance trend (increasing or decreasing workout frequency)
      const recentWorkoutsPerWeek = lastWeekWorkouts.length;
      const prevWeekDate = new Date(oneWeekAgo);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7);
      
      const prevWeekWorkouts = completedWorkouts.filter(w => {
        const date = w.completedAt || w.updatedAt || w.createdAt;
        if (!date) return false;
        const workoutDate = new Date(date);
        return workoutDate >= prevWeekDate && workoutDate < oneWeekAgo;
      });
      
      const weeklyTrend = recentWorkoutsPerWeek - prevWeekWorkouts.length;
      
      // Weekly workout distribution
      const workoutsByDay: number[] = Array(7).fill(0);
      
      lastMonthWorkouts.forEach(workout => {
        const date = workout.completedAt || workout.updatedAt || workout.createdAt;
        if (!date) return;
        const workoutDate = new Date(date);
        const dayOfWeek = workoutDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        workoutsByDay[dayOfWeek]++;
      });
      
      // Daily active minutes over the past month
      const dailyActiveMinutes: { date: string, minutes: number }[] = [];
      
      // Create a map for easy lookup
      const dateToMinutesMap: Record<string, number> = {};
      
      lastMonthWorkouts.forEach(workout => {
        const date = workout.completedAt || workout.updatedAt || workout.createdAt;
        if (!date) return;
        const workoutDate = new Date(date);
        const dateStr = workoutDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        dateToMinutesMap[dateStr] = (dateToMinutesMap[dateStr] || 0) + workout.duration;
      });
      
      // Fill in the last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        dailyActiveMinutes.unshift({
          date: dateStr,
          minutes: dateToMinutesMap[dateStr] || 0
        });
      }
      
      // Calculate average workout duration
      const totalDuration = completedWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
      const avgDuration = completedWorkouts.length > 0 ? totalDuration / completedWorkouts.length : 0;
      
      // Calculate improvement metrics
      const oldestWorkoutDate = completedWorkouts.length > 0 
        ? new Date(completedWorkouts.reduce((oldest, workout) => {
            const date = workout.completedAt || workout.updatedAt || workout.createdAt;
            if (!date) return oldest;
            const workoutDate = new Date(date);
            return workoutDate < oldest ? workoutDate : oldest;
          }, new Date()))
        : new Date();
      
      const daysActive = Math.round((now.getTime() - oldestWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Return the statistics
      res.json({
        summary: {
          totalCompletedWorkouts: completedWorkouts.length,
          totalActiveMinutes: totalDuration,
          avgWorkoutDuration: Math.round(avgDuration),
          workoutsPerWeek: Math.round(workoutsPerWeek * 10) / 10,
          daysActive: daysActive,
          weeklyTrend: weeklyTrend
        },
        trends: {
          lastWeek: lastWeekWorkouts.length,
          lastMonth: lastMonthWorkouts.length,
          lastThreeMonths: lastThreeMonthsWorkouts.length
        },
        workoutsByType: Object.entries(workoutsByType).map(([type, count]) => ({ type, count })),
        workoutsByDay: [
          { day: "Sunday", count: workoutsByDay[0] },
          { day: "Monday", count: workoutsByDay[1] },
          { day: "Tuesday", count: workoutsByDay[2] },
          { day: "Wednesday", count: workoutsByDay[3] },
          { day: "Thursday", count: workoutsByDay[4] },
          { day: "Friday", count: workoutsByDay[5] },
          { day: "Saturday", count: workoutsByDay[6] }
        ],
        dailyActiveMinutes
      });
    } catch (error) {
      console.error("Error fetching workout statistics:", error);
      res.status(500).json({ message: "Error fetching workout statistics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
