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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ConfettiCannon from "react-native-confetti-cannon";

type RootStackParamList = {
  GroupScreen: undefined;
  index: undefined;
  history: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "GroupScreen">;
};

const GroupScreen: React.FC<Props> = ({ navigation }) => {
  const router = useRouter();
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

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
        navigation.navigate("index");
      }
    };

    checkGroup();
  }, []);

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Please enter a group name");
      return;
    }
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(newCode);
    setShowCodeModal(true); // Show modal

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
      <Text style={styles.heading}>Welcome to Quiklist 🛒</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Create a New Group</Text>
        <View style={styles.inputRow}>
          <Feather name="users" size={20} color="#6B7280" style={styles.icon} />
          <TextInput
            placeholder="Group name"
            value={groupName}
            onChangeText={setGroupName}
            style={styles.input}
          />
        </View>
        <TouchableOpacity style={styles.createButton} onPress={createGroup}>
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>
      </View>
      {showConfetti && (
        <ConfettiCannon count={100} origin={{ x: 200, y: 0 }} fadeOut />
      )}

      <Text style={styles.orText}>— OR —</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Join a Group</Text>
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            color="#6B7280"
            style={styles.icon}
          />
          <TextInput
            placeholder="Group code"
            value={groupCode}
            onChangeText={setGroupCode}
            autoCapitalize="characters"
            style={styles.input}
          />
        </View>
        <TouchableOpacity style={styles.joinButton} onPress={joinGroup}>
          <Text style={styles.buttonText}>Join Group</Text>
        </TouchableOpacity>
      </View>

      {showCodeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Group Created!</Text>
            <Text style={styles.modalSubtitle}>Share this code to join:</Text>

            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{generatedCode}</Text>
              <TouchableOpacity
                onPress={() => {
                  Clipboard.setStringAsync(generatedCode);
                  Alert.alert("Copied to Clipboard");
                }}
              >
                <Feather name="copy" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                setShowCodeModal(false);
                router.push("/");
              }}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <AntDesign name="lock" size={18} color="#6B7280" />
        <Text style={styles.footerText}>
          Private & secure access via group code
        </Text>
      </View>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginBottom: 24,
  },
  codeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B82F6",
    marginRight: 12,
  },
  continueButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },

  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButton: {
    backgroundColor: "#10B981",
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
  orText: {
    color: "#9CA3AF",
    fontSize: 14,
    marginVertical: 8,
  },
  footer: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    marginLeft: 8,
    color: "#6B7280",
    fontSize: 14,
  },
});
