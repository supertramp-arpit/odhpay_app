import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Theme from '../Theme';

const MakeBooking = ({ route }) => {
    const { selectedItem } = route.params;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Booking Details</Text>

                <Text style={styles.label}>Company Name:</Text>
                <Text style={styles.value}>{selectedItem.companyName}</Text>

                <Text style={styles.label}>Bus Type:</Text>
                <Text style={styles.value}>{selectedItem.busType}</Text>

                <Text style={styles.label}>Arrival Time:</Text>
                <Text style={styles.value}>{selectedItem.arrivalTime}</Text>

                <Text style={styles.label}>Departure Time:</Text>
                <Text style={styles.value}>{selectedItem.departureTime}</Text>

                <Text style={styles.label}>Duration:</Text>
                <Text style={styles.value}>{selectedItem.duration}</Text>

                <Text style={styles.label}>Available Seats:</Text>
                <Text style={styles.value}>{selectedItem.availableSeats}</Text>

                <Text style={styles.label}>Previous Fare:</Text>
                <Text style={styles.oldFare}>₹{selectedItem.prevFare}</Text>

                <Text style={styles.label}>Current Fare:</Text>
                <Text style={styles.newFare}>₹{selectedItem.currentFare}</Text>

                <Text style={styles.label}>Rating:</Text>
                <Text style={styles.rating}>{selectedItem.rating}</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 15,
        backgroundColor: '#f4f4f4',
    },
    card: {
        backgroundColor: Theme.colors.secondary,
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        marginVertical: 5,
    },
    value: {
        fontSize: 18,
        color: '#333',
        marginBottom: 10,
    },
    oldFare: {
        fontSize: 18,
        color: 'gray',
        textDecorationLine: 'line-through',
        marginBottom: 10,
    },
    newFare: {
        fontSize: 20,
        color: 'green',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    rating: {
        fontSize: 18,
        color: '#f1c40f',
        marginBottom: 10,
    },
});

export default MakeBooking;
