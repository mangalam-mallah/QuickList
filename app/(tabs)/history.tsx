import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { getDocs, collection, deleteDoc, doc } from "firebase/firestore";
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
  deleted ?: boolean
};
export default function history() {
  const [historyItems, setHistoryItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupMode, setGroupMode] = useState<"month" | "week">("month")

  const groupItems = (historyItems : any[], mode : "week" | "month") => {
    return historyItems.reduce((groups : any, item) => {
      const date = new Date(item.createdAt);
      let key = "";
      if(mode == "week"){
        const week = getWeek(date)
        key = `Week ${week} - ${date.getFullYear()}`
      } else if(mode == 'month'){
        key = `${date.toLocaleString("default", { month : "long"})} ${date.getFullYear()}`
      }

      if(!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  }

  const grouped = groupItems(historyItems, groupMode);
  const sortedKeys = Object.keys(grouped).sort((a,b) => a.localeCompare(b));

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
              ? data.createdAt.toDate()
                ? data.createdAt.toDate().toISOString()
                : data.createdAt
              : null,
          };
        });
        items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
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
    <View className="flex-1 bg-slate-50 p-4">
      <Text className="text-2xl font-bold text-center text-slate-700 mb-4 mt-8">History</Text>
  
      <View className="flex-row justify-around space-x-4 mb-4">
        {/* <TouchableOpacity onPress={() => setGroupMode('week')}>
          <Text className={groupMode === 'week' ? "font-bold text-purple-500" : ""}>Week</Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={() => setGroupMode('month')}>
          <Text className={groupMode === 'month' ? "font-bold text-purple-500" : ""}>Month</Text>
        </TouchableOpacity>
      </View>
  
      {historyItems.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <MaterialCommunityIcons name="history" size={80} color="#cbd5e1" />
          <Text className="text-lg font-medium text-slate-700 mt-4">No Items in History</Text>
        </View>
      ) : (
        <ScrollView>
          {sortedKeys.map((group) => (
            <View key={group} className="mb-4">
              <Text className="font-bold text-lg mb-2">{group}</Text>
              {grouped[group].map((item: any) => (
                <View key={item.id} className="bg-white p-4 mb-2 rounded-xl shadow">
                  <Text style={{
                    textDecorationLine: item.deleted ? "line-through" : "none",
                    color: item.deleted ? "red" : "black",
                    fontSize: 16,
                    marginBottom: 4,
                  }}>
                    {item.name} {item.deleted ? "(Deleted)" : ""}
                  </Text>
                  <Text className="text-gray-500">Quantity : {item.quantity}</Text>
                  <Text className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
