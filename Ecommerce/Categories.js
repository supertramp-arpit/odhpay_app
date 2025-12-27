import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import CategoryCard from './Components/CategoryCard';
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';

export default function Categories() {

  const navigation = useNavigation();


  const categories = [
    { id: 1, name: 'Electronics', count: 142, image: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg' },
    { id: 2, name: 'Fashion', count: 235, image: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg' },
    { id: 3, name: 'Furniture', count: 89, image: 'https://images.pexels.com/photos/276534/pexels-photo-276534.jpeg' },
    { id: 4, name: 'Beauty', count: 167, image: 'https://images.pexels.com/photos/3373745/pexels-photo-3373745.jpeg' },
    { id: 5, name: 'Sports', count: 124, image: 'https://images.pexels.com/photos/949126/pexels-photo-949126.jpeg' },
    { id: 6, name: 'Kids', count: 78, image: 'https://images.pexels.com/photos/3661348/pexels-photo-3661348.jpeg' },
    { id: 7, name: 'Home Decor', count: 195, image: 'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg' },
    { id: 8, name: 'Books', count: 210, image: 'https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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