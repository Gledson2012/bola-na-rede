import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.futebolapp.app',
  appName: 'FutebolApp',
  webDir: 'www',
  server: {
    url: 'https://futebol-app-eight.vercel.app',
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#020617',
  },
}

export default config
