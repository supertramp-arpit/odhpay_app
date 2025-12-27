import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { ShoppingCart, Trash2, ChevronRight } from 'lucide-react-native';
import CartItem from './Components/CartItem';
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';

export default function MyCart() {
    // const router = useRouter();

    const navigation = useNavigation();
    const [cartItems, setCartItems] = useState([
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
    ]);

    const updateQuantity = (id, action) => {
        setCartItems(
            cartItems.map((item) => {
                if (item.id === id) {
                    const newQuantity = action === 'increase'
                        ? item.quantity + 1
                        : Math.max(1, item.quantity - 1);

                    return {
                        ...item,
                        quantity: newQuantity,
                    };
                }
                return item;
            })
        );
    };

    const removeItem = (id) => {
        setCartItems(cartItems.filter(item => item.id !== id));
    };

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const shippingCost = 0.00;
    const total = subtotal + shippingCost;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Cart</Text>
            </View>

            {cartItems.length > 0 ? (
                <>
                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <CartItem
                                item={item}
                                onIncrease={() => updateQuantity(item.id, 'increase')}
                                onDecrease={() => updateQuantity(item.id, 'decrease')}
                                onRemove={() => removeItem(item.id)}
                            />
                        )}
                        contentContainerStyle={styles.cartList}
                    />

                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>Order Summary</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryText}>Subtotal</Text>
                            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryText}>Shipping</Text>
                            <Text style={styles.summaryValue}>${shippingCost.toFixed(2)}</Text>
                        </View>

                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalText}>Total</Text>
                            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.checkoutButton}
                        // onPress={() => router.push('/checkout/shipping')}
                        >
                            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.emptyCartContainer}>
                    <ShoppingCart color="#8E8E93" size={64} />
                    <Text style={styles.emptyCartText}>Your cart is empty</Text>
                    <TouchableOpacity
                        style={styles.continueShopping}
                    // onPress={() => router.push('/(tabs)')}
                    >
                        <Text style={styles.continueShoppingText}>Continue Shopping</Text>
                    </TouchableOpacity>
                </View>
            )}


            <View style={styles.bottomNavigation}>
                <TouchableOpacity
                    style={styles.bottomNavItem}
                    onPress={() => navigation.navigate('Dashboard')}
                >
                    <MaterialIcons name="home" size={24} color="#1DD1B0" />
                    <Text style={styles.bottomNavText}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.bottomNavItem}
                    onPress={() => navigation.navigate('Categories')}
                >
                    <MaterialIcons name="grid-view" size={24} color="#8E8E93" />
                    <Text style={styles.bottomNavText}>Categories</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.bottomNavItem}
                    onPress={() => navigation.navigate('MyCart')}
                >
                    <MaterialIcons name="shopping-cart" size={24} color="#8E8E93" />
                    <Text style={styles.bottomNavText}>My Cart</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.bottomNavItem}
                    onPress={() => navigation.navigate('Wishlist')}
                >
                    <MaterialIcons name="favorite-border" size={24} color="#8E8E93" />
                    <Text style={styles.bottomNavText}>Wishlist</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.bottomNavItem}
                    onPress={() => navigation.navigate('EProfile')}
                >
                    <MaterialIcons name="person-outline" size={24} color="#8E8E93" />
                    <Text style={styles.bottomNavText}>Profile</Text>
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
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#1A1A1A',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    cartList: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    summaryContainer: {
        backgroundColor: '#222222',
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 15,
        color: '#BBBBBB',
    },
    summaryValue: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    totalRow: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
        marginBottom: 16,
    },
    totalText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    totalValue: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1DD1B0',
    },
    checkoutButton: {
        backgroundColor: '#1DD1B0',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyCartContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyCartText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 16,
        marginBottom: 24,
    },
    continueShopping: {
        backgroundColor: '#1DD1B0',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    continueShoppingText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        paddingVertical: 8,
        height: 60,
        borderTopWidth: 0,
    },
    bottomNavItem: {
        alignItems: 'center',
    },
    bottomNavText: {
        fontSize: 10,
        color: '#8E8E93',
        marginTop: 2,
    },
});