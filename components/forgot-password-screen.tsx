import React from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const HEADER_IMAGE = { uri: 'http://localhost:3845/assets/42507f809574e5e7761bac96edc08df8a3e9cc02.png' };

export default function WachtwoordVergetenScreen() {
  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/login-header.png')} style={styles.headerImage} resizeMode="cover" />
      <Text style={styles.title}>Wachtwoord vergeten</Text>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>E-mail</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            value=""
            placeholder=""
            placeholderTextColor="#282828"
          />
        </View>
      </View>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Stuur mail</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  headerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 260,
  },
  title: {
    position: 'absolute',
    top: 220,
    left: 0,
    width: '100%',
    textAlign: 'center',
    fontSize: 30,
    color: '#000',
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  inputWrapper: {
    position: 'absolute',
    top: 290,
    left: 0,
    width: '100%',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#282828',
    fontFamily: 'Inter',
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: 44,
  },
  inputBox: {
    backgroundColor: '#fff',
    borderColor: '#ff8700',
    borderWidth: 1,
    borderRadius: 20,
    height: 48,
    width: 342,
    justifyContent: 'center',
  },
  input: {
    paddingLeft: 20,
    fontSize: 14,
    color: '#282828',
    fontFamily: 'Inter',
    height: 48,
  },
  button: {
    position: 'absolute',
    top: 370,
    left: '50%',
    width: 113,
    height: 40,
    backgroundColor: '#ff8700',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -56.5 }],
  },
  buttonText: {
    fontFamily: 'Alexandria',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '400',
  },
});