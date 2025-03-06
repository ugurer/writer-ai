import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Appbar, Surface, Text, Switch, IconButton, Portal, Dialog, TextInput, useTheme, Chip, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useStore } from '../store';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SaveInterval = 'off' | '30s' | '1m' | '5m' | '15m';
type FontSize = 'small' | 'medium' | 'large';
type EditorTheme = 'light' | 'dark' | 'sepia';

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const { darkMode, toggleDarkMode, autoSave, setAutoSave } = useStore();
  
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveInterval, setSaveInterval] = useState<SaveInterval>('1m');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('light');
  const [error, setError] = useState<string | null>(null);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      setError('API anahtarı boş olamaz');
      return;
    }
    // API anahtarını kaydet
    setShowApiKeyDialog(false);
  };

  const getSaveIntervalLabel = (interval: SaveInterval): string => {
    switch (interval) {
      case 'off': return 'Kapalı';
      case '30s': return '30 saniye';
      case '1m': return '1 dakika';
      case '5m': return '5 dakika';
      case '15m': return '15 dakika';
    }
  };

  const getFontSizeLabel = (size: FontSize): string => {
    switch (size) {
      case 'small': return 'Küçük';
      case 'medium': return 'Orta';
      case 'large': return 'Büyük';
    }
  };

  const getEditorThemeLabel = (theme: EditorTheme): string => {
    switch (theme) {
      case 'light': return 'Aydınlık';
      case 'dark': return 'Karanlık';
      case 'sepia': return 'Sepya';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View 
        entering={FadeIn}
        style={[styles.header, { 
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outline
        }]}
      >
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          />
          <Text variant="headlineMedium" style={styles.title}>Ayarlar</Text>
        </View>
      </Animated.View>

      <ScrollView style={styles.content}>
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Görünüm
          </Text>
          <View style={[styles.setting, { borderBottomColor: theme.colors.outline }]}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Karanlık Mod</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Uygulamayı karanlık temada görüntüle
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
            />
          </View>

          <View style={[styles.setting, { borderBottomColor: theme.colors.outline }]}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Yazı Boyutu</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Editör yazı boyutunu ayarla
              </Text>
            </View>
            <SegmentedButtons
              value={fontSize}
              onValueChange={value => setFontSize(value as FontSize)}
              buttons={[
                { value: 'small', label: 'A' },
                { value: 'medium', label: 'A', style: { transform: [{ scale: 1.2 }] } },
                { value: 'large', label: 'A', style: { transform: [{ scale: 1.4 }] } },
              ]}
            />
          </View>

          <View style={[styles.setting, { borderBottomColor: theme.colors.outline }]}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Editör Teması</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Yazı editörü renk temasını seç
              </Text>
            </View>
            <View style={styles.themeChips}>
              {(['light', 'dark', 'sepia'] as EditorTheme[]).map(t => (
                <Chip
                  key={t}
                  selected={editorTheme === t}
                  onPress={() => setEditorTheme(t)}
                  style={[
                    styles.themeChip,
                    {
                      backgroundColor: t === 'light' ? '#ffffff' :
                                     t === 'dark' ? '#1a1a1a' : '#f4ecd8'
                    }
                  ]}
                  textStyle={{
                    color: t === 'dark' ? '#ffffff' : '#000000'
                  }}
                >
                  {getEditorThemeLabel(t)}
                </Chip>
              ))}
            </View>
          </View>
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Düzenleme
          </Text>
          <View style={[styles.setting, { borderBottomColor: theme.colors.outline }]}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Otomatik Kaydetme</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Değişiklikleri otomatik kaydet
              </Text>
            </View>
            <Switch
              value={autoSave}
              onValueChange={setAutoSave}
            />
          </View>

          <View style={[styles.setting, { borderBottomColor: theme.colors.outline }]}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Kaydetme Aralığı</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Otomatik kaydetme sıklığı
              </Text>
            </View>
            <SegmentedButtons
              value={saveInterval}
              onValueChange={value => setSaveInterval(value as SaveInterval)}
              buttons={[
                { value: 'off', label: 'Kapalı' },
                { value: '30s', label: '30s' },
                { value: '1m', label: '1d' },
                { value: '5m', label: '5d' },
                { value: '15m', label: '15d' },
              ]}
              style={styles.intervalButtons}
            />
          </View>
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            AI Ayarları
          </Text>
          <View style={[styles.setting, { borderBottomColor: theme.colors.outline }]}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">API Anahtarı</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                AI servisi için API anahtarını ayarla
              </Text>
            </View>
            <IconButton
              icon="key"
              mode="contained"
              onPress={() => setShowApiKeyDialog(true)}
            />
          </View>
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Veri
          </Text>
          <View style={[styles.setting, { borderBottomColor: theme.colors.outline }]}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Verileri Dışa Aktar</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Tüm projelerinizi yedekleyin
              </Text>
            </View>
            <IconButton
              icon="export"
              mode="contained"
              onPress={() => setShowExportDialog(true)}
            />
          </View>
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Hakkında
          </Text>
          <View style={styles.aboutInfo}>
            <Text variant="bodyLarge">Writer AI</Text>
            <Text variant="bodyMedium">Versiyon 1.0.0</Text>
            <Text variant="bodySmall" style={styles.copyright}>
              © 2024 Writer AI. Tüm hakları saklıdır.
            </Text>
          </View>
        </Surface>
      </ScrollView>

      <Portal>
        <Dialog visible={!!error} onDismiss={() => setError(null)}>
          <Dialog.Title>Hata</Dialog.Title>
          <Dialog.Content>
            <Text>{error}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Text onPress={() => setError(null)}>Tamam</Text>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showApiKeyDialog} onDismiss={() => setShowApiKeyDialog(false)}>
          <Dialog.Title>API Anahtarı</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="API Anahtarı"
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showApiKey}
              right={
                <TextInput.Icon
                  icon={showApiKey ? 'eye-off' : 'eye'}
                  onPress={() => setShowApiKey(!showApiKey)}
                />
              }
            />
          </Dialog.Content>
          <Dialog.Actions>
            <IconButton icon="close" onPress={() => setShowApiKeyDialog(false)} />
            <IconButton icon="check" onPress={handleSaveApiKey} />
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showExportDialog} onDismiss={() => setShowExportDialog(false)}>
          <Dialog.Title>Dışa Aktarma</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Tüm projeleriniz ve ayarlarınız dışa aktarılacak. Bu işlem biraz zaman alabilir.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <IconButton icon="close" onPress={() => setShowExportDialog(false)} />
            <IconButton
              icon="check"
              onPress={() => {
                // Dışa aktarma işlemi
                setShowExportDialog(false);
              }}
            />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    padding: 16,
    borderBottomWidth: 1,
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    marginTop: 4,
    opacity: 0.7,
  },
  themeChips: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    borderWidth: 1,
  },
  intervalButtons: {
    maxWidth: 300,
  },
  aboutInfo: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  copyright: {
    marginTop: 8,
    opacity: 0.7,
  },
}); 