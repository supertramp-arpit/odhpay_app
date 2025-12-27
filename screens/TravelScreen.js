import React from "react";
import { View, StyleSheet } from "react-native";
import Theme from "../components/Theme";
import SearchScreen from "./Travel/SearchScreen";

const TravelScreen = () => {
  return (
    <View style={styles.container}>
      <SearchScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
});

export default TravelScreen;
