// app/entry.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function EntryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [firstTime, setFirstTime] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const checkFirstTime = async () => {
      const seen = await AsyncStorage.getItem("hasSeenIntro");
      const groupCode = await AsyncStorage.getItem("groupCode");

      if (groupCode) {
        router.replace("/");
      } else if (seen) {
        router.replace("/groupScreen");
      } else {
        setFirstTime(true);
        fadeIn();
      }
    };

    checkFirstTime();
  }, []);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const handleGetStarted = async () => {
    setLoading(true);
    await AsyncStorage.setItem("hasSeenIntro", "true");
    router.replace("/groupScreen");
  };

  if (!firstTime) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Welcome to Quiklist 🛒</Text>
      <Text style={styles.subtitle}>
        Create and share grocery lists in real-time with friends and family.
      </Text>

      {loading ? (
        <>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading your Quiklist...</Text>
        </>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#7c3aed",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingText: {
    marginTop: 16,
    color: "#6B7280",
  },
});
