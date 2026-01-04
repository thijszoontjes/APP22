import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import EditSvg from '@/assets/images/edit-svgrepo-com.svg';
import MailSvg from '@/assets/images/mail-alt-3-svgrepo-com.svg';
import NotificationSvg from '@/assets/images/notification-12-svgrepo-com.svg';
import PhoneSvg from '@/assets/images/phone-svgrepo-com.svg';
import AppHeader from '@/components/app-header';
import { getCurrentUserProfile } from '@/hooks/useAuthApi';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

const SECTOR_OPTIONS = [
  'Gezondheidszorg en Welzijn',
  'Handel en dienstverlening',
  'ICT',
  'Justitie, veiligheid en openbaar bestuur',
  'Milieu en Agrarische sector',
  'Media en Communicatie',
  'Onderwijs, cultuur en wetenschap',
  'Techniek, productie en bouw',
  'Toerisme, recreatie en horeca',
  'Transport en Logistiek',
  'Behoefte aan investering',
  'Interesse om te investeren'
];

export default function SettingsPage() {
  const router = useRouter();
  const [showSectorPicker, setShowSectorPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    naam: '',
    email: '',
    telefoon: '',
    functie: '',
    sector: '',
    biografie: '',
  });
  const [selectedInteresses, setSelectedInteresses] = useState<string[]>([]);
  const [switches, setSwitches] = useState({
    pushMeldingen: false,
    updateEmail: false,
    contactInfoProfiel: false,
  });

  // Load user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userProfile = await getCurrentUserProfile();
        if (userProfile) {
          setFormData({
            naam: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
            email: userProfile.email || '',
            telefoon: userProfile.phone_number || '',
            functie: userProfile.job_function || '',
            sector: userProfile.sector || '',
            biografie: userProfile.biography || '',
          });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleSwitchToggle = (switchKey: keyof typeof switches) => {
    setSwitches(prev => ({
      ...prev,
      [switchKey]: !prev[switchKey],
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInteresseToggle = (interesse: string) => {
    setSelectedInteresses(prev =>
      prev.includes(interesse)
        ? prev.filter(i => i !== interesse)
        : [...prev, interesse]
    );
  };

  const handleSectorSelect = (sector: string) => {
    setFormData(prev => ({
      ...prev,
      sector: sector,
    }));
    setShowSectorPicker(false);
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Instellingenn"
        leading={
          <TouchableOpacity style={styles.backCircle} activeOpacity={0.8} onPress={() => router.back()}>
            <ArrowBackSvg width={22} height={22} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profielfoto */}
        <View style={styles.profileSection}>
          <View style={styles.profilePicCircle} />
          <TouchableOpacity style={styles.editProfileButton} activeOpacity={0.8}>
            <Text style={styles.editProfileButtonText}>Profiel foto bewerken</Text>
            <EditSvg width={18} height={18} />
          </TouchableOpacity>
        </View>

        {/* Gegevens aanpassen section */}
        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Gegevens aanpassen</Text>
          <View style={styles.orangeLine} />

          {/* Naam */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Naam</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Voer je naam in"
              placeholderTextColor="#999"
              value={formData.naam}
              onChangeText={(value) => handleInputChange('naam', value)}
            />
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Voer je email in"
              placeholderTextColor="#999"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
            />
          </View>

          {/* Telefoon */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefoon</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Voer je telefoonnummer in"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={formData.telefoon}
              onChangeText={(value) => handleInputChange('telefoon', value)}
            />
          </View>

          {/* Functie */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Functie</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Voer je functie in"
              placeholderTextColor="#999"
              value={formData.functie}
              onChangeText={(value) => handleInputChange('functie', value)}
            />
          </View>

          {/* Sector */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Sector</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowSectorPicker(true)}>
              <Text style={[styles.dropdownButtonText, formData.sector ? { color: '#1A2233' } : { color: '#999' }]}>
                {formData.sector || 'Kies een sector'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Biografie */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Biografie</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              placeholder="Voer je biografie in"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={formData.biografie}
              onChangeText={(value) => handleInputChange('biografie', value)}
              textAlignVertical="top"
            />
          </View>

          {/* Interesses */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { textAlign: 'center' }]}>Interesses</Text>
            <View style={styles.interessesContainer}>
              {SECTOR_OPTIONS.map((interesse, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.interesseBox,
                    selectedInteresses.includes(interesse) && styles.interesseBoxActive,
                  ]}
                  onPress={() => handleInteresseToggle(interesse)}>
                  <Text
                    style={[
                      styles.interesseText,
                      selectedInteresses.includes(interesse) && styles.interesseTextActive,
                    ]}>
                    {interesse}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Switches */}
          <View style={styles.switchesSection}>
            {/* Push Meldingen */}
            <View style={styles.switchItem}>
              <View style={styles.switchLabelContainer}>
                <View style={styles.switchIcon}>
                  <NotificationSvg width={25} height={25} />
                </View>
                <Text style={styles.switchLabel}>Pushmeldingen aan</Text>
              </View>
              <Switch
                value={switches.pushMeldingen}
                onValueChange={() => handleSwitchToggle('pushMeldingen')}
                trackColor={{ false: '#D0D0D0', true: ORANGE }}
                thumbColor="#fff"
              />
            </View>

            {/* Update Email */}
            <View style={styles.switchItem}>
              <View style={styles.switchLabelContainer}>
                <View style={styles.switchIcon}>
                  <MailSvg width={20} height={20} />
                </View>
                <Text style={styles.switchLabel}>Stuur update email</Text>
              </View>
              <Switch
                value={switches.updateEmail}
                onValueChange={() => handleSwitchToggle('updateEmail')}
                trackColor={{ false: '#D0D0D0', true: ORANGE }}
                thumbColor="#fff"
              />
            </View>

            {/* Contact Info Profiel */}
            <View style={styles.switchItem}>
              <View style={styles.switchLabelContainer}>
                <View style={styles.switchIcon}>
                  <PhoneSvg width={20} height={20} />
                </View>
                <Text style={styles.switchLabel}>Contactinfo bij profiel tonen</Text>
              </View>
              <Switch
                value={switches.contactInfoProfiel}
                onValueChange={() => handleSwitchToggle('contactInfoProfiel')}
                trackColor={{ false: '#D0D0D0', true: ORANGE }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Opslaan knop */}
          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85}>
            <Text style={styles.saveButtonText}>Opslaan</Text>
          </TouchableOpacity>

          {/* Oranje streep */}
          <View style={styles.dividerLine} />

          {/* Speel onboarding opnieuw af button */}
          <TouchableOpacity style={styles.onboardingButton} activeOpacity={0.85}>
            <Text style={styles.onboardingButtonText}>Speel onboarding opnieuw af</Text>
          </TouchableOpacity>

          {/* Uitloggen button */}
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85}>
            <Text style={styles.logoutButtonText}>Uitloggen</Text>
          </TouchableOpacity>

          {/* Verwijder mijn account link */}
          <TouchableOpacity style={styles.deleteAccountLinkContainer} activeOpacity={0.7}>
            <Text style={styles.deleteAccountLink}>Verwijder mijn account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sector Picker Modal */}
      <Modal
        visible={showSectorPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSectorPicker(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kies een sector</Text>
              <TouchableOpacity onPress={() => setShowSectorPicker(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {SECTOR_OPTIONS.map((sector, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
                    formData.sector === sector && styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSectorSelect(sector)}>
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.sector === sector && styles.modalOptionTextSelected,
                    ]}>
                    {sector}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profilePicCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF8700',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  editProfileButton: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editProfileButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  dataSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2233',
    textAlign: 'center',
    marginBottom: 12,
  },
  orangeLine: {
    height: 1.5,
    backgroundColor: '#FFB347',
    borderRadius: 1,
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2233',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A2233',
    backgroundColor: '#FAFAFA',
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: ORANGE,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginTop: 20,
    alignSelf: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#1A2233',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#000000',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2233',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  modalOptions: {
    paddingHorizontal: 0,
  },
  modalOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: '#FFF4E0',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#1A2233',
  },
  modalOptionTextSelected: {
    fontWeight: '600',
    color: ORANGE,
  },
  interessesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interesseBox: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
  },
  interesseBoxActive: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },
  interesseText: {
    fontSize: 13,
    color: '#1A2233',
    fontWeight: '500',
  },
  interesseTextActive: {
    color: '#fff',
  },
  switchesSection: {
    marginVertical: 24,
    gap: 12,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2233',
    flex: 1,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchIcon: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#FFB347',
    marginVertical: 24,
    width: '100%',
  },
  onboardingButton: {
    backgroundColor: ORANGE,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  onboardingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e6222fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountLinkContainer: {
    paddingVertical: 8,
    marginBottom: 20,
    alignSelf: 'center',
  },
  deleteAccountLink: {
    color: '#e6222fff',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
