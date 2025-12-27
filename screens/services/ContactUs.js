import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import Theme from "../../components/Theme";

const ContactUs = ({ navigation }) => {
  const [problem, setProblem] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  const handleCallNow = () => {
    Alert.alert("Calling Support...", "Support Number: 1800-123-456");
  };

  const handleUploadScreenshot = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setScreenshot(result.uri);
    }
  };

  const handleSendRequest = () => {
    if (!problem) {
      Alert.alert("Error", "Please enter your problem in brief.");
      return;
    }
    Alert.alert("Request Sent", "Your query has been submitted.");
  };

  return (
    <View style={styles.container}>

      {/* Support Information */}
      <View style={styles.supportContainer}>
        <Image
          source={require("../../assets/User.png")}
          style={styles.supportImage}
        />
        <Text style={styles.supportText}>If you have any query</Text>
        <Text style={styles.supportSubText}>
          Feel free to mail us on
        </Text>
        <Text style={styles.supportEmail}>support@{Theme.Text.Company}.com</Text>

        <TouchableOpacity style={styles.callButton} onPress={handleCallNow}>
          <Text style={styles.callButtonText}>Call Now</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Problem Report Section */}
      <Text style={styles.orText}>OR</Text>
      <Text style={styles.noComplaintText}>No Complaint</Text>
      <Text style={styles.label}>Problem in brief</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe your problem"
        value={problem}
        onChangeText={setProblem}
        multiline
      />

      <Text style={styles.label}>Screenshot Image (Your Problem) *</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={handleUploadScreenshot}>
        <Ionicons name="cloud-upload-outline" size={24} color="orange" />
        <Text style={styles.uploadButtonText}>Uploads</Text>
      </TouchableOpacity>
      {screenshot && (
        <Image source={{ uri: screenshot }} style={styles.previewImage} />
      )}

      {/* Submit Button */}
      <TouchableOpacity style={styles.sendButton} onPress={handleSendRequest}>
        <Text style={styles.sendButtonText}>Send Request</Text>
      </TouchableOpacity>
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: "#00aaff",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.secondary,
    marginLeft: 10,
  },
  supportContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  supportImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  supportText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  supportSubText: {
    fontSize: 14,
    color: "#666",
  },
  supportEmail: {
    fontSize: 14,
    color: "green",
    textDecorationLine: "underline",
    marginBottom: 15,
  },
  callButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  callButtonText: {
    color: Theme.colors.secondary,
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 20,
  },
  orText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#666",
  },
  noComplaintText: {
    fontSize: 16,
    color: "red",
    fontWeight: "bold",
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
    backgroundColor: Theme.colors.secondary,
    textAlignVertical: "top",
    height: 100,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  uploadButtonText: {
    fontSize: 16,
    color: "orange",
    marginLeft: 5,
  },
  previewImage: {
    width: width * 0.8,
    height: 150,
    borderRadius: 10,
    marginTop: 10,
  },
  sendButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  sendButtonText: {
    color: Theme.colors.secondary,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ContactUs;
