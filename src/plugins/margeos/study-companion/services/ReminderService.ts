// Study Companion — Reminder Service
// Manages study reminders and notifications

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  message: string;
  time: Date;
  repeat?: RepeatPattern;
  enabled: boolean;
  sent: boolean;
  subject?: string;
}

export type ReminderType = "study" | "break" | "goal" | "review" | "custom";
export type RepeatPattern = "daily" | "weekly" | "weekdays" | "custom";

export interface ReminderSchedule {
  time: string;           // HH:mm
  days?: number[];        // 0-6, Sunday = 0
  enabled: boolean;
}

export class ReminderService {
  private static instance: ReminderService;
  private userId: string = "";
  private reminders: Reminder[] = [];
  private schedules: ReminderSchedule[] = [];
  private listeners: Set<(reminders: Reminder[]) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadReminders();
    await this.loadSchedules();
    this.startReminderCheck();
  }

  private async loadReminders(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`sc_reminders_${this.userId}`);
      if (stored) {
        this.reminders = JSON.parse(stored).map((r: any) => ({
          ...r,
          time: new Date(r.time)
        }));
      }
    } catch (error) {
      console.error("Failed to load reminders:", error);
    }
  }

  private async loadSchedules(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`sc_schedules_${this.userId}`);
      if (stored) {
        this.schedules = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load schedules:", error);
    }
  }

  private async saveReminders(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(`sc_reminders_${this.userId}`, JSON.stringify(this.reminders));
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to save reminders:", error);
    }
  }

  private async saveSchedules(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(`sc_schedules_${this.userId}`, JSON.stringify(this.schedules));
    } catch (error) {
      console.error("Failed to save schedules:", error);
    }
  }

  private startReminderCheck(): void {
    if (typeof window === "undefined") return;

    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 60000);

    // Initial check
    this.checkReminders();
  }

  private checkReminders(): void {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const currentDay = now.getDay();

    // Check scheduled reminders
    for (const schedule of this.schedules) {
      if (!schedule.enabled) continue;
      if (schedule.time !== currentTime) continue;
      if (schedule.days && !schedule.days.includes(currentDay)) continue;

      // Create reminder
      this.createReminder({
        type: "study",
        title: "Study Time!",
        message: "Time for your scheduled study session.",
        time: now,
        enabled: true,
        sent: false
      });
    }

    // Check one-time reminders
    for (const reminder of this.reminders) {
      if (reminder.sent || !reminder.enabled) continue;
      if (reminder.time > now) continue;

      // Send reminder (would integrate with notification system)
      this.sendReminder(reminder);
      reminder.sent = true;

      // Handle repeat
      if (reminder.repeat) {
        this.scheduleNextReminder(reminder);
      }
    }

    this.saveReminders();
  }

  private sendReminder(reminder: Reminder): void {
    // This would integrate with browser notifications or push notifications
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(reminder.title, {
        body: reminder.message,
        icon: "/icon.png",
        tag: reminder.id
      });
    }
  }

  private scheduleNextReminder(reminder: Reminder): void {
    if (!reminder.repeat) return;

    const nextTime = new Date(reminder.time);

    switch (reminder.repeat) {
      case "daily":
        nextTime.setDate(nextTime.getDate() + 1);
        break;
      case "weekly":
        nextTime.setDate(nextTime.getDate() + 7);
        break;
      case "weekdays":
        do {
          nextTime.setDate(nextTime.getDate() + 1);
        } while (nextTime.getDay() === 0 || nextTime.getDay() === 6);
        break;
    }

    reminder.time = nextTime;
    reminder.sent = false;
  }

  // Create reminder
  createReminder(reminder: Omit<Reminder, "id">): Reminder {
    const newReminder: Reminder = {
      ...reminder,
      id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.reminders.push(newReminder);
    this.saveReminders();

    return newReminder;
  }

  // Create schedule
  createSchedule(schedule: ReminderSchedule): void {
    this.schedules.push(schedule);
    this.saveSchedules();
  }

  // Get all reminders
  getReminders(includeSent: boolean = false): Reminder[] {
    if (includeSent) return [...this.reminders];
    return this.reminders.filter(r => !r.sent);
  }

  // Get upcoming reminders
  getUpcomingReminders(limit: number = 5): Reminder[] {
    const now = new Date();
    return this.reminders
      .filter(r => !r.sent && r.time > now)
      .sort((a, b) => a.time.getTime() - b.time.getTime())
      .slice(0, limit);
  }

  // Get schedules
  getSchedules(): ReminderSchedule[] {
    return [...this.schedules];
  }

  // Update reminder
  updateReminder(id: string, updates: Partial<Reminder>): void {
    const reminder = this.reminders.find(r => r.id === id);
    if (reminder) {
      Object.assign(reminder, updates);
      this.saveReminders();
    }
  }

  // Delete reminder
  deleteReminder(id: string): void {
    this.reminders = this.reminders.filter(r => r.id !== id);
    this.saveReminders();
  }

  // Delete schedule
  deleteSchedule(time: string): void {
    this.schedules = this.schedules.filter(s => s.time !== time);
    this.saveSchedules();
  }

  // Enable/disable reminder
  setReminderEnabled(id: string, enabled: boolean): void {
    const reminder = this.reminders.find(r => r.id === id);
    if (reminder) {
      reminder.enabled = enabled;
      this.saveReminders();
    }
  }

  // Enable/disable schedule
  setScheduleEnabled(time: string, enabled: boolean): void {
    const schedule = this.schedules.find(s => s.time === time);
    if (schedule) {
      schedule.enabled = enabled;
      this.saveSchedules();
    }
  }

  // Snooze reminder
  snoozeReminder(id: string, minutes: number = 15): void {
    const reminder = this.reminders.find(r => r.id === id);
    if (reminder) {
      reminder.time = new Date(Date.now() + minutes * 60 * 1000);
      reminder.sent = false;
      this.saveReminders();
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (typeof Notification === "undefined") return false;

    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  // Check notification permission
  hasNotificationPermission(): boolean {
    if (typeof Notification === "undefined") return false;
    return Notification.permission === "granted";
  }

  // Subscribe to reminder changes
  subscribe(listener: (reminders: Reminder[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.reminders);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.reminders = [];
    this.schedules = [];
    this.listeners.clear();
  }
}

export const reminderService = ReminderService.getInstance();
