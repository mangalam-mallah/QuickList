import { db } from "@/firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  arrayRemove,
} from "firebase/firestore";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { useState, useRef, useEffect } from "react";
import {
  Text,
  FlatList,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  TouchableWithoutFeedback,
  StatusBar,
  Button,
  StyleSheet,
} from "react-native";
import { Feather, MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Item = {
  id: string;
  name: string;
  quantity: number;
  bought: boolean;
  createdAt: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState<string>("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const itemAnimations = useRef<Animated.Value[]>([]);

  useEffect(() => {
    itemAnimations.current = items.map(
      (_, i) => itemAnimations.current[i] || new Animated.Value(0)
    );

    const animations = items.map((_, i) =>
      Animated.timing(itemAnimations.current[i], {
        toValue: 1,
        duration: 300,
        delay: i * 100,
        useNativeDriver: true,
      })
    );

    Animated.stagger(50, animations).start();
  }, [items.length]);

  useEffect(() => {
    const fetchGroupAndListen = async () => {
      const groupCode = await AsyncStorage.getItem("groupCode");
      if (!groupCode) return;

      console.log("Using groupCode:", groupCode);

      const unsubscribe = onSnapshot(
        collection(db, `groups/${groupCode}/groceryList`),
        (snapshot) => {
          const itemList = snapshot.docs.map((doc) => {
            const data = doc.data();
            console.log("Real-time update received", snapshot.size);
            // console.log('Grocery updated', snapshot.docs)

            return {
              id: doc.id,
              name: data.name,
              quantity: data.quantity || 1,
              bought: data.bought,
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate().toISOString()
                : data.createdAt,
            };
          });

          setItems(
            itemList.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            )
          );
        }
      );

      return () => unsubscribe();
    };

    fetchGroupAndListen();
  }, []);

  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setModalVisible(false));
  };

  const addItem = async () => {
    if (newItemName.trim() === "") return;
    const quant =
      newItemQuantity.trim() === "" ? 1 : parseInt(newItemQuantity, 10);

    const groupCode = await AsyncStorage.getItem("groupCode");
    if (!groupCode) return;

    try {
      await addDoc(collection(db, `groups/${groupCode}/groceryList`), {
        name: newItemName,
        quantity: quant,
        bought: false,
        createdAt: Timestamp.now(),
      });

      await addDoc(collection(db, `groups/${groupCode}/groceryHistory`), {
        name: newItemName,
        quantity: quant,
        bought: false,
        deleted: false,
        createdAt: Timestamp.now(),
      });

      console.log("Item added to groceryList and History");
      setNewItemName("");
      setNewItemQuantity("");
      closeModal();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const toggleBought = async (id: string) => {
    const groupCode = await AsyncStorage.getItem("groupCode");
    if (!groupCode) return;

    const itemRef = doc(db, `groups/${groupCode}/groceryList`, id);
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, bought: !item.bought } : item
    );
    setItems(updatedItems);

    try {
      const item = items.find((item) => item.id === id);
      if (item) {
        await updateDoc(itemRef, {
          bought: !item.bought,
        });
      }
    } catch (error) {
      console.log("Error while updating bought status: ", error);
    }
  };

  const deleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    Alert.alert("Delete Item", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const groupCode = await AsyncStorage.getItem("groupCode");
          if (!groupCode) return;
          try {
            await deleteDoc(doc(db, `groups/${groupCode}/groceryList`, id));
            const querySnapshot = await getDocs(
              collection(db, `groups/${groupCode}/groceryHistory`)
            );

            querySnapshot.forEach(async (docSnap) => {
              const data = docSnap.data();
              if (data.name === item.name && data.deleted === false) {
                await updateDoc(
                  doc(db, `groups/${groupCode}/groceryHistory`, docSnap.id),
                  {
                    deleted: true,
                  }
                );
              }
            });
          } catch (error) {
            console.log("Error while deleting items");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: Item; index: number }) => {
    const itemAnim = itemAnimations.current[index] || new Animated.Value(1);

    const today = new Date();
    const formattedDate = `${today.getDate()}/${
      today.getMonth() + 1
    }/${today.getFullYear()}`;
    // console.log(formattedDate);

    return (
      <Animated.View
        style={{
          opacity: itemAnim,
          transform: [
            {
              translateY: itemAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}
      >
        <View
          style={[
            styles.card,
            item.bought ? styles.cardBought : styles.cardDefault,
          ]}
        >
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => toggleBought(item.id)}
              style={[
                styles.checkCircle,
                item.bought ? styles.borderBought : styles.borderDefault,
              ]}
            >
              {item.bought && (
                <Feather name="check" size={16} color="#10b981" />
              )}
            </TouchableOpacity>

            <View style={styles.flex1}>
              <Text
                style={[
                  styles.itemText,
                  item.bought ? styles.itemTextBought : styles.itemTextDefault,
                ]}
              >
                {item.name}
              </Text>
              <Text style={styles.quantityText}>Quantity: {item.quantity}</Text>
              {/* <Text style={styles.dateText}>{formattedDate}</Text> */}
            </View>

            <TouchableOpacity
              onPress={() => deleteItem(item.id)}
              style={styles.deleteBtn}
            >
              <Feather name="trash-2" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const leaveGroup = async () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "destructive" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            const groupCode = await AsyncStorage.getItem("groupCode");
            const deviceId = await AsyncStorage.getItem("deviceId");

            if (groupCode && deviceId) {
              const groupRef = doc(db, "groups", groupCode);
              await updateDoc(groupRef, {
                members: arrayRemove({ deviceId }),
              });
            }
            await AsyncStorage.removeItem("groupCode");
            router.replace("/groupScreen");
          } catch (error) {
            console.log("Error while leaving the group", error);
          }
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    cardBought: {
      backgroundColor: "#e2e8f0", // slate-200
    },
    cardDefault: {
      backgroundColor: "#ffffff",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    borderBought: {
      borderColor: "#10b981", // emerald-500
    },
    borderDefault: {
      borderColor: "#d1d5db", // gray-300
    },
    flex1: {
      flex: 1,
    },
    itemText: {
      fontSize: 20,
      fontWeight: "600",
    },
    itemTextBought: {
      color: "#9ca3af", // gray-400
      textDecorationLine: "line-through",
    },
    itemTextDefault: {
      color: "#1f2937", // gray-800
    },
    quantityText: {
      color: "#6b7280", // gray-500
    },
    deleteBtn: {
      padding: 8,
    },

    container: { flex: 1, backgroundColor: "#f8fafc" },
    welcomeContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    headerContainer: { paddingTop: 20, paddingBottom: 12 },
    headerTitle: {
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
      color: "#334155",
      marginTop: 20,
      marginBottom: 8,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      marginTop: 12,
    },
    summaryItem: { flexDirection: "row", alignItems: "center" },
    summaryText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: "500",
      color: "#64748b",
    },
    listContainer: { flex: 1 },
    emptyListContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#94a3b8",
      textAlign: "center",
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 16,
      color: "#94a3b8",
      textAlign: "center",
      marginTop: 8,
    },
    fabRight: {
      position: "absolute",
      bottom: 30,
      right: 30,
    },
    fabLeft: {
      position: "absolute",
      bottom: 30,
      left: 30,
    },
    fabButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#8b5cf6",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#8b5cf6",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    leaveButton: {
      flexDirection: "row",
      backgroundColor: "#ef4444",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    leaveButtonText: {
      color: "#fff",
      marginLeft: 8,
      fontWeight: "600",
    },
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
    modalContainer: {
      width: "85%",
      backgroundColor: "#fff",
      padding: 24,
      borderRadius: 20,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#334155",
      marginBottom: 20,
    },
    inputGroup: { marginBottom: 16 },
    inputLabel: {
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 8,
      color: "#64748b",
    },
    textInput: {
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      backgroundColor: "#f1f5f9",
    },
    modalButtonRow: { flexDirection: "row", justifyContent: "space-between" },
    cancelButton: {
      flex: 1,
      backgroundColor: "#f1f5f9",
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      marginRight: 8,
    },
    cancelButtonText: {
      color: "#64748b",
      fontWeight: "600",
      fontSize: 16,
    },
    addButton: {
      flex: 1,
      backgroundColor: "#8b5cf6",
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      marginLeft: 8,
    },
    addButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* <View style={styles.welcomeContainer}>
        <Text>Welcome to Quiklist!</Text>
        <Button
          title="Go to Group Setup"
          onPress={() => router.push("/groupScreen")}
        />
      </View> */}

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Lets make Shopping easy</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={24}
              color="#64748b"
            />
            <Text style={styles.summaryText}>
              {items.length} {items.length === 1 ? "item" : "items"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/history")}
            style={styles.summaryItem}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color="#64748b"
            />
            <Text style={styles.summaryText}>History</Text>
          </TouchableOpacity>

          <View style={styles.summaryItem}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={24}
              color="#64748b"
            />
            <Text style={styles.summaryText}>
              {items.filter((item) => item.bought).length} completed
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.listContainer}>
        {items.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={80}
              color="#cbd5e1"
            />
            <Text style={styles.emptyTitle}>Your shopping list is empty</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to add items
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        )}
      </View>

      <Animated.View
        style={[styles.fabRight, { transform: [{ scale: buttonAnim }] }]}
      >
        <TouchableOpacity onPress={openModal} style={styles.fabButton}>
          <AntDesign name="plus" size={30} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[styles.fabLeft, { transform: [{ scale: buttonAnim }] }]}
      >
        <TouchableOpacity style={styles.leaveButton} onPress={leaveGroup}>
          <AntDesign name="logout" size={20} color="#fff" />
          <Text style={styles.leaveButtonText}>Leave Group</Text>
        </TouchableOpacity>
      </Animated.View>

      {modalVisible && (
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={styles.modalTitle}>Add New Item</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Item Name</Text>
                <TextInput
                  ref={inputRef}
                  placeholder="e.g., Milk, Bread, Eggs"
                  value={newItemName}
                  onChangeText={setNewItemName}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  placeholder="e.g., 1, 2, 3"
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={addItem} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
}
