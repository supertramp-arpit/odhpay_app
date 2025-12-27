import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
  BackHandler,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Theme from "./Theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const MAX_AMOUNT = 100000; // Maximum allowed amount
const MIN_AMOUNT = 1; // Minimum allowed amount

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { recipientNumber, recipientName } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showSenderInfo, setShowSenderInfo] = useState(false);
  const [upiIssueModal, setUpiIssueModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  // Handle keyboard show/hide events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        // Scroll to end when keyboard appears
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Helper function to extract numeric amount from input
  const extractAmount = (text) => {
    const cleanText = text.replace(/^₹/, "").trim();
    return cleanText ? parseFloat(cleanText) : 0;
  };

  // Validate if input is a valid amount
  const isValidAmount = (text) => {
    const cleanText = text.replace(/^₹/, "").trim();
    // Check if it's a valid positive number (allows decimals)
    return /^\d+(\.\d{0,2})?$/.test(cleanText) && parseFloat(cleanText) > 0;
  };

  // Check if input looks like an amount entry (starts with digit or ₹)
  const isAmountInput = (text) => {
    const cleanText = text.replace(/^₹/, "").trim();
    return /^\d/.test(cleanText);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const checkBankServer = async () => {
    // Simulate an API call to check bank status (Replace with real API call)
    const isServerDown = true; // Set dynamically based on real API response
    return isServerDown;
  };

  const handleInputChange = (text) => {
    // Clear any previous error
    setAmountError("");
    
    // Remove the rupee symbol for processing
    let cleanText = text.replace(/^₹/, "").trim();
    
    // Block negative signs, plus signs, and other invalid characters
    if (cleanText.includes("-") || cleanText.includes("+") || cleanText.includes("e") || cleanText.includes("E")) {
      setAmountError("Invalid characters not allowed");
      return;
    }
    
    // Check if input starts with a digit (amount mode)
    if (/^\d/.test(cleanText)) {
      // Only allow numbers and one decimal point with max 2 decimal places
      const validAmountPattern = /^\d*\.?\d{0,2}$/;
      
      if (!validAmountPattern.test(cleanText)) {
        // If invalid, don't update the input
        return;
      }
      
      const amount = parseFloat(cleanText) || 0;
      
      // Validate amount range
      if (amount > MAX_AMOUNT) {
        setAmountError(`Maximum amount is ₹${MAX_AMOUNT.toLocaleString()}`);
        return;
      }
      
      setInputText(`₹${cleanText}`);
      setShowSenderInfo(true);
    } else {
      // Text message mode
      setInputText(text.replace(/^₹/, ""));
      setShowSenderInfo(false);
    }
  };

  const handleSendMessage = () => {
    const trimmedText = inputText.trim();
    
    // Don't send if empty or if it's an amount (amounts use Pay button)
    if (!trimmedText || isAmountInput(trimmedText)) return;

    const newMessage = {
      id: Date.now(),
      date: "Today",
      text: trimmedText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: "me",
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputText("");
    setAmountError("");

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handlePay = () => {
    const cleanAmount = inputText.replace(/^₹/, "").trim();
    const amount = parseFloat(cleanAmount);
    
    // Validate amount before proceeding
    if (!amount || isNaN(amount)) {
      setAmountError("Please enter a valid amount");
      return;
    }
    
    if (amount < MIN_AMOUNT) {
      setAmountError(`Minimum amount is ₹${MIN_AMOUNT}`);
      return;
    }
    
    if (amount > MAX_AMOUNT) {
      setAmountError(`Maximum amount is ₹${MAX_AMOUNT.toLocaleString()}`);
      return;
    }
    
    // Clear error and proceed to payment
    setAmountError("");
    navigation.navigate("SelfPaymentPin", {
      amount: `₹${amount}`,
      mobile_number: recipientNumber,
      recipient_name: recipientName,
    });
  };

  // Check if pay button should be enabled
  const canPay = () => {
    const cleanAmount = inputText.replace(/^₹/, "").trim();
    if (!cleanAmount || !/^\d+(\.\d{0,2})?$/.test(cleanAmount)) return false;
    const amount = parseFloat(cleanAmount);
    return amount >= MIN_AMOUNT && amount <= MAX_AMOUNT && !amountError;
  };


  // ========================================================================================
  // Fetch transaction history - Using Dummy Data
  // ========================================================================================

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      
      // Dummy transaction data
      const dummyTransactionData = [
        {
          id: 1,
          amount: 500,
          sent_date: new Date().toISOString(),
          trans_type: "sent",
          receiver_name: recipientName || "User",
          receiver_mobile: recipientNumber
        },
        {
          id: 2,
          amount: 1200,
          sent_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          trans_type: "received",
          receiver_name: recipientName || "User",
          receiver_mobile: recipientNumber
        },
        {
          id: 3,
          amount: 250,
          sent_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          trans_type: "sent",
          receiver_name: recipientName || "User",
          receiver_mobile: recipientNumber
        },
        {
          id: 4,
          amount: 3000,
          sent_date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          trans_type: "received",
          receiver_name: recipientName || "User",
          receiver_mobile: recipientNumber
        },
        {
          id: 5,
          amount: 750,
          sent_date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          trans_type: "sent",
          receiver_name: recipientName || "User",
          receiver_mobile: recipientNumber
        }
      ];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Transform dummy data to message format
      const formattedMessages = dummyTransactionData.map((transaction, index) => {
        return {
          id: transaction.id,
          date: formatDate(transaction.sent_date),
          amount: transaction.amount > 0 ? `₹${transaction.amount}` : "₹0",
          time: formatTime(transaction.sent_date),
          sender: transaction.trans_type === "sent" ? "me" : "other",
          receiverName: transaction.receiver_name,
          receiverMobile: transaction.receiver_mobile
        };
      });

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching transaction history:", error.message);
      Alert.alert(
        "Error",
        "Failed to load transaction history. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchTransactionHistory();
  }, []);




  // ============================================================================================
  // Navigate to the HomeScreen (solving the stacking issue )
  // ============================================================================================


  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('MainApp', { screen: 'HomeTab' }); // Navigate to MainApp
        return true; // Prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [navigation])
  );


  // Dismiss keyboard when tapping outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{recipientName?.charAt(0) || "U"}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{recipientName || "User"}</Text>
            <Text style={styles.userPhone}>{recipientNumber}</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <Feather name="clock" size={24} color="white" style={styles.icon} />
          <Feather
            name="help-circle"
            size={24}
            color="white"
            style={styles.icon}
          />
          <Feather
            name="more-vertical"
            size={24}
            color="white"
            style={styles.icon}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading transaction history...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="message-circle" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubText}>Start by sending money or a message</Text>
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 10, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (isKeyboardVisible) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageContainer,
                item.sender === "me"
                  ? styles.sentMessage
                  : styles.receivedMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.sender === "me"
                    ? styles.sentBubble
                    : styles.receivedBubble,
                  item.sender === "me"
                    ? { alignSelf: "flex-end" }
                    : { alignSelf: "flex-start" },
                ]}
              >
                <Text style={styles.date}>{item.date}</Text>
                {item.text && <Text style={styles.messageText}>{item.text}</Text>}

                {item.amount && <Text style={styles.amount}>{item.amount}</Text>}

                {item.image && (
                  <Image source={{ uri: item.image }} style={styles.sentImage} />
                )}

                <View style={styles.upperBorder}></View>

                {item.sender === "me" ? (
                  <Text style={styles.status}>✅ Sent Securely</Text>
                ) : (
                  <Text style={styles.receivedStatus}>✅ Received Instantly</Text>
                )}
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>
          )}
          />
        </TouchableWithoutFeedback>
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {/* Amount Error Message */}
        {amountError ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={14} color="#E53935" />
            <Text style={styles.errorText}>{amountError}</Text>
          </View>
        ) : null}
        
        {/* Amount hint when entering amount */}
        {showSenderInfo && !amountError && inputText.length > 1 ? (
          <View style={styles.amountHintContainer}>
            <Text style={styles.amountHintText}>
              Sending to {recipientName || "User"}
            </Text>
          </View>
        ) : null}
        
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={[styles.input, amountError ? styles.inputError : null]}
            placeholder="Enter amount or message"
            placeholderTextColor="#999"
            value={inputText}
            keyboardType={showSenderInfo ? "numeric" : "default"}
            onChangeText={handleInputChange}
            maxLength={15}
            returnKeyType={isAmountInput(inputText) ? "done" : "send"}
            onSubmitEditing={() => {
              if (isAmountInput(inputText)) {
                if (canPay()) handlePay();
              } else {
                handleSendMessage();
              }
            }}
            blurOnSubmit={false}
          />

          {isAmountInput(inputText) ? (
            <TouchableOpacity 
              onPress={handlePay} 
              style={[
                styles.payButton,
                !canPay() && styles.payButtonDisabled
              ]}
              disabled={!canPay()}
            >
              <Text style={[
                styles.payButtonText,
                !canPay() && styles.payButtonTextDisabled
              ]}>Pay</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Feather
                name="send"
                size={24}
                style={[
                  styles.inputIcon,
                  { color: inputText.trim() ? "#007BFF" : "#ccc" },
                ]}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EBE8FC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: Theme.colors.primary,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.primary,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  userPhone: {
    color: "#ccc",
    fontSize: 12,
  },
  headerIcons: {
    flexDirection: "row",
  },
  icon: {
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
  messageContainer: {
    marginHorizontal: 15,
    marginVertical: 5,
  },
  sentMessage: {
    alignItems: "flex-end",
  },
  receivedMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    padding: 15,
    borderRadius: 15,
    maxWidth: "75%",
    minWidth: "40%",
    position: "relative",
  },
  sentBubble: {
    backgroundColor: "#D1F4C9", // Light green for sent messages
    borderBottomRightRadius: 5,
  },
  receivedBubble: {
    backgroundColor: "#FFFFFF", // White for received messages
    borderBottomLeftRadius: 5,
  },
  date: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  sentImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginTop: 5,
  },
  upperBorder: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    marginTop: 8,
    marginBottom: 5,
  },
  status: {
    color: "green",
    fontSize: 12,
  },
  receivedStatus: {
    color: "green",
    fontSize: 12,
  },
  time: {
    fontSize: 11,
    color: "#888",
    alignSelf: "flex-end",
    marginTop: 2,
  },
  inputContainer: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: "#E53935",
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "500",
  },
  amountHintContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  amountHintText: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
  },
  inputError: {
    color: "#E53935",
  },
  inputIcon: {
    marginLeft: 10,
  },
  payButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  payButtonDisabled: {
    backgroundColor: "#B0BEC5",
    elevation: 0,
    shadowOpacity: 0,
  },
  payButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  payButtonTextDisabled: {
    color: "#ECEFF1",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    width: "85%",
    elevation: 5,
  },
  issueImage: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#E53935", // Red color for warning
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  continueText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChatScreen;