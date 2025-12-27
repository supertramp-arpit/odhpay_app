import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Trash2, ShoppingCart } from 'lucide-react-native';

export default function WishlistItem({ item, onRemove, onAddToCart, onPress }) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <Image
                source={{ uri: item.image }}
                style={styles.image}
                resizeMode="cover"
            />

            <View style={styles.contentContainer}>
                <View style={styles.nameContainer}>
                    <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                    <Text style={styles.originalPrice}>${item.originalPrice.toFixed(2)}</Text>
                </View>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={onRemove}
                    >
                        <Trash2 size={18} color="#E74C3C" />
                        <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={onAddToCart}
                    >
                        <ShoppingCart size={18} color="#1DD1B0" />
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#222222',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    contentContainer: {
        flex: 1,
        marginLeft: 12,
    },
    nameContainer: {
        marginBottom: 4,
    },
    name: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1DD1B0',
        marginRight: 8,
    },
    originalPrice: {
        fontSize: 12,
        color: '#8E8E93',
        textDecorationLine: 'line-through',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    removeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    removeText: {
        fontSize: 12,
        color: '#E74C3C',
        marginLeft: 4,
    },
    addToCartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(29, 209, 176, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addToCartText: {
        fontSize: 12,
        color: '#1DD1B0',
        marginLeft: 4,
    },
});