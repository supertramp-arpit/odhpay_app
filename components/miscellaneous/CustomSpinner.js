import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

const CustomSpinner = () => {
    const [spinner, setSpinner] = useState(true); // Manage spinner state
    const instructions = "Edit App.js to start working on your app."; // Define instructions

    return (
        <View style={styles.container}>
            <Spinner
                visible={spinner} // Use state variable instead of this.state.spinner
                textContent={'Loading...'}
                textStyle={styles.spinnerTextStyle}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    spinnerTextStyle: {
        color: '#FFF'
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF'
    },
    welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5
    }
});

export default CustomSpinner;