import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, SafeAreaView, StyleSheet } from 'react-native';
// import PhonePePaymentSDK from 'react-native-phonepe-pg';
import Base64 from 'react-native-base64';
import sha256 from 'sha256';

// const [amount, setAmount] = useState('12');
// const [mobileNumber, setMobileNumber] = useState('9315116749');

const merchantId = 'PGTESTPAYUAT86'; // Replace with your actual Merchant ID
const saltKey = '96434309-7796-489d-8924-ab56988a6076'; // Replace with actual Salt Key
const saltIndex = 1; // Replace with actual Salt Index
const environment = 'SANDBOX'; // Change to 'PRODUCTION' for live payments
const appId = 'YOUR_APP_ID'; // Replace with your actual App ID



// Initialize PhonePe SDK
const initSDK = async () => {
  try {
    const result = ""
    // await PhonePePaymentSDK.init(environment, merchantId, appId, true);
    console.log('SDK Initialized:', result);
    return true;
  } catch (error) {
    console.error('SDK Initialization Error:', error);
    Alert.alert('Error', 'Failed to initialize PhonePe SDK.');
    return false;
  }
};


const generateChecksum = (base64Payload) => {
  const apiEndPoint = "/pg/v1/pay";
  const checksumString = base64Payload + apiEndPoint + saltKey;
  const checksumHash = sha256(checksumString);
  return `${checksumHash}###${saltIndex}`;
};



export const handlePayment = async (amount, mobileNumber) => {
  if (!amount || !mobileNumber) {
    Alert.alert('Error', 'Please enter both amount and mobile number.');
    return;
  }

  try {
    // Initialize SDK

    const isInitialized = await initSDK();
    if (!isInitialized) return;
    const generateMerchantTransactionId = () => {
      const timestamp = Date.now(); // Current timestamp in milliseconds
      const randomNum = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
      return `MT${timestamp}${randomNum}`; // e.g., MT161616161612345
    };
    // Create Payment Request Payload
    const paymentRequest = {
      merchantId: merchantId,
      merchantTransactionId: generateMerchantTransactionId(),
      merchantUserId: `MUID${Date.now()}`,
      amount: parseInt(amount) * 100, // Convert to paise
      callbackUrl: 'yourapp://payment-callback',
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    // Encode payload and generate checksum
    const payloadMain = Base64.encode(JSON.stringify(paymentRequest));
    const checksum = generateChecksum(payloadMain);



    // Start transaction
    const sdkResponse = ""
    //  await PhonePePaymentSDK.startTransaction(payloadMain, checksum, null, null);
    console.log('PhonePe SDK Response:', sdkResponse);

    if (sdkResponse.status === 'SUCCESS') {
      // verifyTransaction(paymentRequest.merchantTransactionId);
    } else {
      // Alert.alert('Payment Failed', sdkResponse.error || 'Transaction failed.');
    }

    return sdkResponse.status
  } catch (error) {
    console.error('Payment Error:', error);
    Alert.alert('Error', 'Payment failed. Please try again later.');
  }
};

// Verify transaction status after payment
const verifyTransaction = async (transactionId) => {
  try {
    const response = await fetch(`https://api.phonepe.com/pg/v1/status/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('Transaction Status:', result);

    if (result.success) {
      Alert.alert('Success', 'Payment completed successfully!');
    } else {
      Alert.alert('Payment Failed', 'Transaction could not be verified.');
    }
  } catch (error) {
    console.error('Transaction Verification Error:', error);
    // Alert.alert('Error', 'Unable to verify payment. Please check later.');
  }
};



