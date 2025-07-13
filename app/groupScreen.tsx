import React, { useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Feather, MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// type RootStackParamList = {
//   GroupScreen: undefined;
//   index: undefined;
//   history: undefined;
// };


const GroupScreen = () => {
  const router = useRouter();
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  // const [showConfetti, setShowConfetti] = useState(false);
  const [groupNameFocused, setGroupNameFocused] = useState(false);
  const [groupCodeFocused, setGroupCodeFocused] = useState(false);

  useEffect(() => {
    const checkGroup = async () => {
      let id = await AsyncStorage.getItem("deviceId");
      if (!id) {
        id = uuid.v4().toString();
        await AsyncStorage.setItem("deviceId", id);
      }
      setDeviceId(id);

      const savedGroupCode = await AsyncStorage.getItem("groupCode");
      if (savedGroupCode) {
        router.push("/");
      }
    };

    checkGroup();
  }, []);

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Please enter a group name");
      return;
    }
    setShowCodeModal(true);
    

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(newCode);
    setShowCodeModal(true);

    await setDoc(doc(db, "groups", newCode), {
      name: groupName,
      createdAt: new Date(),
      members: [{ deviceId }],
    });

    await AsyncStorage.setItem("groupCode", newCode);
  };

  const joinGroup = async () => {
    const code = groupCode.toUpperCase();
    const groupRef = doc(db, "groups", code);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      Alert.alert("Group not found");
      return;
    }

    const data = groupSnap.data();
    const members = data?.members || [];

    const alreadyJoined = members.some(
      (member: any) => member.deviceId === deviceId
    );
    if (!alreadyJoined) {
      await updateDoc(groupRef, {
        members: arrayUnion({ deviceId }),
      });
    }

    await AsyncStorage.setItem("groupCode", code);
    router.push("/");
  };


  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradient} />

      <View style={styles.floatingElements}>
        <View
          style={[
            styles.floatingElement,
            {
              width: 100,
              height: 100,
              top: "10%",
              left: "20%",
              opacity: 0.1,
            },
          ]}
        />
        <View
          style={[
            styles.floatingElement,
            {
              width: 60,
              height: 60,
              top: "20%",
              right: "15%",
              opacity: 0.08,
            },
          ]}
        />
        <View
          style={[
            styles.floatingElement,
            {
              width: 80,
              height: 80,
              bottom: "15%",
              left: "10%",
              opacity: 0.06,
            },
          ]}
        />
        <View
          style={[
            styles.floatingElement,
            {
              width: 40,
              height: 40,
              bottom: "25%",
              right: "20%",
              opacity: 0.1,
            },
          ]}
        />
      </View>

      <View style={styles.contentContainer}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          {/* <View style={styles.logoIcon}>
          <Text style={{ fontSize: 15 }}>🛒</Text>
        </View> */}
          <Text style={styles.heading}>Welcome to Quiklist</Text>
          <Text style={styles.subtitle}>
            Create or join shopping groups with ease
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>✨ Create a New Group</Text>
          <View
            style={[
              styles.inputRow,
              groupNameFocused && styles.inputRowFocused,
            ]}
          >
            <Feather
              name="users"
              size={22}
              color="#3B82F6"
              style={styles.icon}
            />
            <TextInput
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
              style={styles.input}
              // onFocus={() => setGroupNameFocused(true)}
              // onBlur={() => setGroupNameFocused(false)}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.createButton} onPress={createGroup}>
            <Text style={styles.buttonText}>Create Group</Text>
          </TouchableOpacity>
        </View>


        {/* OR Divider */}
        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>🎯 Join a Group</Text>
          <View
            style={[
              styles.inputRow,
              groupCodeFocused && styles.inputRowFocused,
            ]}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={22}
              color="#10B981"
              style={styles.icon}
            />
            <TextInput
              placeholder="Enter group code"
              value={groupCode}
              onChangeText={setGroupCode}
              autoCapitalize="characters"
              style={styles.input}
              // onFocus={() => setGroupCodeFocused(true)}
              // onBlur={() => setGroupCodeFocused(false)}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.joinButton} onPress={joinGroup}>
            <Text style={styles.buttonText}>Join Group</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <AntDesign name="lock" size={20} color="#f59e0b " />
          <Text style={styles.footerText}>
            Private & secure access via group code
          </Text>
        </View>
      </View>

      {/* Success Modal */}
      {showCodeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Group Created!</Text>
            <Text style={styles.modalSubtitle}>
              Share this code with your friends to join:
            </Text>

            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{generatedCode}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  Clipboard.setStringAsync(generatedCode);
                  Alert.alert("✅ Copied!", "Group code copied to clipboard");
                }}
              >
                <Feather name="copy" size={24} color="#1E40AF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                setShowCodeModal(false);
                router.push("/");
              }}
            >
              <Text style={styles.buttonText}>Continue to App</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default GroupScreen;

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // ✅ ensure it's on top
  elevation: 9999, // ✅ for Android layout
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 24,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    color: "#1F2937",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codeText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1E40AF",
    marginRight: 16,
    letterSpacing: 2,
  },
  continueButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "fff",
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  contentContainer: {
    alignItems: "center",
    width: "100%",
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  heading: {
    fontSize: 32,
    fontWeight: "900",
    color: "#334155",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#0ea5e9",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  label: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1F2937",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  inputRowFocused: {
    borderColor: "#3B82F6",
    backgroundColor: "#F0F9FF",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  createButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  joinButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  orLine: {
    flex: 1,
    height: 2,
    backgroundColor: "000",
  },
  orText: {
    color: "#8b5cf6",
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingVertical: 8,
  },
  footer: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  footerText: {
    marginLeft: 8,
    color: "	#f43f5e",
    fontSize: 14,
    fontWeight: "500",
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  floatingElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  floatingElement: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 50,
  },
});
