import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Theme from "../Theme";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 360;

const BottomNavigation = ({
  navigation,
  OpenScanner,
  activeRoute = "Home",
}) => {
  const navItems = [
    {
      name: "Home",
      icon: "home",
      color: "#fff",
      onPress: () => navigation.navigate("MainApp", { screen: "HomeTab" }),
      route: "HomeScreen",
    },
    {
      name: "Travel",
      icon: "mode-of-travel",
      color: "yellow",
      onPress: () => navigation.navigate("Home"),
      route: "Home",
    },
    {
      name: "Scan",
      icon: "qr-code-scanner",
      color: Theme.colors.primary,
      onPress: OpenScanner,
      route: "Scan",
      isCenter: true,
    },
    {
      name: "History",
      icon: "swap-horiz",
      color: "skyblue",
      onPress: () => navigation.navigate("History"),
      route: "History",
    },
    {
      name: "More",
      icon: "more",
      color: "pink",
      onPress: () => navigation.navigate("AllServices"),
      route: "AllServices",
    },
  ];

  return (
    <View style={styles.bottomNavigation}>
      {navItems.map((item, index) => (
        item.isCenter ? (
          <TouchableOpacity
            key={index}
            style={styles.bottomNavItem}
            onPress={item.onPress}
          >
            <View style={styles.centerButton}>
              <View style={styles.circle}>
                <MaterialIcons
                  name={item.icon}
                  size={45}
                  color={item.color}
                />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            key={index}
            style={[
              styles.bottomNavItem,
              activeRoute === item.route && styles.activeNavItem,
            ]}
            onPress={item.onPress}
          >
            <MaterialIcons name={item.icon} size={24} color={item.color} />
            <Text style={styles.bottomNavText}>{item.name}</Text>
          </TouchableOpacity>
        )
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: Theme.colors.BottomNav,
  },
  bottomNavItem: {
    alignItems: "center",
    flex: 1,
  },
  activeNavItem: {
    opacity: 0.8,
  },
  bottomNavText: {
    color: Theme.colors.secondary,
    fontSize: isSmallDevice ? 11 : 12,
    marginTop: 5,
  },
  centerButton: {
    position: "absolute",
    bottom: "-15",
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 60,
    backgroundColor: Theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
});

export default BottomNavigation;
