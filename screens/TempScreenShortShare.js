import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

const ShareScreenshot = () => {
  const viewShotRef = useRef(null);
  const [imageUri, setImageUri] = useState(null);

  // Capture screenshot and save it as a file
  const captureScreenshot = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      setImageUri(uri);
    } catch (error) {
      console.error('Screenshot capture failed', error);
    }
  };

  // Convert the screenshot to a file and share it
  const shareScreenshot = async () => {
    if (!imageUri) return;

    try {
      const filePath = `${RNFS.CachesDirectoryPath}/screenshot.png`;

      // Copy the screenshot to a sharable location
      await RNFS.copyFile(imageUri, filePath);

      // Ensure the file exists before sharing
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        console.error('File does not exist');
        return;
      }

      await Share.open({
        url: `file://${filePath}`,
        type: 'image/png',
      });
    } catch (error) {
      console.error('Sharing failed', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* The area to capture */}
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
        <View style={styles.screenshotArea}>
          <Text style={styles.text}>Transaction Successful</Text>
          <Text style={styles.text}>Amount: ₹500</Text>
          <Text style={styles.text}>Transaction ID: 1234567890</Text>
        </View>
      </ViewShot>

      {/* Capture and Share buttons */}
      <TouchableOpacity style={styles.button} onPress={captureScreenshot}>
        <Text style={styles.buttonText}>Capture Screenshot</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={shareScreenshot}>
        <Text style={styles.buttonText}>Share Screenshot</Text>
      </TouchableOpacity>

      {/* Show preview */}
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenshotArea: { backgroundColor: '#f5f5f5', padding: 20, borderRadius: 10 },
  text: { fontSize: 16, fontWeight: 'bold', marginVertical: 5 },
  button: { backgroundColor: '#007bff', padding: 10, margin: 10, borderRadius: 5 },
  buttonText: { color: '#fff', fontSize: 16 },
  image: { width: 200, height: 200, marginTop: 10, borderRadius: 10 },
});

export default ShareScreenshot;
