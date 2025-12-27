import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';
import WishlistItem from './Components/WishlistItem';
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';

export default function Wishlist() {
    // const router = useRouter();

    const navigation = useNavigation();
    const [wishlistItems, setWishlistItems] = useState([
        {
            id: 1,
            name: 'Classic new black glasses',
            price: 8.50,
            originalPrice: 19.00,
            image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg',
        },
        {
            id: 2,
            name: 'Wireless Noise Cancelling Headphones',
            price: 179.99,
            originalPrice: 249.99,
            image: 'https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg',
        },
    ]);

    const removeFromWishlist = (id) => {
        setWishlistItems(wishlistItems.filter(item => item.id !== id));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Wishlist</Text>
            </View>

            {wishlistItems.length > 0 ? (
                <FlatList
                    data={wishlistItems}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <WishlistItem
                            item={item}
                            onRemove={() => removeFromWishlist(item.id)}
                            onAddToCart={() => {
                                // Add to cart logic would go here
                                // router.push('/(tabs)/cart');
                            }}
                        // onPress={() => router.push(`/product/${item.id}`)}
                        />
                    )}
                    contentContainerStyle={styles.wishlistList}
                />
            ) : (
                <View style={styles.emptyWishlistContainer}>
                    <Heart color="#8E8E93" size={64} />
                    <Text style={styles.emptyWishlistText}>Your wishlist is empty</Text>
                    <TouchableOpacity
                        style={styles.continueShopping}
                    // onPress={() => router.push('/(tabs)')}
                    >
                        <Text style={styles.continueShoppingText}>Discover Products</Text>
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
    wishlistList: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 100,
    },
    emptyWishlistContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyWishlistText: {
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