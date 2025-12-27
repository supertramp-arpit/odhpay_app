import React from "react";
import { View, Text, StyleSheet, FlatList, ScrollView } from "react-native";
import Theme from "./Theme";
import { useNavigation } from "@react-navigation/native";

const Reward = () => {
  const navigation = useNavigation();
  const tableData = Array.from({ length: 10 }, (_, j) => ({
    srNo: j + 1,
    userId: `U100${j + 1}`,
    name: `User ${j + 1}`,
    sponserId: `S200${j + 1}`,
    mobile: `98XXXXXX${j + 1}8`,
    joiningDate: `2025-01-${String(j + 1).padStart(2, "0")}`,
    activationDate: `2025-01-${String(j + 5).padStart(2, "0")}`,
    package: `₹${(j + 1) * 1000}`,
    directIncome: `₹${(j + 1) * 1000}`, // Same as package
  }));

  return (
    <View style={styles.container}>
      <View style={styles.levelContainer}>
        <Text style={styles.levelTitle}>Reward Income</Text>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator
        >
          <View style={styles.table}>
            {/* ✅ Table Header */}
            <View style={styles.tableRowHeader}>
              {[
                "Sr No.",
                "User-ID",
                "Name",
                "SponserID",
                "Mobile",
                "Joining Date",
                "Activation Date",
                "Reward Income",
                "Package",
              ].map((header, index) => (
                <Text
                  key={index}
                  style={[
                    styles.tableCell,
                    styles.headerCell,
                    index === 0 ? styles.srNoCell : {}, // Custom width for "Sr No."
                  ]}
                >
                  {header}
                </Text>
              ))}
            </View>

            {/* ✅ FlatList for vertical scrolling */}
            <FlatList
              data={tableData}
              keyExtractor={(item) => item.userId}
              nestedScrollEnabled
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: index % 2 === 0 ? "#E6F9E6" : "#FFFFFF",
                    }, // Alternating colors
                  ]}
                >
                  <Text style={[styles.tableCell, styles.srNoCell]}>
                    {item.srNo}
                  </Text>
                  <Text style={styles.tableCell}>{item.userId}</Text>
                  <Text style={styles.tableCell}>{item.name}</Text>
                  <Text style={styles.tableCell}>{item.sponserId}</Text>
                  <Text style={styles.tableCell}>{item.mobile}</Text>
                  <Text style={styles.tableCell}>{item.joiningDate}</Text>
                  <Text style={styles.tableCell}>{item.activationDate}</Text>
                  <Text style={[styles.tableCell, styles.levelText]}>{item.directIncome}</Text>
                  <Text style={[styles.tableCell, styles.packageData]}>{item.package}</Text>
                </View>
              )}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Theme.colors.secondary,
  },
  levelContainer: {
    marginBottom: 30,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.primary,
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderRadius: 8,
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: Theme.colors.primary,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
  },
  tableCell: {
    minWidth: 70,
    textAlign: "center",
    padding: 10,
    fontSize: 10,
  },
  srNoCell: {
    minWidth: 50,
  },
  headerCell: {
    fontWeight: "bold",
    color: Theme.colors.secondary,
  },
  packageData: {
    textAlign: "right",
    paddingLeft:30,
  },
  levelText: {
    textAlign: "right",
    paddingLeft: 40, 
  }
});

export default Reward;