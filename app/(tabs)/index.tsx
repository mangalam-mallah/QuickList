import { db } from "@/firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
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
} from "react-native";
import { Feather, MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";

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
    const unsubscribe = onSnapshot(
      collection(db, "groceryList"),
      (snapshot) => {
        const itemList = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              quantity: data.quantity || false,
              bought: data.bought,
              createdAt: data.createdAt
                ? data.createdAt.toDate
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt
                : null,
            };
          })
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

        setItems(itemList);
      }
    );

    return () => unsubscribe();
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

    try {
      await addDoc(collection(db, "groceryList"), {
        name: newItemName,
        quantity: quant,
        bought: false,
        createdAt: Timestamp.now(),
      });

      await addDoc(collection(db, "groceryHistory"), {
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
    const itemRef = doc(db, "groceryList", id);
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
          try {
            await deleteDoc(doc(db, "groceryList", id));
            const querySnapshot = await getDocs(
              collection(db, "groceryHistory")
            );

            querySnapshot.forEach(async (docSnap) => {
              const data = docSnap.data();
              if (data.name === item.name && data.deleted === false) {
                await updateDoc(doc(db, "groceryHistory", docSnap.id), {
                  deleted: true,
                });
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
          className={`mx-4 my-2 p-4 rounded-xl shadow ${
            item.bought ? "bg-slate-200" : "bg-white"
          }`}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => toggleBought(item.id)}
              className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                item.bought ? "border-emerald-500" : "border-gray-300"
              }`}
            >
              {item.bought && (
                <Feather name="check" size={16} color="#10b981" />
              )}
            </TouchableOpacity>

            <View className="flex-1">
              <Text
                className={`text-2xl font-semibold ${
                  item.bought ? "text-gray-400 line-through" : "text-gray-800"
                }`}
              >
                {item.name}
              </Text>
              <Text className="text-gray-500 ">Quantity: {item.quantity}</Text>
              {/* <Text className="text-gray-400 text-xs">{formattedDate}</Text> */}
            </View>

            <TouchableOpacity
              onPress={() => deleteItem(item.id)}
              className="p-2"
            >
              <Feather name="trash-2" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View className="pt-5 pb-3">
        <Text className="text-2xl font-bold text-center text-slate-700 mt-7 mb-2">
          Lets make Shopping easy
        </Text>

        <View className="flex-row items-center justify-between px-5 mt-4">
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="cart-outline"
              size={24}
              color="#64748b"
            />
            <Text className="ml-2 text-base font-medium text-slate-500">
              {items.length} {items.length === 1 ? "item" : "items"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/history")}
            className="flex-row items-center"
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color="#64748b"
            />
            <Text className="ml-2 text-base font-medium text-slate-500">
              History
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={24}
              color="#64748b"
            />
            <Text className="ml-2 text-base font-medium text-slate-500">
              {items.filter((item) => item.bought).length} completed
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1">
        {items.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <MaterialCommunityIcons
              name="cart-outline"
              size={80}
              color="#cbd5e1"
            />
            <Text className="text-xl font-bold text-slate-400 text-center mt-4">
              Your shopping list is empty
            </Text>
            <Text className="text-base text-slate-400 text-center mt-2">
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
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          transform: [{ scale: buttonAnim }],
        }}
      >
        <TouchableOpacity
          onPress={openModal}
          className="w-15 h-15 rounded-full bg-purple-500 items-center justify-center shadow-lg shadow-purple-300"
          style={{ width: 60, height: 60 }}
        >
          <AntDesign name="plus" size={30} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      {modalVisible && (
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              opacity: fadeAnim,
            }}
            className="items-center justify-center"
          >
            <Animated.View
              className="w-[85%] bg-white p-6 rounded-2xl"
              style={{
                transform: [{ scale: scaleAnim }],
              }}
            >
              <Text className="text-2xl font-bold mb-5 text-slate-700">
                Add New Item
              </Text>

              <View className="mb-4">
                <Text className="text-base font-medium mb-2 text-slate-500">
                  Item Name
                </Text>
                <TextInput
                  ref={inputRef}
                  placeholder="e.g., Milk, Bread, Eggs"
                  value={newItemName}
                  onChangeText={setNewItemName}
                  className="border border-slate-200 rounded-xl p-4 text-base bg-slate-50"
                />
              </View>

              <View className="mb-6">
                <Text className="text-base font-medium mb-2 text-slate-500">
                  Quantity
                </Text>
                <TextInput
                  placeholder="e.g., 1, 2, 3"
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="numeric"
                  className="border border-slate-200 rounded-xl p-4 text-base bg-slate-50"
                />
              </View>

              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={closeModal}
                  className="flex-1 bg-slate-100 py-4 rounded-xl items-center mr-2"
                >
                  <Text className="text-slate-500 font-semibold text-base">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={addItem}
                  className="flex-1 bg-purple-500 py-4 rounded-xl items-center ml-2"
                >
                  <Text className="text-white font-semibold text-base">
                    Add Item
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
}
