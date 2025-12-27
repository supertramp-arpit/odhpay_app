// import Clipboard from '@react-native-clipboard/clipboard';
import React from 'react';
import { Image, Text, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Theme from '../Theme';

const AboutOffer = ({ route }) => {

    const { type, valid, title, code } = route.params;
    // const type = "bus";
    // const valid = "21 Dec";
    // const title = "shop now";
    // const code = "2050";

    // Function to determine the color based on the offer type
    const getColor = (type) => (type === "bus" ? "#90EE90" : "#FF7F7F");

    const handleCopy = () => {
        // Clipboard.setString(code);
        // alert('Text copied to clipboard!');
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>

            <ScrollView style={styles.container}>

                <View style={[styles.offerItem, { backgroundColor: getColor(type) }]}>
                    <Text style={styles.offerType}>{type}</Text>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.details}>Valid till: {valid}</Text>

                    <TouchableOpacity style={styles.codeButton}>
                        <Svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <Path
                                fill="black"
                                d="M12.79 21L3 11.21v2c0 .53.21 1.04.59 1.41l7.79 7.79c.78.78 2.05.78 2.83 0l6.21-6.21c.78-.78.78-2.05 0-2.83z"
                            />
                            <Path
                                fill="black"
                                d="M11.38 17.41c.78.78 2.05.78 2.83 0l6.21-6.21c.78-.78.78-2.05 0-2.83L12.63.58A2.04 2.04 0 0 0 11.21 0H5C3.9 0 3 .9 3 2v6.21c0 .53.21 1.04.59 1.41zM7.25 3a1.25 1.25 0 1 1 0 2.5a1.25 1.25 0 0 1 0-2.5"
                            />
                        </Svg>
                        <Text style={styles.codeText}>Code: {code}</Text>
                    </TouchableOpacity>

                    <Image
                        style={styles.offerImage}
                        source={ require('../../assets/Offers/bus.png')}
                    />
                </View>

                <View style={styles.termsContainer}>
                    <Text style={styles.termsTitle}>Terms & Conditions</Text>
                    <Text style={styles.termsText}>
                        1. Use code FIRST to get 10% discount up to Rs 150 + Rs 100 cashback on bus ticket bookings.
                    </Text>
                    <Text style={styles.termsText}>2. Offer available only for first-time users.</Text>
                    <Text style={styles.termsText}>
                        3. Offer is applicable for a minimum ticket value of Rs 200.
                    </Text>
                    <Text style={styles.termsText}>
                        4. Offer is applicable once per customer email or mobile number.
                    </Text>
                    <Text style={styles.termsText}>
                        5. This offer is valid only for logged-in users who verify their mobile number with OTP (one-time password).
                    </Text>
                    <Text style={styles.termsText}>
                        6. Cashback will be credited to the wallet within 48 working hours after the journey date.
                    </Text>
                    <Text style={styles.termsText}>
                        7. The offer is applicable on all channels.
                    </Text>
                    <Text style={styles.termsText}>
                        8. Redbus India Pvt Ltd reserves the right to end offers at its discretion without notice.
                    </Text>
                    <Text style={styles.termsText}>9. All disputes are subject to New Delhi jurisdiction.</Text>
                </View>
            </ScrollView>


            <View style={{ height: 80, backgroundColor: '#f0f4f8', display: 'flex', justifyContent: 'center', alignItems: 'center', }}>
                <TouchableOpacity onPress={handleCopy} style={{ backgroundColor: 'red', paddingHorizontal: 100, paddingVertical: 12, borderRadius: 20 }}>
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: 650 }}>Copy Offer Code</Text>
                </TouchableOpacity>
            </View>



        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f0f4f8',
    },
    offerItem: {
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 10,
        position: 'relative',
    },
    offerType: {
        color: Theme.colors.secondary,
        textTransform: 'capitalize',
        backgroundColor: 'gray',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginVertical: 8,
    },
    details: {
        fontSize: 14,
        color: '#555',
    },
    codeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    codeText: {
        color: '#333',
        marginLeft: 5,
    },
    offerImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        position: 'absolute',
        right: 10,
        bottom: 0,
    },
    termsContainer: {
        marginTop: 20,
    },
    termsTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 10,
    },
    termsText: {
        fontSize: 14,
        marginBottom: 8,
        color: '#444',
    },
    footer: {
        height: 80,
        backgroundColor: '#f0f4f8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    copyButton: {
        backgroundColor: 'red',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 20,
    },
    copyButtonText: {
        color: Theme.colors.secondary,
        fontSize: 15,
        fontWeight: '600',
    },
});

export default AboutOffer;
