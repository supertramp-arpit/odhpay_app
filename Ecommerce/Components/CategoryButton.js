import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Smartphone, Shirt, Sofa, Factory } from 'lucide-react-native';

export default function CategoryButton({ name, icon, onPress }) {
    // Map of icon names to components
    const iconMap = {
        smartphone: Smartphone,
        shirt: Shirt,
        sofa: Sofa,
        factory: Factory,
    };

    // Get the icon component from the map or use a default
    const IconComponent = iconMap[icon] || Smartphone;

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.iconContainer}>
                <IconComponent size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.name}>{name}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginRight: 20,
        width: 70,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: '#222222',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    name: {
        fontSize: 12,
        color: '#BBBBBB',
        textAlign: 'center',
    },
});