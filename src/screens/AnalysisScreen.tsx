import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Appbar, Surface, Text, TextInput, IconButton, Portal, Dialog, FAB, useTheme, Chip, ProgressBar, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import * as AI from '../services/ai';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type AnalysisType = 
  | 'readability' 
  | 'emotion' 
  | 'pacing' 
  | 'consistency' 
  | 'style' 
  | 'dialogue' 
  | 'description' 
  | 'conflict';

type AnalysisResult = {
  type: AnalysisType;
  score: number;
  feedback: string[];
  suggestions: string[];
};

export default function AnalysisScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'results'>('editor');

  const analyzeText = async (type: AnalysisType) => {
    if (!content) {
      setError('Lütfen analiz edilecek metni girin');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const details = await AI.analyzeText(content, 
        type === 'readability' ? 'okunabilirlik' :
        type === 'emotion' ? 'duygusal etki' :
        type === 'pacing' ? 'tempo' :
        type === 'consistency' ? 'tutarlılık' :
        type === 'style' ? 'yazım stili' :
        type === 'dialogue' ? 'diyalog' :
        type === 'description' ? 'betimleme' : 'çatışma'
      );

      const result: AnalysisResult = {
        type,
        score: details.score,
        feedback: details.feedback,
        suggestions: details.suggestions,
      };

      setResults(prev => {
        const filtered = prev.filter(r => r.type !== type);
        return [...filtered, result];
      });
      setSelectedResult(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTypeLabel = (type: AnalysisType): string => {
    switch (type) {
      case 'readability': return 'Okunabilirlik';
      case 'emotion': return 'Duygusal Etki';
      case 'pacing': return 'Tempo';
      case 'consistency': return 'Tutarlılık';
      case 'style': return 'Yazım Stili';
      case 'dialogue': return 'Diyaloglar';
      case 'description': return 'Betimlemeler';
      case 'conflict': return 'Çatışmalar';
    }
  };

  const getTypeIcon = (type: AnalysisType): string => {
    switch (type) {
      case 'readability': return 'book-open-variant';
      case 'emotion': return 'heart';
      case 'pacing': return 'speedometer';
      case 'consistency': return 'check-circle';
      case 'style': return 'format-font';
      case 'dialogue': return 'message-text';
      case 'description': return 'image-text';
      case 'conflict': return 'sword-cross';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeIn}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          />
          <Text variant="headlineMedium" style={styles.title}>Metin Analizi</Text>
        </View>
        <SegmentedButtons
          value={activeTab}
          onValueChange={value => setActiveTab(value as typeof activeTab)}
          buttons={[
            { value: 'editor', label: 'Düzenleyici' },
            { value: 'results', label: 'Sonuçlar' },
          ]}
        />
      </Animated.View>

      <View style={styles.content}>
        {activeTab === 'editor' ? (
          <Surface style={styles.editorContainer} elevation={2}>
            <TextInput
              mode="outlined"
              multiline
              value={content}
              onChangeText={setContent}
              placeholder="Analiz edilecek metni buraya girin..."
              style={styles.editor}
              contentStyle={styles.editorContent}
              textAlignVertical="top"
            />
            <Surface style={styles.toolbarContainer} elevation={4}>
              <View style={styles.toolbarSection}>
                <Text variant="titleSmall" style={styles.toolbarTitle}>Temel Analiz</Text>
                <View style={styles.toolbarButtons}>
                  <IconButton
                    icon="book-open-variant"
                    mode="contained"
                    onPress={() => analyzeText('readability')}
                    loading={isGenerating}
                    disabled={isGenerating || !content}
                  />
                  <IconButton
                    icon="heart"
                    mode="contained"
                    onPress={() => analyzeText('emotion')}
                    loading={isGenerating}
                    disabled={isGenerating || !content}
                  />
                  <IconButton
                    icon="speedometer"
                    mode="contained"
                    onPress={() => analyzeText('pacing')}
                    loading={isGenerating}
                    disabled={isGenerating || !content}
                  />
                  <IconButton
                    icon="check-circle"
                    mode="contained"
                    onPress={() => analyzeText('consistency')}
                    loading={isGenerating}
                    disabled={isGenerating || !content}
                  />
                </View>
              </View>

              <View style={styles.toolbarSection}>
                <Text variant="titleSmall" style={styles.toolbarTitle}>Detaylı Analiz</Text>
                <View style={styles.toolbarButtons}>
                  <IconButton
                    icon="format-font"
                    mode="contained"
                    onPress={() => analyzeText('style')}
                    loading={isGenerating}
                    disabled={isGenerating || !content}
                  />
                  <IconButton
                    icon="message-text"
                    mode="contained"
                    onPress={() => analyzeText('dialogue')}
                    loading={isGenerating}
                    disabled={isGenerating || !content}
                  />
                  <IconButton
                    icon="image-text"
                    mode="contained"
                    onPress={() => analyzeText('description')}
                    loading={isGenerating}
                    disabled={isGenerating || !content}
                  />
                  <IconButton
                    icon="sword-cross"
                    mode="contained"
                    onPress={() => analyzeText('conflict')}
                    loading={isGenerating}
                    disabled={isGenerating || !content}
                  />
                </View>
              </View>
            </Surface>
          </Surface>
        ) : (
          <View style={styles.resultsView}>
            <Surface style={styles.resultsList} elevation={2}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {results.map(result => (
                  <Surface 
                    key={result.type}
                    style={[
                      styles.resultCard,
                      selectedResult?.type === result.type && styles.selectedCard
                    ]}
                    elevation={2}
                  >
                    <IconButton
                      icon={getTypeIcon(result.type)}
                      size={32}
                      style={styles.resultIcon}
                    />
                    <Text variant="titleMedium">{getTypeLabel(result.type)}</Text>
                    <ProgressBar 
                      progress={result.score / 100} 
                      color={theme.colors.primary}
                      style={styles.progressBar}
                    />
                    <Text variant="bodyMedium" style={styles.scoreText}>
                      {result.score}/100
                    </Text>
                    <IconButton
                      icon="chevron-right"
                      onPress={() => setSelectedResult(result)}
                    />
                  </Surface>
                ))}
              </ScrollView>
            </Surface>

            {selectedResult ? (
              <Animated.View
                entering={SlideInRight}
                style={styles.resultDetail}
              >
                <Surface style={styles.detailContent} elevation={2}>
                  <View style={styles.detailHeader}>
                    <IconButton
                      icon={getTypeIcon(selectedResult.type)}
                      size={32}
                    />
                    <View style={styles.detailHeaderInfo}>
                      <Text variant="headlineMedium">{getTypeLabel(selectedResult.type)}</Text>
                      <Text variant="titleMedium" style={styles.scoreText}>
                        Puan: {selectedResult.score}/100
                      </Text>
                    </View>
                  </View>

                  <ScrollView style={styles.detailScroll}>
                    <View style={styles.detailSection}>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        Geri Bildirim
                      </Text>
                      <View style={styles.feedbackContainer}>
                        {selectedResult.feedback.map((item, index) => (
                          <Surface key={index} style={styles.feedbackCard} elevation={1}>
                            <Text>{item}</Text>
                          </Surface>
                        ))}
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        Öneriler
                      </Text>
                      <View style={styles.suggestionsContainer}>
                        {selectedResult.suggestions.map((item, index) => (
                          <Surface key={index} style={styles.suggestionCard} elevation={1}>
                            <Text>{item}</Text>
                          </Surface>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                </Surface>
              </Animated.View>
            ) : (
              <View style={styles.emptyDetail}>
                <IconButton
                  icon="chart-bar"
                  size={48}
                  style={styles.emptyIcon}
                />
                <Text variant="titleLarge" style={styles.emptyText}>
                  Detayları görüntülemek için bir sonuç seçin
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

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
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
  editorContainer: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  editor: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  editorContent: {
    padding: 16,
    paddingBottom: 120,
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    padding: 16,
  },
  toolbarSection: {
    marginBottom: 16,
  },
  toolbarTitle: {
    marginBottom: 8,
    opacity: 0.7,
  },
  toolbarButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  resultsView: {
    flex: 1,
    gap: 16,
  },
  resultsList: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  resultCard: {
    padding: 16,
    marginRight: 16,
    borderRadius: 12,
    width: 160,
    alignItems: 'center',
  },
  selectedCard: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  resultIcon: {
    margin: 0,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginVertical: 8,
  },
  scoreText: {
    opacity: 0.7,
  },
  resultDetail: {
    flex: 1,
  },
  detailContent: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  detailScroll: {
    flex: 1,
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    marginBottom: 16,
    opacity: 0.7,
  },
  feedbackContainer: {
    gap: 8,
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  suggestionsContainer: {
    gap: 8,
  },
  suggestionCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  emptyDetail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  emptyIcon: {
    opacity: 0.5,
    margin: 16,
  },
  emptyText: {
    opacity: 0.5,
    textAlign: 'center',
    maxWidth: 300,
  },
}); 