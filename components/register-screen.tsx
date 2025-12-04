import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { registerApi, loginApi } from '@/hooks/useAuthApi';
import { saveAuthTokens } from '@/hooks/authStorage';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const sanitizeInputs = () => {
    const normalizedName = name.replace(/\s+/g, ' ').trim();
    const normalizedEmail = email.replace(/\s+/g, '');
    const normalizedPhone = phone.replace(/\s+/g, '');
    const normalizedPassword = password.trim();
    const normalizedRepeat = repeatPassword.trim();

    if (normalizedName !== name) setName(normalizedName);
    if (normalizedEmail !== email) setEmail(normalizedEmail);
    if (normalizedPhone !== phone) setPhone(normalizedPhone);
    if (normalizedPassword !== password) setPassword(normalizedPassword);
    if (normalizedRepeat !== repeatPassword) setRepeatPassword(normalizedRepeat);

    return {
      normalizedName,
      normalizedEmail,
      normalizedPhone,
      normalizedPassword,
      normalizedRepeat,
    };
  };

  const validate = (
    normalizedName: string,
    normalizedEmail: string,
    normalizedPhone: string,
    normalizedPassword: string,
    normalizedRepeat: string,
  ) => {
    const filled =
      !!normalizedName &&
      !!normalizedEmail &&
      !!normalizedPhone &&
      !!normalizedPassword &&
      !!normalizedRepeat;
    const emailHasAt = normalizedEmail.includes('@');
    if (!filled) {
      setValidationError('Niet alle velden zijn ingevuld');
      return false;
    }
    if (!emailHasAt) {
      setValidationError('Voer een geldig e-mailadres in');
      return false;
    }
    if (normalizedPassword !== normalizedRepeat) {
      setValidationError('Wachtwoorden moeten overeenkomen');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleRegister = async () => {
    setApiError('');
    setValidationError('');
    const {
      normalizedName,
      normalizedEmail,
      normalizedPhone,
      normalizedPassword,
      normalizedRepeat,
    } = sanitizeInputs();
    if (!validate(normalizedName, normalizedEmail, normalizedPhone, normalizedPassword, normalizedRepeat))
      return;
    setLoading(true);
    const [first_name, ...rest] = normalizedName.split(' ');
    const last_name = rest.join(' ') || first_name;

    try {
      const createdUser = await registerApi({
        first_name,
        last_name,
        email: normalizedEmail,
        phone_number: normalizedPhone,
        password: normalizedPassword,
      });
      // Auto-inloggen voor direct gebruik na registreren (met korte retry zodat Keycloak sync tijd heeft)
      let tokenReceived = false;
      let lastError: any = null;
      for (let attempt = 0; attempt < 3 && !tokenReceived; attempt += 1) {
        try {
          const token = await loginApi({ email: normalizedEmail, password: normalizedPassword });
          if (token?.access_token && token?.refresh_token) {
            await saveAuthTokens(token.access_token, token.refresh_token);
            tokenReceived = true;
            router.replace('/(tabs)');
            break;
          }
        } catch (err: any) {
          lastError = err;
          if (attempt < 2) {
            await sleep(600); // wacht kort; backend kan nog aan het aanmaken zijn
          }
        }
      }
      if (!tokenReceived) {
        // Registratie is wel gelukt; stuur gebruiker naar login met melding
        setApiError('Account aangemaakt. Inloggen lukt nog niet; probeer zo opnieuw in te loggen.');
        router.replace('/login');
      }
    } catch (err: any) {
      setApiError(err?.message || 'Registratie mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/login-header.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Account aanmaken</Text>

          <Text style={styles.label}>Naam</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.label}>Telefoonnummer</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Text style={styles.label}>Wachtwoord</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
              <Image
                source={require('@/assets/images/eye.png')}
                style={styles.eyeImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Wachtwoord herhalen</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showRepeat}
              value={repeatPassword}
              onChangeText={setRepeatPassword}
            />
            <TouchableOpacity onPress={() => setShowRepeat((prev) => !prev)}>
              <Image
                source={require('@/assets/images/eye.png')}
                style={styles.eyeImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {!!validationError && <Text style={styles.errorText}>{validationError}</Text>}
          {!!apiError && <Text style={styles.errorText}>{apiError}</Text>}
          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.75 }]}
            onPress={handleRegister}
            disabled={loading}>
            <Text style={styles.submitText}>{loading ? 'Registreren...' : 'Registreer'}</Text>
          </TouchableOpacity>

          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.backLink}>Terug naar inloggen</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ORANGE = '#ff8a00';

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
    paddingBottom: 320, // extra space so bottom fields/buttons clear the keyboard
  },
  hero: {
    height: '40%',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badge: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    marginLeft: -32,
    height: 64,
    width: 128,
    alignItems: 'center',
  },
  badgeCircle: {
    width: 90,
    height: 60,
    borderRadius: 30,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#fff',
    flexDirection: 'row',
  },
  badgeTail: {
    position: 'absolute',
    right: 16,
    bottom: -2,
    width: 18,
    height: 24,
    backgroundColor: ORANGE,
    transform: [{ skewY: '-12deg' }],
  },
  badgeText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
  },
  form: {
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    color: '#121212',
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    color: '#1A2233',
    marginLeft: 4,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  eyeImg: {
    width: 22,
    height: 22,
    tintColor: '#b4b4b4',
  },
  errorText: {
    color: '#d11',
    fontSize: 13,
    marginTop: -6,
    marginBottom: 10,
    marginLeft: 4,
  },
  submitButton: {
    height: 38,
    backgroundColor: ORANGE,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    width: 160,
    alignSelf: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  backLink: {
    marginTop: 18,
    color: '#6b82ff',
    fontSize: 15,
    textAlign: 'center',
  },
});
