import React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={{ uri: 'https://via.placeholder.com/860x658.png?text=Login+Background' }}
          style={styles.bgImage}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        <View style={styles.iconBubble}>
          <Text style={styles.iconText}>22</Text>
        </View>
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
            secureTextEntry={true}
          />
          <Pressable style={styles.eyeIcon}>
            <Image source={{ uri: 'https://via.placeholder.com/22x22.png?text=👁️' }} style={styles.eyeImg} />
          </Pressable>
        </View>
        <TouchableOpacity>
          <Text style={styles.forgot}>Wachtwoord vergeten?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>Inloggen</Text>
        </TouchableOpacity>
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Nog geen onderdeel van het netwerk? </Text>
          <TouchableOpacity>
            <Text style={styles.registerLink}>Registreer hier</Text>
          </TouchableOpacity>
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
    height: 260,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  iconBubble: {
    position: 'absolute',
    top: 90,
    left: '50%',
    marginLeft: -45,
    width: 90,
    height: 60,
    backgroundColor: '#FF8700',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#fff',
    flexDirection: 'row',
  },
  iconText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 2,
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
    tintColor: '#bbb',
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
    height: 44,
    marginBottom: 32,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 20,
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
