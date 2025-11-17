import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={require('@/assets/images/login-header.png')}
          style={styles.bgImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.formSection}>
        <Text style={styles.title}>Inloggen</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Wachtwoord"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword((prev) => !prev)}>
            <Image
              source={require('@/assets/images/eye.png')}
              style={styles.eyeImg}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Text style={styles.forgot}>Wachtwoord vergeten?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>Inloggen</Text>
        </TouchableOpacity>
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Nog geen onderdeel van het netwerk? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Registreer hier</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topSection: {
    height: '40%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 0,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 32,
    color: '#000',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF8700',
    borderRadius: 16,
    marginBottom: 18,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    backgroundColor: 'transparent',
  },
  eyeIcon: {
    padding: 4,
  },
  eyeImg: {
    width: 22,
    height: 22,
    tintColor: '#b4b4b4',
  },
  forgot: {
    color: '#6080FF',
    fontSize: 15,
    marginBottom: 24,
    marginLeft: 4,
  },
  loginBtn: {
    backgroundColor: '#FF8700',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    marginBottom: 24,
    width: 160,
    alignSelf: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  registerText: {
    color: '#222',
    fontSize: 15,
  },
  registerLink: {
    color: '#6080FF',
    fontSize: 15,
    marginLeft: 2,
  },
});
