import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const PaymentScreen = () => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const route = useRoute();
  const { UserName, userMobile } = route.params;

  const navigation = useNavigation();

  useEffect(() => {
    console.log(UserName, userMobile);
  }, [])



  // Get recipient data from route params or use default values
  // const params = route?.params || {};
  const recipient = {
    name: UserName || 'DEEPAK CHOUBEY SO SAC...',
    upiId: userMobile || 'udayshankarchaubey903@oksbi',
    initials: UserName.slice(0, 2) || 'DC'
  };

  const handleBack = () => {
    navigation?.goBack();
  };

  const handleProceed = () => {
    if (!amount || amount === '0') {
      alert('Please enter a valid amount');
      return;
    }

    navigation.navigate("ScanPayScreenPin", {
      amount: amount,
      mobile_number: userMobile,
      recipient_name: UserName
    });

    // Handle payment logic here
    console.log('Proceeding with payment:', { amount, message, recipient });
    // Navigate to confirmation or processing screen
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.helpButton} onPress={() => alert('Help clicked!')}>
          <Ionicons name="help-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  return (
    <View style={styles.container}>

      {/* Main Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.card}>
          {/* Recipient Info */}
          <View style={styles.recipientContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{recipient.initials}</Text>
            </View>
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientName}>{recipient.name}</Text>
              <Text style={styles.recipientUpi}>{recipient.upiId}</Text>
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="#6c6c7d"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Message Input */}
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Add a message (optional)"
              placeholderTextColor="#6c6c7d"
              value={message}
              onChangeText={setMessage}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Button */}
      <TouchableOpacity
        style={[styles.proceedButton, !amount && styles.disabledButton]}
        onPress={handleProceed}
        disabled={!amount}
      >
        <Text style={styles.proceedButtonText}>PROCEED TO PAY</Text>
      </TouchableOpacity>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative"
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'green',
    fontSize: 20,
    fontWeight: '500',
  },
  helpButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  recipientInfo: {
    marginLeft: 12,
    flex: 1,
  },
  recipientName: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
  },
  recipientUpi: {
    color: 'green',
    fontSize: 14,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 56,
    borderL: 1,
    borderColor: "green",
  },
  rupeeSymbol: {
    color: 'green',
    fontSize: 25,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: 'black',
    fontSize: 18,
    height: '100%',
  },
  messageContainer: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 56,
    borderL: 1,
    borderColor: "green",
  },
  messageInput: {
    flex: 1,
    color: 'black',
    fontSize: 16,
    height: '100%',
  },
  proceedButton: {
    position: "absolute",
    margin: "auto",
    width: "90%",
    bottom: 10,
    backgroundColor: 'green',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'black',
    height: 56,
  },
  navButton: {
    padding: 8,
  },
});

export default PaymentScreen;