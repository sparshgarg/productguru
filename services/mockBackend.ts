import { User, LeaderboardEntry, HistoryEntry, EvaluationScores, SampleAnswer } from "../types";

const USERS_KEY = "pm_app_users";
const CURRENT_USER_ID_KEY = "pm_app_current_user_id";
const HISTORY_KEY = "pm_app_history";

// Initialize with some fake data to populate the leaderboard
const MOCK_USERS: User[] = [
  { id: "u1", name: "Sarah J.", email: "sarah@example.com", streak: 12, averageScore: 92, sessionsCompleted: 15, lastPracticeDate: "2023-10-25" },
  { id: "u2", name: "Mike R.", email: "mike@example.com", streak: 5, averageScore: 88, sessionsCompleted: 8, lastPracticeDate: "2023-10-26" },
  { id: "u3", name: "Jessica T.", email: "jess@example.com", streak: 24, averageScore: 85, sessionsCompleted: 30, lastPracticeDate: "2023-10-26" },
  { id: "u4", name: "David L.", email: "david@example.com", streak: 3, averageScore: 76, sessionsCompleted: 4, lastPracticeDate: "2023-10-24" },
  { id: "u5", name: "Emily W.", email: "emily@example.com", streak: 45, averageScore: 94, sessionsCompleted: 50, lastPracticeDate: "2023-10-26" },
];

const loadUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  }
  return JSON.parse(stored);
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const loginUser = (name: string, email: string, photoUrl?: string): User => {
  const users = loadUsers();
  let user = users.find((u) => u.email === email);

  if (!user) {
    user = {
      id: Date.now().toString(),
      name,
      email,
      photoUrl,
      streak: 0,
      averageScore: 0,
      sessionsCompleted: 0,
      lastPracticeDate: null,
    };
    users.push(user);
    saveUsers(users);
  } else if (photoUrl && user.photoUrl !== photoUrl) {
      // Update photo if changed
      user.photoUrl = photoUrl;
      saveUsers(users);
  }
  
  localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
  return user;
};

export const getCurrentUser = (): User | null => {
  const id = localStorage.getItem(CURRENT_USER_ID_KEY);
  if (!id) return null;
  const users = loadUsers();
  return users.find((u) => u.id === id) || null;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_ID_KEY);
};

export const updateUserScore = (score: number): User => {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error("No user logged in");

  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === currentUser.id);
  if (userIndex === -1) throw new Error("User not found");

  const user = users[userIndex];
  
  // Update stats
  const totalScore = (user.averageScore * user.sessionsCompleted) + score;
  user.sessionsCompleted += 1;
  user.averageScore = Math.round(totalScore / user.sessionsCompleted);

  // Streak logic
  const today = new Date().toISOString().split('T')[0];
  if (user.lastPracticeDate) {
    const last = new Date(user.lastPracticeDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays === 1) {
        // consecutive day check roughly
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (user.lastPracticeDate.startsWith(yesterday.toISOString().split('T')[0])) {
             user.streak += 1;
        } else if (user.lastPracticeDate.startsWith(today)) {
            // Same day, do nothing
        } else {
            user.streak = 1;
        }
    } else if (!user.lastPracticeDate.startsWith(today)) {
         user.streak = 1;
    }
  } else {
    user.streak = 1;
  }
  
  user.lastPracticeDate = new Date().toISOString();

  users[userIndex] = user;
  saveUsers(users);
  return user;
};

export const getLeaderboard = (): LeaderboardEntry[] => {
  const users = loadUsers();
  // Sort by Average Score (desc), then Streak (desc)
  const sorted = users.sort((a, b) => {
    if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
    return b.streak - a.streak;
  });

  return sorted.slice(0, 50).map((u, index) => ({
    id: u.id,
    name: u.name,
    averageScore: u.averageScore,
    streak: u.streak,
    rank: index + 1,
  }));
};

export const saveHistoryEntry = (
  question: string,
  context: string,
  answer: string,
  scores: EvaluationScores,
  feedback: string,
  sampleAnswers: SampleAnswer[]
): void => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const entry: HistoryEntry = {
    id: Date.now().toString(),
    userId: currentUser.id,
    date: new Date().toISOString(),
    question,
    context,
    answer,
    scores,
    feedback,
    sampleAnswers,
  };

  const stored = localStorage.getItem(HISTORY_KEY);
  const history: HistoryEntry[] = stored ? JSON.parse(stored) : [];
  history.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const getUserHistory = (): HistoryEntry[] => {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const stored = localStorage.getItem(HISTORY_KEY);
  if (!stored) return [];

  const history: HistoryEntry[] = JSON.parse(stored);
  return history
    .filter((entry) => entry.userId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
