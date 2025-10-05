// dependencies
import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {CaretDown, X} from 'phosphor-react-native';

// components
import {Text, Divider} from '@/components';

// types
import {FBColors, FBBackground, FBBorders} from '@/types/styles';

// utils
import {SUPPORTED_LANGUAGES, saveLanguagePreference} from '@/utils/i18n';

interface LanguageSelectorProps {
  style?: any;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({style}) => {
  const {i18n, t} = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage =
    SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
    await saveLanguagePreference(languageCode);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, style]}
        onPress={() => setModalVisible(true)}>
        <Text size="sm" color="neutral" weight="500">
          {currentLanguage.nativeName}
        </Text>
        <CaretDown size={20} color={FBColors.neutral} weight="regular" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text size="lg" weight="700" color="neutral">
                {t('login.select_language')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={FBColors.neutral} weight="regular" />
              </TouchableOpacity>
            </View>

            <Divider height={16} />

            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    item.code === i18n.language && styles.selectedLanguage,
                  ]}
                  onPress={() => handleLanguageChange(item.code)}>
                  <Text
                    size="md"
                    weight={item.code === i18n.language ? '600' : '400'}
                    color={
                      item.code === i18n.language ? 'complementary' : 'neutral'
                    }>
                    {item.nativeName}
                  </Text>
                  {item.name !== item.nativeName && (
                    <Text size="sm" color="steelBlue" weight="400">
                      {item.name}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <Divider height={8} />}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default LanguageSelector;

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: FBBorders.input,
    backgroundColor: FBBackground.input,
    minHeight: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: FBColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: FBBackground.input,
  },
  selectedLanguage: {
    backgroundColor: FBBackground.lightGreen,
    borderWidth: 1,
    borderColor: FBColors.complementary,
  },
});
