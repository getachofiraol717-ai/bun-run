// Study Companion — Student Profile Engine
// Manages persistent student learning profiles

import type {
  StudentProfile,
  LearningStyle,
  StudyPreferences,
  Achievement
} from "../models/StudentProfile";

export interface ProfileUpdate {
  personal?: Partial<StudentProfile["personal"]>;
  learningStyle?: Partial<LearningStyle>;
  studyPreferences?: Partial<StudyPreferences>;
  accessibilityNeeds?: Partial<StudentProfile["accessibilityNeeds"]>;
}

export class StudentProfileEngine {
  private userId: string = "";
  private profile: StudentProfile | null = null;
  private listeners: Set<(profile: StudentProfile) => void> = new Set();

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadProfile();
  }

  // Load profile from storage
  private async loadProfile(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`study_companion_profile_${this.userId}`);
      if (stored) {
        this.profile = JSON.parse(stored);
      } else {
        this.profile = this.createDefaultProfile();
        await this.saveProfile();
      }
    } catch (error) {
      console.error("Failed to load student profile:", error);
      this.profile = this.createDefaultProfile();
    }
  }

  // Save profile to storage
  private async saveProfile(): Promise<void> {
    if (!this.profile || typeof localStorage === "undefined") return;

    try {
      this.profile.updatedAt = new Date();
      localStorage.setItem(
        `study_companion_profile_${this.userId}`,
        JSON.stringify(this.profile)
      );
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to save student profile:", error);
    }
  }

  // Create default profile
  private createDefaultProfile(): StudentProfile {
    return {
      id: `profile-${this.userId}`,
      userId: this.userId,
      personal: {
        displayName: "Student",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: "en",
        subjects: []
      },
      learningStyle: {
        visual: 50,
        auditory: 50,
        reading: 50,
        kinesthetic: 50,
        dominant: "mixed"
      },
      explanationPreference: {
        style: "mixed",
        includeExamples: true,
        includeAnalogies: true,
        includeVisuals: true,
        pacing: "adaptive"
      },
      studyPreferences: {
        sessionLength: 25,
        breakFrequency: 5,
        breakDuration: 5,
        maxDailyGoal: 120,
        preferredStudyTime: "flexible",
        notificationsEnabled: true,
        reminderTimes: []
      },
      accessibilityNeeds: {
        screenReader: false,
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        extendedTime: false,
        captioning: false,
        braille: false
      },
      engagement: {
        totalStudyTime: 0,
        totalSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalGoalsCompleted: 0,
        totalConceptsLearned: 0,
        averageSessionLength: 0
      },
      achievements: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };
  }

  // Get current profile
  getProfile(): StudentProfile | null {
    return this.profile;
  }

  // Update profile
  async updateProfile(updates: Partial<StudentProfile>): Promise<void> {
    if (!this.profile) return;

    this.profile = {
      ...this.profile,
      ...updates,
      updatedAt: new Date()
    };

    await this.saveProfile();
  }

  // Update specific sections
  async updatePersonalInfo(info: Partial<StudentProfile["personal"]>): Promise<void> {
    if (!this.profile) return;

    this.profile.personal = {
      ...this.profile.personal,
      ...info
    };

    await this.saveProfile();
  }

  async updateLearningStyle(style: Partial<LearningStyle>): Promise<void> {
    if (!this.profile) return;

    this.profile.learningStyle = {
      ...this.profile.learningStyle,
      ...style
    };

    // Update dominant style
    this.updateDominantStyle();

    await this.saveProfile();
  }

  async updateStudyPreferences(prefs: Partial<StudyPreferences>): Promise<void> {
    if (!this.profile) return;

    this.profile.studyPreferences = {
      ...this.profile.studyPreferences,
      ...prefs
    };

    await this.saveProfile();
  }

  async updateAccessibilityNeeds(needs: Partial<StudentProfile["accessibilityNeeds"]>): Promise<void> {
    if (!this.profile) return;

    this.profile.accessibilityNeeds = {
      ...this.profile.accessibilityNeeds,
      ...needs
    };

    await this.saveProfile();
  }

  // Calculate dominant learning style
  private updateDominantStyle(): void {
    if (!this.profile) return;

    const { visual, auditory, reading, kinesthetic } = this.profile.learningStyle;
    const max = Math.max(visual, auditory, reading, kinesthetic);

    if (max < 40) {
      this.profile.learningStyle.dominant = "mixed";
      return;
    }

    if (visual === max) this.profile.learningStyle.dominant = "visual";
    else if (auditory === max) this.profile.learningStyle.dominant = "auditory";
    else if (reading === max) this.profile.learningStyle.dominant = "reading";
    else if (kinesthetic === max) this.profile.learningStyle.dominant = "kinesthetic";
    else this.profile.learningStyle.dominant = "mixed";
  }

  // Engagement tracking
  async recordStudyTime(minutes: number): Promise<void> {
    if (!this.profile) return;

    this.profile.engagement.totalStudyTime += minutes;
    this.profile.engagement.averageSessionLength =
      (this.profile.engagement.averageSessionLength * this.profile.engagement.totalSessions + minutes) /
      (this.profile.engagement.totalSessions + 1);

    await this.saveProfile();
  }

  async recordSession(): Promise<void> {
    if (!this.profile) return;

    this.profile.engagement.totalSessions++;
    this.profile.lastActiveAt = new Date();

    await this.saveProfile();
  }

  async updateStreak(currentStreak: number): Promise<void> {
    if (!this.profile) return;

    this.profile.engagement.currentStreak = currentStreak;

    if (currentStreak > this.profile.engagement.longestStreak) {
      this.profile.engagement.longestStreak = currentStreak;
    }

    await this.saveProfile();
  }

  async incrementGoalsCompleted(): Promise<void> {
    if (!this.profile) return;

    this.profile.engagement.totalGoalsCompleted++;
    await this.saveProfile();
  }

  async incrementConceptsLearned(): Promise<void> {
    if (!this.profile) return;

    this.profile.engagement.totalConceptsLearned++;
    await this.saveProfile();
  }

  // Achievement management
  async addAchievement(achievement: Achievement): Promise<void> {
    if (!this.profile) return;

    // Check if already exists
    const exists = this.profile.achievements.some(a => a.id === achievement.id);
    if (!exists) {
      this.profile.achievements.push(achievement);
      await this.saveProfile();
    }
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.profile?.achievements || [];
  }

  // Subject management
  async addSubject(subject: string): Promise<void> {
    if (!this.profile || !subject) return;

    if (!this.profile.personal.subjects.includes(subject)) {
      this.profile.personal.subjects.push(subject);
      await this.saveProfile();
    }
  }

  async removeSubject(subject: string): Promise<void> {
    if (!this.profile || !subject) return;

    this.profile.personal.subjects = this.profile.personal.subjects.filter(s => s !== subject);
    await this.saveProfile();
  }

  async getSubjects(): Promise<string[]> {
    return this.profile?.personal.subjects || [];
  }

  // Analytics
  getEngagementSummary(): {
    totalStudyTime: number;
    totalSessions: number;
    currentStreak: number;
    longestStreak: number;
    averageSessionLength: number;
  } {
    if (!this.profile) {
      return {
        totalStudyTime: 0,
        totalSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageSessionLength: 0
      };
    }

    return { ...this.profile.engagement };
  }

  // Detect learning style from activity
  async inferLearningStyle(): Promise<LearningStyle> {
    // This would analyze actual learning patterns
    // For now, return current style
    return this.profile?.learningStyle || {
      visual: 50,
      auditory: 50,
      reading: 50,
      kinesthetic: 50,
      dominant: "mixed"
    };
  }

  // Subscribe to profile changes
  subscribe(listener: (profile: StudentProfile) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    if (!this.profile) return;
    for (const listener of this.listeners) {
      listener(this.profile);
    }
  }

  // Export profile
  exportProfile(): string | null {
    if (!this.profile) return null;
    return JSON.stringify(this.profile, null, 2);
  }

  // Import profile
  async importProfile(jsonString: string): Promise<boolean> {
    try {
      const imported = JSON.parse(jsonString) as StudentProfile;
      imported.id = this.profile?.id || imported.id;
      imported.updatedAt = new Date();
      this.profile = imported;
      await this.saveProfile();
      return true;
    } catch (error) {
      console.error("Failed to import profile:", error);
      return false;
    }
  }

  // Reset profile
  async resetProfile(): Promise<void> {
    this.profile = this.createDefaultProfile();
    await this.saveProfile();
  }

  // Cleanup
  destroy(): void {
    this.listeners.clear();
    this.profile = null;
  }
}

export const studentProfileEngine = new StudentProfileEngine();

