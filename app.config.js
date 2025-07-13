import "dotenv/config";

export default {
  expo: {
    name: "Quicklist",
    slug: "Shopping",
    scheme: "myapp",
    sdkVersion: "53.0.0",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/images/shop.png",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.mangalam.quicklist"
    },
    plugins: [
      "expo-router"
    ],
    extra: {
      router: {
        origin: false,
      },
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      eas: {
        projectId: "dafb359b-2afb-4cc5-8a0a-91396961da07",
      }
    },
    experiments: {
      typedRoutes: true
    }
  }
};
