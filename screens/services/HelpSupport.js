import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const faqData = [
  { id: "1", question: "How do I reset my PIN?", answer: "Go to Settings > Security > Reset PIN and follow the prompts." },
  { id: "2", question: "Why is my payment pending?", answer: "Most payments clear instantly. If pending, it usually resolves within 5-10 minutes." },
  { id: "3", question: "How can I contact support?", answer: "Email help@odhpay.com or call +91 90000 00000 between 9am-6pm IST." },
];

const HelpSupport = () => {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.question}>{item.question}</Text>
      <Text style={styles.answer}>{item.answer}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={faqData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 6,
  },
  answer: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
});

export default HelpSupport;
