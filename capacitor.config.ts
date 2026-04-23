import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bodhieduhub.app',
  appName: 'Bodhi Edu Hub',
  webDir: 'public', // Using public as a fallback so sync doesn't fail
  server: {
    url: "https://bodhieduhub.com", 
    cleartext: true,
    allowNavigation: ["bodhieduhub.com", "*.bodhieduhub.com"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1b3022",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#f0f5ec",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1b3022",
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
    }
  }
};

export default config;
