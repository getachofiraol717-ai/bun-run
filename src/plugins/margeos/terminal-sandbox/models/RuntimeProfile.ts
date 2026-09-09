/**
 * Runtime Profile Model
 * Runtime configuration for Terminal Sandbox
 */

import type { RuntimeProfile, TerminalRuntime, InstalledPackage } from './types';

export function createRuntimeProfile(
  id: string,
  name: string,
  runtime: TerminalRuntime,
  version: string
): RuntimeProfile {
  return {
    id,
    name,
    runtime,
    version,
    packages: [],
    environmentVariables: {},
  };
}

export function initializePythonProfile(id: string): RuntimeProfile {
  return {
    id,
    name: 'Python Environment',
    runtime: 'python3',
    version: '3.11.0',
    packages: [],
    environmentVariables: {
      PYTHONPATH: '/tmp/terminal-sandbox/python/lib',
      PYTHONIOENCODING: 'utf-8',
    },
  };
}

export function initializeNodeProfile(id: string): RuntimeProfile {
  return {
    id,
    name: 'Node.js Environment',
    runtime: 'node',
    version: '18.17.0',
    packages: [],
    environmentVariables: {
      NODE_ENV: 'development',
      NODE_PATH: '/tmp/terminal-sandbox/node_modules',
    },
  };
}

export function addPackage(profile: RuntimeProfile, pkg: InstalledPackage): RuntimeProfile {
  return {
    ...profile,
    packages: [...profile.packages, pkg],
  };
}

export function removePackage(profile: RuntimeProfile, packageName: string): RuntimeProfile {
  return {
    ...profile,
    packages: profile.packages.filter((p) => p.name !== packageName),
  };
}
