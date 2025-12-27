import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Card, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Button, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTravelStore } from '../../store';
import Theme from '../Theme';

// Sample Data
const busData = Array.from({ length: 20 }, (_, index) => ({
    id: index.toString(),
    companyName: `Bus Company ${index + 1}`,
    busType: index % 2 === 0 ? 'AC' : 'Non-AC',
    arrivalTime: `10:${(index + 1) * 5}`,
    departureTime: `10:${(index + 2) * 5}`,
    duration: `${index + 2}h ${index + 30}m`,
    availableSeats: Math.floor(Math.random() * 30),
    prevFare: Math.floor(Math.random() * 500),
    currentFare: Math.floor(Math.random() * 1000),
    rating: (Math.random() * 5).toFixed(1),
    reviewersCount: Math.floor(Math.random() * 200),
}));

function getFormattedDateAndWeekday(dateString) {
    // Use moment to parse the date string
    const date = moment(dateString, 'D MMM YYYY'); // Expecting format like "28 Dec 2024"

    if (!date.isValid()) {
        console.error("Invalid date provided!");
        return { error: "Invalid date" };
    }

    const formattedDate = date.format('D MMM');
    const weekday = date.format('dddd');

    return {
        formattedDate,
        weekday,
    };
}





const BusList = ({ route }) => {
    const navigation = useNavigation()

    const { from_loc, to_loc } = route.params;



    const availabelBus = 12

    const { selectedDate, setSelectedDate } = useTravelStore()
    const result = getFormattedDateAndWeekday(selectedDate);


    const [showCalendar, setShowCalendar] = useState(false);


    const OpenDate = () => {
        setShowCalendar(true);
    };

    const onDateSelect = (date) => {
        const formattedDate = moment(date.dateString).format('D MMM YYYY');
        setSelectedDate(formattedDate);
        setShowCalendar(false);
    };

    useEffect(() => {
        console.log("Selected: ", selectedDate);
        const newDate = selectedDate.split(" ");
        const FormatDate = newDate[0] + " " + newDate[1];

        console.log()
        console.log(getFormattedDateAndWeekday("28 Dec 2024").weekday)
    }, [selectedDate]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {/* Navigation Details Section */}
            <View style={styles.navigationDetails}>
                <TouchableOpacity onPress={() => navigation.navigate('home')} style={{ width: "10%" }}>
                    <Svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1024 1024">
                        <Rect width="1024" height="1024" fill="none" />
                        <Path fill="black" d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64" />
                        <Path fill="black" d="m237.248 512l265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312z" />
                    </Svg>
                </TouchableOpacity>
                <View style={{ width: "90%", display: 'flex', flexDirection: 'row', alignitems: 'center', justifyContent: 'space-between' }}>
                    <View>
                        <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                            <Text style={styles.locationText}>{from_loc}</Text>
                            <Svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                <Rect width="24" height="24" fill="none" />
                                <Path fill="none" stroke="gray" stroke-width="2" d="M2 12h20m-9-9l9 9l-9 9" />
                            </Svg>
                            <Text style={styles.locationText}>{to_loc}</Text>
                        </View>
                        <Text style={{ fontSize: 16, color: 'gray', }}>{availabelBus} Buses</Text>
                    </View>
                    <View style={{ marginRight: 10 }}>
                        <TouchableOpacity onPress={OpenDate} style={{
                            padding: 5,
                            borderRadius: 20,
                            backgroundColor: '#663dff',
                            backgroundImage: 'linear-gradient(319deg, #663dff 0%, #aa00ff 37%, #cc4499 100%)',
                        }}>
                            <Text style={styles.dateText}>{result.formattedDate}</Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 14, color: 'gray', textAlign: 'center' }}>{result.weekday ? result.weekday.slice(0, 3) : "N/A"}</Text>
                    </View>
                </View>
            </View>


            <View style={{ padding: 10, marginBottom: 50, paddingBottom: 50 }}>
                <FlatList
                    data={busData}
                    keyExtractor={(item) => item.id}



                    renderItem={({ item }) => {
                        const { id, ...otherData } = item;
                        return (
                            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("makeBooking", { selectedItem: otherData })}>

                                <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                                    <View style={{ display: "flex", }}>
                                        <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
                                            <Text style={{ fontSize: 20 }}>{item.arrivalTime}</Text>
                                            <Text style={{ fontSize: 20 }}> - </Text>
                                            <Text style={{ fontSize: 20 }}>{item.departureTime}</Text>
                                        </View>

                                        <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 10 }} >
                                            <Text style={{ fontSize: 20 }}>{item.duration} </Text>
                                            <Text style={{ fontSize: 20 }}>{item.availableSeats} Seats</Text>
                                        </View>
                                    </View>
                                    <View display={{ display: "flex", gap: 20 }}>
                                        <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
                                            <Text style={{ textDecorationLine: 'line-through', color: 'gray', fontSize: 20 }}>₹{item.prevFare}</Text>
                                            <Text style={{ fontSize: 20 }}>₹{item.currentFare}</Text>
                                        </View>
                                        <Text style={{ fontSize: 15, color: "gray", textAlign: "center" }}>Onwards</Text>
                                    </View>
                                </View>


                                <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                                    <View display={{ display: "flex", gap: 20 }}>
                                        <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
                                            <Text style={styles.companyName}>{item.companyName}</Text>
                                            <Svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><Rect width="24" height="24" fill="none" />
                                                <Path fill="black" stroke="white" d="M4 11h7.07A7.97 7.97 0 0 0 10 15c0 1.46.39 2.82 1.07 4H6v1c0 .27-.1.5-.29.71c-.21.19-.44.29-.71.29H4c-.26 0-.5-.1-.71-.29C3.11 20.5 3 20.27 3 20v-1.78c-.61-.55-1-1.34-1-2.22V6c0-3.5 3.58-4 8-4s8 .5 8 4v1c-.69 0-1.36.09-2 .25V6H4zm1.5 6a1.499 1.499 0 0 0 1.06-2.56a1.499 1.499 0 1 0-2.12 2.12c.28.28.66.44 1.06.44m9.5 3v1h6v-1c0-.55-.45-1-1-1h-1v-5h2l2-2l-2-2h-8l2 2l-2 2h4v5h-1c-.55 0-1 .45-1 1" />
                                            </Svg>
                                        </View>
                                        <Text style={styles.busType}>{item.busType}</Text>
                                    </View>
                                    <View display={{ display: "flex", gap: 20 }}>
                                        <View style={{ display: "flex", flexDirection: "row", gap: 10, backgroundColor: "green", padding: 5, borderRadius: 5 }}>
                                            <Svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><Rect width="24" height="24" fill="none" />
                                                <Path fill="white" d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z" />
                                            </Svg>
                                            <Text style={{ fontSize: 20, color: "white", }}>{item.rating}</Text>
                                        </View>
                                        <Text style={{ fontSize: 20, textAlign: "center" }}>{item.reviewersCount}</Text>
                                    </View>

                                </View>


                            </TouchableOpacity>
                        )
                    }}
                />
            </View>



            {/* Calander come here */}

            {
                showCalendar && (
                    <Modal
                        visible={showCalendar}
                        onDismiss={() => setShowCalendar(false)}
                        contentContainerStyle={{
                            padding: 20,
                            backgroundColor: Theme.colors.secondary,
                            marginHorizontal: 20,
                            borderRadius: 10,
                        }}
                    >
                        <Calendar
                            onDayPress={onDateSelect}
                            markedDates={{
                                [selectedDate]: { selected: true, marked: true, selectedColor: '#663dff' },
                            }}
                            style={{
                                borderRadius: 10,
                            }}
                        />
                    </Modal>

                )
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    navigationDetails: {
        display: 'flex',
        flexDirection: 'row',
        gap: 6,
        backgroundColor: "#f5f5f5",
        padding: 15,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    locationText: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 5,
    },
    dateText: {
        padding: 4,
        fontSize: 16,
        color: Theme.colors.secondary,
    },
    card: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        gap: 10
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        fontSize: 20
    },
    busType: {
        fontStyle: 'italic',
        color: 'gray',
        fontSize: 20
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Theme.colors.secondary,
        borderRadius: 10,
        padding: 20,
        elevation: 3,
        margin: 20
    },

});

export default BusList;
