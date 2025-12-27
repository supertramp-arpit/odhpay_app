import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
    return (
        <View style={styles.container}>
            <Image
                source={{ uri: item.image }}
                style={styles.image}
                resizeMode="cover"
            />

            <View style={styles.contentContainer}>
                <View style={styles.nameContainer}>
                    <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={onRemove}
                    >
                        <Trash2 size={18} color="#E74C3C" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.colorText}>Color: {item.color}</Text>

                <View style={styles.bottomRow}>
                    <Text style={styles.price}>${item.price.toFixed(2)}</Text>

                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={onDecrease}
                        >
                            <Minus size={16} color="#FFFFFF" />
                        </TouchableOpacity>

                        <Text style={styles.quantityText}>{item.quantity}</Text>

                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={onIncrease}
                        >
                            <Plus size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    name: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        marginRight: 8,
    },
    removeButton: {
        padding: 4,
    },
    colorText: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 8,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1DD1B0',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333333',
        borderRadius: 8,
        overflow: 'hidden',
    },
    quantityButton: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        paddingHorizontal: 8,
    },
});