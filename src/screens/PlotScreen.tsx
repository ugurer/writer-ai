import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { Appbar, Surface, Text, TextInput, IconButton, Portal, Dialog, FAB, useTheme, Chip, Menu, SegmentedButtons, ActivityIndicator, Card, Paragraph, Button, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import * as AI from '../services/ai';
import { PlotPoint, Character } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type PlotPoint = {
  id: string;
  title: string;
  description: string;
  type: 'event' | 'revelation' | 'decision' | 'conflict' | 'resolution';
  characters: string[];
  impact: string;
  order: number;
  progress: number;
};

type PlotPhase = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution';

type PlotSuggestion = {
  title: string;
  description: string;
  emotionalImpact: string;
  involvedCharacters: string[];
  tension: number;
};

const { width } = Dimensions.get('window');
const DETAIL_WIDTH = width * 0.4;

export default function PlotScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<PlotPoint | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<PlotPhase>('setup');
  const [searchQuery, setSearchQuery] = useState('');
  const [plotSuggestions, setPlotSuggestions] = useState<PlotSuggestion[]>([]);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
  const [targetEmotion, setTargetEmotion] = useState('');
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);

  const filteredPoints = plotPoints.filter(point => {
    const matchesSearch = point.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         point.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Olay noktalarını fazlara göre filtreleme mantığı
    const progress = point.progress;
    if (activePhase === 'setup') return progress <= 0.2 && matchesSearch;
    if (activePhase === 'rising') return progress > 0.2 && progress <= 0.5 && matchesSearch;
    if (activePhase === 'climax') return progress > 0.5 && progress <= 0.7 && matchesSearch;
    if (activePhase === 'falling') return progress > 0.7 && progress <= 0.9 && matchesSearch;
    if (activePhase === 'resolution') return progress > 0.9 && matchesSearch;
    return matchesSearch;
  });

  const generatePlotPoint = async (title: string) => {
    if (!title) {
      setError('Lütfen olay başlığını girin');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const context = plotPoints.map(p => `${p.title}: ${p.description}`).join('\n');
      const details = await AI.generatePlotPoint(title, context);

      const point: PlotPoint = {
        id: Date.now().toString(),
        title,
        description: details.description,
        type: selectedPoint?.type || 'event',
        characters: details.characters,
        impact: details.impact,
        order: plotPoints.length,
        progress: 0,
      };

      setPlotPoints([...plotPoints, point]);
      setSelectedPoint(null);
      setShowAddDialog(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const addPlotPoint = () => {
    if (!selectedPoint) return;

    const point: PlotPoint = {
      id: Date.now().toString(),
      title: selectedPoint.title,
      description: selectedPoint.description || '',
      type: selectedPoint.type || 'event',
      characters: selectedPoint.characters || [],
      impact: selectedPoint.impact || '',
      order: plotPoints.length,
      progress: 0,
    };

    setPlotPoints([...plotPoints, point]);
    setSelectedPoint(null);
    setShowAddDialog(false);
  };

  const getPhaseLabel = (phase: PlotPhase): string => {
    switch (phase) {
      case 'setup': return 'Giriş';
      case 'rising': return 'Gelişme';
      case 'climax': return 'Doruk';
      case 'falling': return 'Düşüş';
      case 'resolution': return 'Çözüm';
    }
  };

  const getPhaseColor = (phase: PlotPhase) => {
    switch (phase) {
      case 'setup': return theme.colors.primary;
      case 'rising': return theme.colors.secondary;
      case 'climax': return theme.colors.error;
      case 'falling': return theme.colors.tertiary;
      case 'resolution': return theme.colors.primary;
    }
  };

  const handlePlotSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      const result = await AI.suggestPlotDevelopments(plotPoints, characters, targetEmotion);
      setPlotSuggestions(result.suggestions);
    } catch (error) {
      console.error('Olay örgüsü önerileri hatası:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const addSuggestionToPlot = (suggestion: PlotSuggestion) => {
    const newPlotPoint: PlotPoint = {
      id: Date.now().toString(),
      title: suggestion.title,
      description: suggestion.description,
      type: 'conflict',
      characters: suggestion.involvedCharacters,
      consequences: [],
      progress: 0
    };
    
    setPlotPoints(prev => [...prev, newPlotPoint]);
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
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>Olay Örgüsü</Text>
        </View>
        <FAB
          icon="plus"
          label="Yeni Olay"
          onPress={() => setShowAddDialog(true)}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        />
      </Animated.View>

      <View style={styles.content}>
        <Surface style={[styles.plotList, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <View style={[styles.searchContainer, { borderBottomColor: theme.colors.outline }]}>
            <TextInput
              mode="outlined"
              placeholder="Ara..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              right={<TextInput.Icon icon="magnify" />}
              style={[styles.searchInput, { color: theme.colors.onSurface }]}
            />
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={[styles.phaseScroll, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              {(['setup', 'rising', 'climax', 'falling', 'resolution'] as PlotPhase[]).map(phase => (
                <Chip
                  key={phase}
                  selected={activePhase === phase}
                  onPress={() => setActivePhase(phase)}
                  style={[
                    styles.phaseChip,
                    activePhase === phase && { backgroundColor: getPhaseColor(phase) }
                  ]}
                >
                  {getPhaseLabel(phase)}
                </Chip>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={styles.plotScroll}>
            {filteredPoints.map((point, index) => (
              <Animated.View
                key={point.id}
                entering={FadeIn.delay(index * 100)}
              >
                <Surface 
                  style={[
                    styles.plotCard,
                    selectedPoint?.id === point.id && [
                      styles.selectedCard,
                      { backgroundColor: theme.colors.surfaceVariant }
                    ]
                  ]}
                  elevation={2}
                >
                  <View style={styles.plotCardHeader}>
                    <IconButton
                      icon={
                        point.type === 'event' ? 'star' :
                        point.type === 'revelation' ? 'lightbulb' :
                        point.type === 'decision' ? 'scale-balance' :
                        point.type === 'conflict' ? 'sword-cross' : 'check-circle'
                      }
                      iconColor={getPhaseColor(activePhase)}
                      size={24}
                    />
                    <View style={styles.plotInfo}>
                      <Text variant="titleMedium" style={[styles.typeChip, { color: theme.colors.onSurface }]}>
                        {point.type === 'event' ? 'Olay' :
                         point.type === 'revelation' ? 'Keşif' :
                         point.type === 'decision' ? 'Karar' :
                         point.type === 'conflict' ? 'Çatışma' : 'Çözüm'}
                      </Text>
                    </View>
                    <IconButton
                      icon="chevron-right"
                      onPress={() => setSelectedPoint(point)}
                    />
                  </View>
                  <View style={styles.progressContainer}>
                    <Text variant="bodySmall" style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                      {Math.round(point.progress * 100)}%
                    </Text>
                    <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Animated.View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${point.progress * 100}%`,
                            backgroundColor: getPhaseColor(activePhase)
                          }
                        ]}
                      />
                    </View>
                  </View>
                </Surface>
              </Animated.View>
            ))}
          </ScrollView>
        </Surface>

        {selectedPoint ? (
          <Animated.View
            entering={SlideInRight}
            style={styles.plotDetail}
          >
            <Surface style={[styles.detailContent, { backgroundColor: theme.colors.surface }]} elevation={2}>
              <View style={[styles.detailHeader, { borderBottomColor: theme.colors.outline }]}>
                <IconButton
                  icon={
                    selectedPoint.type === 'event' ? 'star' :
                    selectedPoint.type === 'revelation' ? 'lightbulb' :
                    selectedPoint.type === 'decision' ? 'scale-balance' :
                    selectedPoint.type === 'conflict' ? 'sword-cross' : 'check-circle'
                  }
                  size={32}
                  iconColor={getPhaseColor(activePhase)}
                />
                <View style={styles.detailHeaderInfo}>
                  <Text variant="headlineMedium" style={[styles.typeChip, { color: theme.colors.onSurface }]}>
                    {selectedPoint.title}
                  </Text>
                  <Chip compact style={[styles.typeChip, { backgroundColor: getPhaseColor(activePhase) }]}>
                    {selectedPoint.type === 'event' ? 'Olay' :
                     selectedPoint.type === 'revelation' ? 'Keşif' :
                     selectedPoint.type === 'decision' ? 'Karar' :
                     selectedPoint.type === 'conflict' ? 'Çatışma' : 'Çözüm'}
                  </Chip>
                </View>
                <IconButton
                  icon="pencil"
                  mode="contained"
                  onPress={() => {/* Düzenleme işlevi */}}
                />
              </View>

              <ScrollView style={styles.detailScroll}>
                <View style={[styles.detailSection, { borderBottomColor: theme.colors.outline }]}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>İlerleme</Text>
                  <View style={styles.progressSection}>
                    <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Animated.View 
                        style={[
                          styles.progressFill,
                          { backgroundColor: getPhaseColor(activePhase) }
                        ]}
                      />
                    </View>
                    <View style={styles.progressButtons}>
                      <IconButton
                        icon="minus"
                        mode="contained"
                        onPress={() => {
                          const newProgress = Math.max(0, selectedPoint.progress - 0.1);
                          setPlotPoints(prev => prev.map(p => 
                            p.id === selectedPoint.id ? { ...p, progress: newProgress } : p
                          ));
                        }}
                        disabled={selectedPoint.progress <= 0}
                      />
                      <Text variant="bodyLarge" style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                        {Math.round(selectedPoint.progress * 100)}%
                      </Text>
                      <IconButton
                        icon="plus"
                        mode="contained"
                        onPress={() => {
                          const newProgress = Math.min(1, selectedPoint.progress + 0.1);
                          setPlotPoints(prev => prev.map(p => 
                            p.id === selectedPoint.id ? { ...p, progress: newProgress } : p
                          ));
                        }}
                        disabled={selectedPoint.progress >= 1}
                      />
                    </View>
                  </View>
                </View>

                <View style={[styles.detailSection, { borderBottomColor: theme.colors.outline }]}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Açıklama</Text>
                  <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{selectedPoint.description}</Text>
                  </Surface>
                </View>

                <View style={[styles.detailSection, { borderBottomColor: theme.colors.outline }]}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Etki</Text>
                  <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{selectedPoint.impact}</Text>
                  </Surface>
                </View>

                <View style={[styles.detailSection, { borderBottomColor: theme.colors.outline }]}>
                  <View style={styles.sectionHeader}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Karakterler</Text>
                    <IconButton
                      icon="plus"
                      mode="contained"
                      onPress={() => {/* Karakter ekleme işlevi */}}
                    />
                  </View>
                  <View style={styles.characterList}>
                    {selectedPoint.characters.map((char, index) => (
                      <Chip
                        key={index}
                        style={[styles.characterChip, { backgroundColor: theme.colors.surfaceVariant }]}
                        textStyle={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {char}
                      </Chip>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </Surface>
          </Animated.View>
        ) : (
          <View style={[styles.emptyDetail, { backgroundColor: theme.colors.surface }]}>
            <IconButton
              icon="book-open-page-variant"
              size={48}
              style={[styles.emptyIcon, { color: theme.colors.onSurfaceVariant }]}
            />
            <Text variant="titleLarge" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              Detayları görüntülemek için bir olay seçin
            </Text>
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

        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Yeni Olay</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Olay Başlığı"
              value={selectedPoint?.title || ''}
              onChangeText={title => setSelectedPoint(prev => prev ? { ...prev, title } : null)}
              style={[styles.input, { color: theme.colors.onSurface }]}
            />
            <SegmentedButtons
              value={selectedPoint?.type || 'event'}
              onValueChange={value => setSelectedPoint(prev => prev ? { ...prev, type: value as PlotPoint['type'] } : null)}
              buttons={[
                { value: 'event', label: 'Olay' },
                { value: 'revelation', label: 'Keşif' },
                { value: 'decision', label: 'Karar' },
                { value: 'conflict', label: 'Çatışma' },
                { value: 'resolution', label: 'Çözüm' },
              ]}
              style={[styles.segmentedButtons, { backgroundColor: theme.colors.surfaceVariant }]}
            />
            <FAB
              icon={isGenerating ? "loading" : "magic-staff"}
              label="AI ile Detaylandır"
              onPress={() => generatePlotPoint(selectedPoint?.title || '')}
              style={[styles.generateButton, { backgroundColor: theme.colors.primary }]}
              loading={isGenerating}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <IconButton icon="close" onPress={() => setShowAddDialog(false)} />
            <IconButton icon="check" onPress={addPlotPoint} />
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showSuggestionsDialog}
          onDismiss={() => setShowSuggestionsDialog(false)}
        >
          <Dialog.Title>Olay Örgüsü Önerileri</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Hedef Duygu"
              value={targetEmotion}
              onChangeText={setTargetEmotion}
              placeholder="Örn: gerilim, heyecan, dram..."
            />
            
            {isGeneratingSuggestions ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
              <ScrollView style={styles.suggestionsContainer}>
                {plotSuggestions.map((suggestion, index) => (
                  <Card key={index} style={styles.suggestionCard}>
                    <Card.Title
                      title={suggestion.title}
                      subtitle={`Duygusal Etki: ${suggestion.emotionalImpact}`}
                    />
                    <Card.Content>
                      <Paragraph>{suggestion.description}</Paragraph>
                      <View style={styles.characterChips}>
                        {suggestion.involvedCharacters.map((charId, idx) => {
                          const character = characters.find(c => c.id === charId);
                          return character ? (
                            <Chip key={idx} style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]} textStyle={{ color: theme.colors.onSurfaceVariant }}>
                              {character.name}
                            </Chip>
                          ) : null;
                        })}
                      </View>
                      <ProgressBar
                        progress={suggestion.tension / 100}
                        style={[styles.tensionBar, { backgroundColor: theme.colors.surfaceVariant }]}
                      />
                      <Text style={[styles.tensionText, { color: theme.colors.onSurfaceVariant }]}>
                        Gerilim Seviyesi: {suggestion.tension}%
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => addSuggestionToPlot(suggestion)}>
                        Ekle
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSuggestionsDialog(false)}>Kapat</Button>
            <Button onPress={handlePlotSuggestions} mode="contained">
              Öneriler Al
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="lightbulb-on"
        label="Öneriler Al"
        onPress={() => setShowSuggestionsDialog(true)}
      />
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
  addButton: {
    marginRight: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  plotList: {
    width: 360,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    marginBottom: 12,
  },
  phaseScroll: {
    marginBottom: 8,
  },
  phaseChip: {
    marginRight: 8,
  },
  plotScroll: {
    flex: 1,
  },
  plotCard: {
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedCard: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  plotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  plotInfo: {
    flex: 1,
    gap: 4,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  progressText: {
    opacity: 0.7,
    width: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  plotDetail: {
    flex: 1,
  },
  detailContent: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
    borderBottomWidth: 1,
  },
  detailHeaderInfo: {
    flex: 1,
    gap: 8,
  },
  detailScroll: {
    flex: 1,
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    opacity: 0.7,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 12,
  },
  progressSection: {
    gap: 16,
  },
  progressButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  characterList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  characterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  emptyDetail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  input: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  generateButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  suggestionsContainer: {
    maxHeight: 400,
    marginTop: 16,
  },
  suggestionCard: {
    marginBottom: 12,
  },
  characterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    marginRight: 4,
  },
  tensionBar: {
    marginTop: 16,
    height: 8,
    borderRadius: 4,
  },
  tensionText: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'right',
  },
}); 