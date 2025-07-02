import { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  getDocs,
  collection,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getWeek } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Item = {
  id: string;
  name: string;
  quantity: number;
  bought: boolean;
  createdAt: string;
  deleted?: boolean;
};

export default function HistoryScreen() {
  const [historyItems, setHistoryItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupMode, setGroupMode] = useState<"month" | "week">("month");

  const groupItems = (historyItems: any[], mode: "week" | "month") => {
    return historyItems.reduce((groups: any, item) => {
      const date = new Date(item.createdAt);
      let key = "";
      if (mode == "week") {
        const week = getWeek(date);
        key = `Week ${week} - ${date.getFullYear()}`;
      } else if (mode == "month") {
        key = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  };

  const grouped = groupItems(historyItems, groupMode);
  const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const querySnapshots = await getDocs(collection(db, "groceryHistory"));
        const items = querySnapshots.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            quantity: data.quantity,
            bought: data.bought,
            createdAt: data.createdAt
              ? data.createdAt.toDate
                ? data.createdAt.toDate().toISOString()
                : data.createdAt
              : null,
          };
        });
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHistoryItems(items);
      } catch (error) {
        console.log("Error while fetching the history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const cleanupOldHistory = async () => {
      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const currentYear = now.getFullYear();

        const lastCleanup = await AsyncStorage.getItem("lastCleanup");
        if (lastCleanup) {
          const lastCleanupDate = new Date(lastCleanup);
          const lastCleanupMonth = lastCleanupDate.getMonth();
          const lastCleanupYear = lastCleanupDate.getFullYear();

          if (lastCleanupMonth === currentMonth && lastCleanupYear === currentYear) {
            console.log("Cleanup already done this month, skipping.");
            return;
          }
        }

        console.log("Running monthly cleanup...");

        const querySnapshot = await getDocs(collection(db, "groceryHistory"));
        querySnapshot.forEach(async (document) => {
          const data = document.data();
          if (data.createdAt) {
            const itemDate = new Date(data.createdAt.toDate());
            const itemMonth = itemDate.getMonth();
            const itemYear = itemDate.getFullYear();

            if (itemYear < currentYear || (itemYear === currentYear && itemMonth < previousMonth)) {
              await deleteDoc(doc(db, "groceryHistory", document.id));
              console.log(`Deleted item from ${itemDate}`);
            }
          }
        });

        await AsyncStorage.setItem("lastCleanup", now.toISOString());

        console.log("Monthly cleanup complete.");
      } catch (error) {
        console.error("Error deleting old history", error);
      }
    };

    cleanupOldHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>History</Text>

      <View style={styles.buttonRow}>
        {/* <TouchableOpacity onPress={() => setGroupMode('week')}>
          <Text style={groupMode === 'week' ? styles.selectedTab : styles.unselectedTab}>Week</Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={() => setGroupMode("month")}>
          <Text style={groupMode === "month" ? styles.selectedTab : styles.unselectedTab}>Month</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6b7280" />
      ) : historyItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="history" size={80} color="#cbd5e1" />
          <Text style={styles.emptyText}>No Items in History</Text>
        </View>
      ) : (
        <ScrollView>
          {sortedKeys.map((group) => (
            <View key={group} style={styles.groupSection}>
              <Text style={styles.groupHeading}>{group}</Text>
              {grouped[group].map((item: any) => (
                <View key={item.id} style={styles.card}>
                  <Text
                    style={[
                      styles.itemText,
                      item.deleted && {
                        textDecorationLine: "line-through",
                        color: "red",
                      },
                    ]}
                  >
                    {item.name} {item.deleted ? "(Deleted)" : ""}
                  </Text>
                  <Text style={styles.itemSub}>Quantity: {item.quantity}</Text>
                  <Text style={styles.itemTime}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // slate-50
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#334155", // slate-700
    textAlign: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  selectedTab: {
    fontWeight: "bold",
    color: "#8b5cf6", // purple-500
  },
  unselectedTab: {
    color: "#64748b", // slate-500 (optional)
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#334155", // slate-700
    marginTop: 16,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupHeading: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemSub: {
    color: "#6b7280", // gray-500
  },
  itemTime: {
    color: "#94a3b8", // gray-400
    fontSize: 12,
  },
});
