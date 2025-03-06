import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Appbar, Surface, Text, TextInput, FAB, SegmentedButtons, useTheme, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useStore } from '../store';
import * as AI from '../services/ai';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ProjectType = 'novel' | 'story' | 'article';

type Template = {
  title: string;
  description: string;
  type: ProjectType;
};

export default function NewProjectScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const { createProject } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProjectType>('novel');
  const [genre, setGenre] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [type]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const prompt = `${type} türünde bir yazı projesi için 3 farklı şablon öner. Her şablon için başlık ve kısa açıklama içermeli. JSON formatında döndür: [{ "title": "...", "description": "...", "type": "${type}" }]`;
      
      const response = await AI.generateText(prompt);
      const suggestions = JSON.parse(response.text) as Template[];
      setTemplates(suggestions);
    } catch (error) {
      console.error('Şablonlar yüklenirken hata:', error);
      // Hata durumunda varsayılan şablonları göster
      setTemplates([
        {
          title: 'Klasik Format',
          description: type === 'novel' ? '3 ana bölüm, karakter gelişimi odaklı' :
                      type === 'story' ? 'Tek olay örgüsü, hızlı tempo' : 'Giriş, gelişme, sonuç formatı',
          type,
        },
        {
          title: 'Modern Yaklaşım',
          description: type === 'novel' ? 'Doğrusal olmayan anlatım, çoklu bakış açısı' :
                      type === 'story' ? 'Minimalist stil, güçlü atmosfer' : 'Problem-çözüm formatı',
          type,
        },
        {
          title: 'Deneysel Format',
          description: type === 'novel' ? 'Akış bilinci, iç monolog ağırlıklı' :
                      type === 'story' ? 'Şiirsel anlatım, metafor zengin' : 'Tartışma odaklı format',
          type,
        },
      ]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleCreateProject = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    try {
      await createProject({
        title: title.trim(),
        description: description.trim(),
        type,
        genre: genre.trim(),
        isPublic: false,
        status: 'draft',
        wordCount: 0,
        chapters: [],
        characters: [],
        plotPoints: [],
      });
      navigation.goBack();
    } catch (error) {
      console.error('Proje oluşturulurken hata:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Yeni Proje" />
      </Appbar.Header>

      <Animated.View 
        entering={FadeIn.duration(500)}
        style={styles.content}
      >
        <ScrollView>
          <Surface style={styles.formSection} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Proje Detayları
            </Text>

            <TextInput
              label="Proje Başlığı"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <TextInput
              label="Açıklama"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            <Text variant="bodyMedium" style={styles.label}>Proje Tipi</Text>
            <SegmentedButtons
              value={type}
              onValueChange={value => setType(value as ProjectType)}
              buttons={[
                { value: 'novel', label: 'Roman' },
                { value: 'story', label: 'Hikaye' },
                { value: 'article', label: 'Makale' },
              ]}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="Tür"
              value={genre}
              onChangeText={setGenre}
              style={styles.input}
              placeholder="Örn: Bilim Kurgu, Fantastik, Romantik..."
            />
          </Surface>

          <Surface style={styles.templateSection} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              AI Önerilen Şablonlar
            </Text>

            {isLoadingTemplates ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Şablonlar yükleniyor...</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {templates.map((template, index) => (
                  <Surface
                    key={index}
                    style={[
                      styles.templateCard,
                      { 
                        backgroundColor: index === 0 ? theme.colors.primary :
                                       index === 1 ? theme.colors.secondary :
                                       theme.colors.tertiary || theme.colors.primary
                      }
                    ]}
                    elevation={2}
                  >
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                  </Surface>
                ))}
              </ScrollView>
            )}
          </Surface>
        </ScrollView>
      </Animated.View>

      <FAB
        icon="check"
        label="Proje Oluştur"
        style={styles.fab}
        onPress={handleCreateProject}
        loading={isCreating}
        disabled={!title.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  templateSection: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  templateCard: {
    padding: 16,
    borderRadius: 8,
    marginRight: 16,
    width: 200,
  },
  templateTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  templateDescription: {
    color: '#fff',
    opacity: 0.8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    opacity: 0.7,
  },
}); 