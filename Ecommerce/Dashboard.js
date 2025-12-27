import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Search, ShoppingBag } from 'lucide-react-native';
import CarouselBanner from './Components/CarouselBanner';
import CategoryButton from './Components/CategoryButton';
import ProductCard from './Components/ProductCard';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from "@expo/vector-icons";
import Theme from '../components/Theme';

const { width } = Dimensions.get('window');

export default function Dashboard() {
    //   const router = useRoute();
    const [searchQuery, setSearchQuery] = useState('');

    const navigation = useNavigation();

    const categories = [
        { id: 1, name: 'Electronics', icon: 'smartphone' },
        { id: 2, name: 'Fashion', icon: 'shirt' },
        { id: 3, name: 'Furniture', icon: 'sofa' },
        { id: 4, name: 'Industrial', icon: 'factory' },
    ];

    const products = [
        {
            id: 1,
            name: 'Nike air jordan retro',
            price: 126.00,
            originalPrice: 186.00,
            image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg',
            colors: ['#1DD1B0', '#16A085', '#2E8B57'],
            rating: 4.5,
            reviews: 2495,
        },
        {
            id: 2,
            name: 'Classic new black glasses',
            price: 8.50,
            originalPrice: 19.00,
            image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg',
            colors: ['#3498DB', '#A52A2A', '#000000'],
            rating: 4.2,
            reviews: 1520,
        },
        {
            id: 3,
            name: 'Loop Silicone Strong Magnetic Watch',
            price: 15.25,
            originalPrice: 29.99,
            image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg',
            colors: ['#FFFFFF', '#7F8C8D', '#3498DB', '#9B59B6', '#2C3E50'],
            rating: 4.8,
            reviews: 2495,
        },
        {
            id: 4,
            name: 'Wireless Noise Cancelling Headphones',
            price: 179.99,
            originalPrice: 249.99,
            image: 'https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg',
            colors: ['#000000', '#FFFFFF', '#C0392B'],
            rating: 4.7,
            reviews: 3210,
        },
    ];

    const banners = [
        {
            id: 1,
            title: 'Exclusive Sales',
            subtitle: 'On Headphones',
            discount: '30% OFF',
            image: 'https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg',
            backgroundColor: '#3498DB',
        },
        {
            id: 2,
            title: 'Summer Sale',
            subtitle: 'Fashion Collection',
            discount: '50% OFF',
            image: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg',
            backgroundColor: '#E74C3C',
        },
        {
            id: 3,
            title: 'New Arrivals',
            subtitle: 'Smart Watches',
            discount: '20% OFF',
            image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg',
            backgroundColor: '#9B59B6',
        },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>
                        <Text style={styles.logoHighlight}>ODH</Text>Mart
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.searchButton}>
                        <Search color="#FFF" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' }}
                            style={styles.avatar}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <CarouselBanner banners={banners} />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                    <TouchableOpacity >
                        <Text style={styles.seeAllText}>SEE ALL</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                >
                    {categories.map((category) => (
                        <CategoryButton
                            key={category.id}
                            name={category.name}
                            icon={category.icon}

                        />
                    ))}
                </ScrollView>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Latest Products</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>SEE ALL</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.productsGrid}>
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}

                        />
                    ))}
                </View>
            </ScrollView>

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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 30,
        paddingBottom: 16,
        backgroundColor: '#1A1A1A',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    logoHighlight: {
        color: '#1DD1B0',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchButton: {
        marginRight: 16,
    },
    avatarContainer: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#1DD1B0',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    scrollContent: {
        paddingBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    seeAllText: {
        fontSize: 14,
        color: '#1DD1B0',
        fontWeight: '600',
    },
    categoriesContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
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