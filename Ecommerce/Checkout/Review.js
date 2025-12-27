import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, ChevronRight } from 'lucide-react-native';

export default function ReviewScreen() {
    const router = useRouter();

    const orderItems = [
        {
            id: 1,
            name: 'Loop Silicone Strong Magnetic Watch',
            price: 15.25,
            image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg',
            color: 'Blue',
            quantity: 1,
        },
        {
            id: 2,
            name: 'Nike air jordan retro',
            price: 126.00,
            image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg',
            color: 'Green',
            quantity: 1,
        },
    ];

    const subtotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const shippingCost = 0.00;
    const total = subtotal + shippingCost;

    const handlePlaceOrder = () => {
        // In a real app, this would submit the order to a backend
        router.push('/order-confirmation');
    };

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ChevronLeft color="#FFFFFF" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
            </View>

            <View style={styles.progressBar}>
                <View style={styles.progressStep}>
                    <View style={[styles.progressIcon, styles.completedProgressIcon]}>
                        <Text style={styles.progressIconText}>✓</Text>
                    </View>
                    <Text style={styles.progressText}>Shipping</Text>
                </View>

                <View style={[styles.progressLine, styles.completedProgressLine]} />

                <View style={styles.progressStep}>
                    <View style={[styles.progressIcon, styles.completedProgressIcon]}>
                        <Text style={styles.progressIconText}>✓</Text>
                    </View>
                    <Text style={styles.progressText}>Payment</Text>
                </View>

                <View style={[styles.progressLine, styles.completedProgressLine]} />

                <View style={styles.progressStep}>
                    <View style={[styles.progressIcon, styles.activeProgressIcon]}>
                        <Text style={styles.progressIconText}>3</Text>
                    </View>
                    <Text style={[styles.progressText, styles.activeProgressText]}>Review</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TouchableOpacity
                    style={styles.sectionCard}
                    onPress={() => router.push('/order-items')}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Items ({orderItems.length})</Text>
                        <ChevronRight color="#8E8E93" size={20} />
                    </View>
                </TouchableOpacity>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Shipping Address</Text>

                    <View style={styles.addressDetails}>
                        <View style={styles.addressRow}>
                            <Text style={styles.addressLabel}>Full Name</Text>
                            <Text style={styles.addressValue}>Ahmad Khan</Text>
                        </View>

                        <View style={styles.addressRow}>
                            <Text style={styles.addressLabel}>Mobile Number</Text>
                            <Text style={styles.addressValue}>+92 000-0000000</Text>
                        </View>

                        <View style={styles.addressRow}>
                            <Text style={styles.addressLabel}>Province</Text>
                            <Text style={styles.addressValue}>Sindh</Text>
                        </View>

                        <View style={styles.addressRow}>
                            <Text style={styles.addressLabel}>City</Text>
                            <Text style={styles.addressValue}>Karachi</Text>
                        </View>

                        <View style={styles.addressRow}>
                            <Text style={styles.addressLabel}>Street Address</Text>
                            <Text style={styles.addressValue}>XYZ Address</Text>
                        </View>

                        <View style={styles.addressRow}>
                            <Text style={styles.addressLabel}>Postal Code</Text>
                            <Text style={styles.addressValue}>75400</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Order Info</Text>

                    <View style={styles.orderDetails}>
                        <View style={styles.orderRow}>
                            <Text style={styles.orderLabel}>Subtotal</Text>
                            <Text style={styles.orderValue}>${subtotal.toFixed(2)}</Text>
                        </View>

                        <View style={styles.orderRow}>
                            <Text style={styles.orderLabel}>Shipping Cost</Text>
                            <Text style={styles.orderValue}>${shippingCost.toFixed(2)}</Text>
                        </View>

                        <View style={[styles.orderRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.placeOrderButton}
                    onPress={handlePlaceOrder}
                >
                    <Text style={styles.placeOrderButtonText}>Place Order</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#1A1A1A',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    progressBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    progressStep: {
        alignItems: 'center',
    },
    progressIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333333',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    activeProgressIcon: {
        backgroundColor: '#1DD1B0',
    },
    completedProgressIcon: {
        backgroundColor: '#1DD1B0',
    },
    progressIconText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    progressText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    activeProgressText: {
        color: '#1DD1B0',
        fontWeight: 'bold',
    },
    progressLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#333333',
        marginHorizontal: 8,
    },
    completedProgressLine: {
        backgroundColor: '#1DD1B0',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    sectionCard: {
        backgroundColor: '#222222',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    addressDetails: {

    },
    addressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    addressLabel: {
        fontSize: 14,
        color: '#8E8E93',
    },
    addressValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '500',
        textAlign: 'right',
    },
    orderDetails: {

    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    orderLabel: {
        fontSize: 14,
        color: '#8E8E93',
    },
    orderValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    totalRow: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333333',
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1DD1B0',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#1A1A1A',
        borderTopWidth: 1,
        borderTopColor: '#333333',
    },
    placeOrderButton: {
        backgroundColor: '#1DD1B0',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    placeOrderButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});