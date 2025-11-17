import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <Image
            source={require('@/assets/images/login-header.png')}
            style={styles.bgImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.formSection}>
          <Text style={styles.title}>Inloggen</Text>
          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputBox}>
            <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" />
          </View>
          <Text style={styles.label}>Wachtwoord</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
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
          <Link href="/(tabs)" asChild>
            <TouchableOpacity style={styles.loginBtn}>
              <Text style={styles.loginBtnText}>Inloggen</Text>
            </TouchableOpacity>
          </Link>
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Nog geen onderdeel van het netwerk? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Registreer hier</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 220, // extra space so inputs/buttons clear the keyboard
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
  label: {
    fontSize: 14,
    color: '#1A2233',
    marginBottom: 6,
    marginLeft: 4,
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
