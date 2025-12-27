import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import Theme from '../Theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import useUserStore from '../../store/useUserStore';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Dialog, PaperProvider, Portal } from 'react-native-paper';

const Proceed = () => {

    const [totalAmount, setTotalAmount] = useState(0);
    const [intrest, setIntrest] = useState(0);

    const user = useUserStore(s => s.user);
    const payload = user?.user ? user.user : user;





    const navigation = useNavigation();

    const route = useRoute();

    const { bankName, account, holder, amount, id } = route.params || {};

    useEffect(() => {
        const calculatedInterest = (amount * 3) / 100;
        setIntrest(calculatedInterest);
        setTotalAmount(Number(amount) - calculatedInterest);


        // console.log(id)

        console.log(payload)
    }, [amount]);


    function correctPath(url) {
        return url.replace(/\\/g, '/');
    }

    // Mock data - in a real app, this would come from your backend
    const recipientData = {
        name: holder,
        bankAccount: `${bankName} A/c No. XX XX ${account.slice(-4)}`,
        bankIcon: correctPath(`https://newapi.odhpay.com/${payload?.profile}`) || ''
    };

    // const handleProceed = () => {
    //     // Handle the actual transfer logic here
    //     console.log('Processing transfer...');
    // };




    // ==============================================================================================================
    // Proceed to Make Transfer 
    // ==============================================================================================================

    const [loading, setLoading] = useState(false);

    const BankTransfer = async () => {
        try {

            const token = await AsyncStorage.getItem('access_token');

            if (!token) throw new Error('Authentication token not found');


            setLoading(true);

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
            const data = {
                "amount": amount,
                "regBankID": id
            }
            const response = await axios.post("https://newapi.odhpay.com/payments/withdraw_fund", data, {
                headers
            });


            console.log("response data is", response.data);
            setLoading(false)
            console.log(response?.data);

            if (response.status === 200 && response.data.status === true) {

                Alert.alert(
                    "Transaction Successful",
                    `${response?.data?.msg} \nUTR No: ${response?.data?.utr}`,
                    [
                        {
                            text: "OK",
                            onPress: () => navigation.navigate('MainApp', { screen: 'HomeTab' }) // Navigate to MainApp
                        }
                    ]
                );
            } else {
                Alert.alert(
                    "Transaction Failed",
                    `${response?.data?.msg} `,
                    [
                        {
                            text: "OK",
                            onPress: () => navigation.navigate('MainApp', { screen: 'HomeTab' }) // Navigate to MainApp
                        }
                    ]
                );
            }
        } catch (error) {
            setLoading(false)
            if (axios.isAxiosError(error)) {
                console.error("Axios Error:", error.response?.status, error.response?.data);

                if (error.response?.status === 404) {
                    Alert.alert("Error", "Requested resource not found (404)");
                }
            } else {
                console.error("Unexpected Error:", error);
                Alert.alert("Error", "Something went wrong!");
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sending money from Wallet to</Text>
            </View>

            {/* Recipient Info */}
            <View style={styles.recipientSection}>
                <View style={styles.recipientInfo}>
                    <View style={styles.recipientDetails}>
                        <Text style={styles.recipientName}>{recipientData.name}</Text>
                        <Text style={styles.accountNumber}>{recipientData.bankAccount}</Text>
                    </View>
                    <Image
                        source={{ uri: recipientData.bankIcon }}
                        style={styles.bankIcon}
                    />
                </View>
            </View>

            {/* Transaction Details */}
            <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount to be sent</Text>
                    <Text style={styles.detailValue}>₹{amount}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Charges (3%)</Text>
                    <Text style={styles.detailValue}>₹{intrest}</Text>
                </View>

                <View style={[styles.detailRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>₹{totalAmount}</Text>
                </View>
            </View>

            {/* Proceed Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.proceedButton}
                    onPress={() => BankTransfer()}
                >




                    {
                        loading ? (
                            <ActivityIndicator
                                size="small"
                                color="white"
                                style={{ transform: [{ scale: 1 }] }}
                            />
                        ) : ""

                    }
                    {
                        !loading ? (
                            <Text style={styles.proceedButtonText}>Proceed</Text>
                        ) : ""
                    }

                </TouchableOpacity>
            </View>

            {/* Footer */}
            {/* <View style={styles.footer}>
                <Text style={styles.poweredByText}>Powered By</Text>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1640832434870-bc0f1b17c182?q=80&w=200' }}
                    style={styles.paytmLogo}
                    resizeMode="contain"
                />
            </View> */}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 8,
    },
    recipientSection: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    recipientInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recipientDetails: {
        flex: 1,
    },
    recipientName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    accountNumber: {
        fontSize: 16,
        color: '#666',
    },
    bankIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0F0F0',
    },
    detailsCard: {
        marginHorizontal: 24,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    detailLabel: {
        fontSize: 16,
        color: '#666',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    totalRow: {
        borderBottomWidth: 0,
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    buttonContainer: {
        padding: 24,
        marginTop: 'auto',
    },
    proceedButton: {
        backgroundColor: Theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    proceedButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 32,
    },
    poweredByText: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    paytmLogo: {
        width: 100,
        height: 24,
    },
});

export default Proceed;