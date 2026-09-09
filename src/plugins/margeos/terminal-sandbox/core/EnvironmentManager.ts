/**
 * Environment Manager
 * Environment variable management for Terminal Sandbox
 */

export class EnvironmentManager {
  private static instance: EnvironmentManager | null = null;
  private variables: Map<string, string> = new Map();

  private constructor() {
    this.initializeDefaults();
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private initializeDefaults(): void {
    this.variables.set('HOME', '/tmp/terminal-sandbox');
    this.variables.set('USER', 'user');
    this.variables.set('SHELL', '/bin/bash');
    this.variables.set('TERM', 'xterm-256color');
    this.variables.set('PATH', '/usr/local/bin:/usr/bin:/bin');
    this.variables.set('LANG', 'en_US.UTF-8');
    this.variables.set('PWD', '/tmp/terminal-sandbox');
  }

  get(key: string): string | undefined {
    return this.variables.get(key);
  }

  set(key: string, value: string): void {
    this.variables.set(key, value);
  }

  unset(key: string): boolean {
    return this.variables.delete(key);
  }

  getAll(): Record<string, string> {
    return Object.fromEntries(this.variables);
  }

  getPath(): string[] {
    const path = this.variables.get('PATH') || '';
    return path.split(':').filter(Boolean);
  }

  addToPath(directory: string): void {
    const currentPath = this.getPath();
    if (!currentPath.includes(directory)) {
      currentPath.unshift(directory);
      this.variables.set('PATH', currentPath.join(':'));
    }
  }

  removeFromPath(directory: string): void {
    const currentPath = this.getPath().filter((d) => d !== directory);
    this.variables.set('PATH', currentPath.join(':'));
  }

  expand(value: string): string {
    return value.replace(/\$\{(\w+)\}/g, (_, key) => this.get(key) || '');
  }
}

export default EnvironmentManager;
