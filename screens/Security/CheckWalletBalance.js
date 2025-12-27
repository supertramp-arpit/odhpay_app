import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Theme from "../../components/Theme";

const CheckWalletBalance = () => {
  const navigation = useNavigation();

  const handleNavigate = (screenName,title) => {
    navigation.navigate("SecurityPin",{screenName,title});
  };

  const options = [
    {
      id: 1,
      title: "ODH Rupees",
      subtitle: "Add cash for faster checkout",
      logo: require("../../assets/wallet11.png"),
      redUrl: "odhRupees",
      accent: Theme.colors.primary,
    },
    {
      id: 2,
      title: "ODH Money",
      subtitle: "Track and manage balance",
      logo: require("../../assets/wallet11.png"),
      redUrl: "odhMoney",
      accent: "#10B981",
    },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleNavigate(item?.redUrl,item?.title)}
      activeOpacity={0.8}
    >
      <View style={[styles.logoBadge, { backgroundColor: `${item.accent}0D` }]}>
        {item.icon ? (
          <MaterialIcons name={item.icon} size={26} color={item.accent} />
        ) : (
          <Image source={item.logo} style={styles.bankLogo} />
        )}
      </View>
      <View style={styles.listText}>
        <Text style={styles.bankText}>{item.title}</Text>
        <Text style={styles.bankSubText}>{item.subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={Theme.colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
    
      <View style={styles.section}>
      
        <FlatList
          data={options}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: Theme.spacing.sm,
  },
  hero: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.lg,
  },
  heroBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Theme.colors.secondary + "22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.sm,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.secondary,
    marginBottom: Theme.spacing.xs,
  },
  heroSub: {
    fontSize: 14,
    color: Theme.colors.secondary,
    opacity: 0.8,
    lineHeight: 20,
  },
  section: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
    paddingHorizontal: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginHorizontal: Theme.spacing.sm,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  bankLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    resizeMode: "contain",
  },
  listText: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  bankText: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 4,
  },
  bankSubText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
});

export default CheckWalletBalance;
