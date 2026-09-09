import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.knowledgeuniverse.app',
  appName: 'Knowledge Universe',
  webDir: 'dist',
  server: {
    cleartext: true,
  },
};

export default config;
