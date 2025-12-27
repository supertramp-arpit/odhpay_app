import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Keyboard,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import allcities from '../../config/AllCities'
import { useNavigation } from '@react-navigation/native';
import { useTravelStore } from '../../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from '../Theme';
const SingleSearch = ({ route }) => {
    const { location } = route.params; // Access the location data

    const { from_loc, to_loc, setFromLoc, setToLoc } = useTravelStore();
    
    // Alias functions to match existing usage
    const onChangeFrom_loc = setFromLoc;
    const onChangeTo_loc = setToLoc;

    useEffect(() => {
        if (location) {
            console.log("Received location:", location); // Debugging log to check the location
        }
    }, [location]);

    const navigation = useNavigation();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);


    // Mock data for cities
    const [mockData, setMockData] = useState(allcities);

    // Mock popular destinations data
    const [popularDest, setPopularDest] = useState([
        { id: 1, name: 'Kashmiri Gate' },
        { id: 2, name: 'Majnu ka Tilla' },
        { id: 3, name: 'Anand Vihar' },
        { id: 4, name: 'Dhaula Kuan' },
    ]);

    const handleSearch = (text) => {
        setSearchTerm(text);
        console.log(searchTerm);


        // Filter cities that match the search term
        const filteredResults = mockData.filter((city) =>
            city.toLowerCase().includes(text.toLowerCase())
        );

        setResults(filteredResults);
    };

    const handleSelectCity = (city) => {
        setSearchTerm(city); // Update the input value with the selected city
        setResults([]); // Clear the results after selection
        Keyboard.dismiss(); // Dismiss the keyboard
        // console.log("Navigating with searchTerm:", city); // Add this line for debugging
        // navigation.navigate("home", { searchTerm: city });



        if (location == "starting") {
            onChangeFrom_loc(city)
        }
        else (
            onChangeTo_loc(city)
        )

        navigation.navigate("home");


    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                {/* Search Bar Section */}
                <View style={styles.searchWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter city name"
                        value={searchTerm}
                        onChangeText={handleSearch}
                    />
                    <TouchableOpacity onPress={() => navigation.navigate('home')} style={styles.iconWrapper}>
                        <Svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1024 1024">
                            <Rect width="1024" height="1024" fill="none" />
                            <Path fill="black" d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64" />
                            <Path fill="black" d="m237.248 512l265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312z" />
                        </Svg>
                    </TouchableOpacity>
                </View>

                {/* Conditional Rendering of Popular Destinations or Search Results */}
                {searchTerm === '' ? (
                    // Show popular destinations when search term is empty
                    <View>
                        <Text style={{ fontWeight: 'bold', fontSize: 15, paddingLeft: 5 }}>Recent Searches</Text>
                        <FlatList
                            data={popularDest}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleSelectCity(item.name)}>
                                    <View style={styles.resultItem}>
                                        <Text style={styles.resultText}>{item.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                <Text style={styles.noResultsText}>No results found</Text>
                            )}
                            contentContainerStyle={styles.resultsContainer}
                        />
                    </View>
                ) : (
                    // Show search results when there is a search term
                    <FlatList
                        data={results}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleSelectCity(item)}>
                                <View style={styles.resultItem}>
                                    <Text style={styles.resultText}>{item}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                            <Text style={styles.noResultsText}>No results found</Text>
                        )}
                        contentContainerStyle={styles.resultsContainer}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f8f9fa',
    },
    searchWrapper: {
        position: 'relative',
        marginBottom: 20,
    },
    input: {
        height: 40, // Adjust this as per your requirement
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        padding: 10,
        paddingLeft: 40,
        backgroundColor: Theme.colors.secondary,
        fontSize: 16,
        outlineStyle: 'none',
    },
    iconWrapper: {
        position: 'absolute',
        top: 10,
        left: 5,
    },
    resultsContainer: {
        flexGrow: 1,
        paddingTop: 20,
    },
    resultItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    resultText: {
        fontSize: 18,
        color: '#333',
    },
    noResultsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#888',
    },
});

export default SingleSearch;
