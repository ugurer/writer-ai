import React, { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Appbar, Surface, Text, TextInput as PaperTextInput, IconButton, Portal, Dialog, FAB, useTheme, Chip, Menu, Card, Title, Paragraph, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Animated, { FadeIn, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import * as AI from '../services/ai';
import { Character, PlotPoint, WorldElement, StyleAnalysis } from '../types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type WritingTone = 'dramatic' | 'humorous' | 'dark' | 'light' | 'neutral';
type AICommand = 'continue' | 'rewrite' | 'expand' | 'shorten' | 'describe' | 'brainstorm' | 'style-analysis' | 'smart-suggestion';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.3;

type IconMapProps = {
  tintColor?: string;
  iconSize?: number;
};

export default function WriterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [currentTone, setCurrentTone] = useState<WritingTone>('neutral');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<AICommand | null>(null);
  const [showCommandInfo, setShowCommandInfo] = useState(false);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>([]);
  const [worldElements, setWorldElements] = useState<WorldElement[]>([]);
  const [currentChapter, setCurrentChapter] = useState('');
  const quillRef = useRef<ReactQuill>(null);

  const handleAICommand = async (command: AICommand) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setSelectedCommand(command);

    try {
      if (command === 'style-analysis') {
        await handleStyleAnalysis();
      } else if (command === 'smart-suggestion') {
        await handleContextAwareGeneration('Hikayeyi nasıl geliştirebilirim?');
      } else {
        const result = await AI.improveWriting(content, 
          command === 'continue' ? 'devam ettirme' :
          command === 'rewrite' ? 'yeniden yazma' :
          command === 'expand' ? 'genişletme' :
          command === 'shorten' ? 'kısaltma' :
          command === 'describe' ? 'betimleme' : 'beyin fırtınası'
        );

        setAiSuggestion(result.improved);
        
        if (result.changes.length > 0) {
          console.log('Yapılan değişiklikler:', result.changes);
        }
        if (result.suggestions.length > 0) {
          console.log('İyileştirme önerileri:', result.suggestions);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStyleAnalysis = async () => {
    if (!content) return;
    
    setIsAnalyzing(true);
    try {
      const result = await AI.analyzeAndSuggestStyle(content, {
        tone: currentTone,
        pacing: 'dynamic',
        detail: 'balanced'
      });
      
      setStyleAnalysis(result);
      setAiSuggestions(result.suggestions.map(s => 
        `${s.type}:\n${s.original} ➔ ${s.improved}\n${s.explanation}`
      ));
    } catch (error) {
      console.error('Stil analizi hatası:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContextAwareGeneration = async (prompt: string) => {
    try {
      const context = {
        characters,
        plotPoints,
        worldElements,
        currentChapter,
        tone: currentTone
      };
      
      const response = await AI.generateWithContext(prompt, context);
      setContent(prev => prev + '\n\n' + response.text);
    } catch (error) {
      console.error('İçerik üretimi hatası:', error);
    }
  };

  const applySuggestion = () => {
    if (!aiSuggestion) return;
    setContent(prev => `${prev}\n\n${aiSuggestion}`);
    setAiSuggestion('');
    setSelectedCommand(null);
  };

  const commands = [
    {
      id: 'continue',
      icon: 'play',
      label: 'Devam Et',
      description: 'Hikayeyi mevcut bağlamda devam ettirir'
    },
    {
      id: 'rewrite',
      icon: 'refresh',
      label: 'Yeniden Yaz',
      description: 'Seçili metni farklı bir şekilde yazar'
    },
    {
      id: 'expand',
      icon: 'magnify-plus',
      label: 'Genişlet',
      description: 'Metni daha detaylı hale getirir'
    },
    {
      id: 'shorten',
      icon: 'magnify-minus',
      label: 'Kısalt',
      description: 'Metni özünü koruyarak kısaltır'
    },
    {
      id: 'describe',
      icon: 'pencil',
      label: 'Betimle',
      description: 'Daha zengin betimlemeler ekler'
    },
    {
      id: 'brainstorm',
      icon: 'lightbulb',
      label: 'Fikir Üret',
      description: 'Alternatif fikirler önerir'
    },
    {
      id: 'style-analysis',
      icon: 'format-color-text',
      label: 'Stil Analizi',
      description: 'Mevcut metni analiz et ve stil önerileri al'
    },
    {
      id: 'smart-suggestion',
      icon: 'lightbulb-on',
      label: 'Akıllı Öneri',
      description: 'Bağlama dayalı hikaye önerileri al'
    }
  ];

  const editorInitializedHandler = () => {
    console.log('Editor initialized');
  };

  const handleCursorPosition = (scrollY: number) => {
    // Editör imlecinin pozisyonuna göre scroll yapma
  };

  const customActions = [
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'align',
    'link',
    'clean',
    'undo',
    'redo',
  ];

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link'
  ];

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
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      gap: 8,
    },
    title: {
      fontWeight: 'bold',
    },
    stats: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 4,
    },
    statText: {
      opacity: 0.6,
    },
    navButton: {
      margin: 0,
    },
    mainContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    editorContainer: {
      flex: 1,
      padding: 16,
      width: width - SIDEBAR_WIDTH,
    },
    editorFullWidth: {
      width: width,
    },
    editorSurface: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
      ...(Platform.OS === 'web' && {
        display: 'flex',
        flexDirection: 'column',
      }),
    },
    editor: {
      flex: 1,
      backgroundColor: 'transparent',
      fontSize: 16,
      lineHeight: 24,
    },
    editorContent: {
      padding: 24,
      paddingTop: 24,
      minHeight: '100%',
    },
    sidebar: {
      width: SIDEBAR_WIDTH,
      padding: 16,
    },
    sidebarHidden: {
      display: 'none',
    },
    sidebarContent: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
    },
    sidebarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    toneSection: {
      padding: 16,
      borderBottomWidth: 1,
    },
    sectionTitle: {
      marginBottom: 12,
      opacity: 0.7,
    },
    toneChip: {
      marginRight: 8,
    },
    commandsSection: {
      padding: 16,
      borderBottomWidth: 1,
    },
    commandsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    commandButton: {
      alignItems: 'center',
      width: 72,
    },
    commandButtonSelected: {
      borderRadius: 8,
    },
    commandLabel: {
      marginTop: 4,
      textAlign: 'center',
    },
    suggestionsSection: {
      flex: 1,
      padding: 16,
    },
    suggestionsContainer: {
      flex: 1,
    },
    loadingCard: {
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      gap: 12,
    },
    suggestionCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    emptyCard: {
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      gap: 12,
    },
    applyButton: {
      position: 'absolute',
      right: 16,
      bottom: 16,
    },
    loadingText: {
      textAlign: 'center',
      opacity: 0.7,
    },
    placeholderText: {
      textAlign: 'center',
      opacity: 0.6,
    },
    analysisCard: {
      margin: 10,
      elevation: 4,
    },
    suggestionsTitle: {
      marginTop: 16,
      marginBottom: 8,
    },
    suggestion: {
      marginBottom: 8,
      padding: 8,
      borderRadius: 4,
    },
    toolbar: {
      height: 48,
      borderBottomWidth: 1,
    },
    toolbarIcon: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

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
          <Text variant="headlineMedium" style={styles.title}>Hikaye Editörü</Text>
          <View style={styles.stats}>
            <Text variant="bodySmall" style={styles.statText}>
              {content.split(/\s+/).filter(Boolean).length} kelime
            </Text>
            <Text variant="bodySmall" style={styles.statText}>
              {content.length} karakter
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="account-multiple"
            mode="contained"
            containerColor={theme.colors.primary}
            iconColor={theme.colors.onPrimary}
            onPress={() => navigation.navigate('Characters')}
            style={styles.navButton}
          />
          <IconButton
            icon="book-open-variant"
            mode="contained"
            containerColor={theme.colors.primary}
            iconColor={theme.colors.onPrimary}
            onPress={() => navigation.navigate('Plot')}
            style={styles.navButton}
          />
          <IconButton
            icon="earth"
            mode="contained"
            containerColor={theme.colors.primary}
            iconColor={theme.colors.onPrimary}
            onPress={() => navigation.navigate('World')}
            style={styles.navButton}
          />
          <IconButton
            icon="chart-bar"
            mode="contained"
            containerColor={theme.colors.primary}
            iconColor={theme.colors.onPrimary}
            onPress={() => navigation.navigate('Analysis')}
            style={styles.navButton}
          />
          <IconButton
            icon="cog"
            mode="contained"
            containerColor={theme.colors.primary}
            iconColor={theme.colors.onPrimary}
            onPress={() => navigation.navigate('Settings')}
            style={styles.navButton}
          />
        </View>
      </Animated.View>

      <View style={styles.mainContainer}>
        <View style={[styles.editorContainer, !showSidebar && styles.editorFullWidth]}>
          <Surface style={[styles.editorSurface, { backgroundColor: theme.colors.surface }]} elevation={2}>
            {Platform.OS === 'web' ? (
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Hikayenizi yazmaya başlayın..."
                style={{
                  height: 'calc(100% - 42px)', // toolbar height
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.onSurface,
                }}
              />
            ) : (
              <PaperTextInput
                mode="flat"
                multiline
                value={content}
                onChangeText={setContent}
                placeholder="Hikayenizi yazmaya başlayın..."
                style={styles.editor}
                contentStyle={styles.editorContent}
                textColor={theme.colors.onSurface}
                underlineColor="transparent"
                placeholderTextColor={theme.colors.onSurfaceDisabled}
                textAlignVertical="top"
                autoCapitalize="sentences"
                scrollEnabled={true}
              />
            )}
          </Surface>
        </View>

        <Animated.View 
          entering={SlideInRight}
          exiting={SlideOutRight}
          style={[styles.sidebar, !showSidebar && styles.sidebarHidden]}
        >
          <Surface style={[styles.sidebarContent, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <View style={[styles.sidebarHeader, { borderBottomColor: theme.colors.outline }]}>
              <Text variant="titleMedium">AI Asistanı</Text>
              <IconButton
                icon={showSidebar ? "chevron-right" : "chevron-left"}
                onPress={() => setShowSidebar(!showSidebar)}
              />
            </View>

            <View style={[styles.toneSection, { borderBottomColor: theme.colors.outline }]}>
              <Text variant="bodyMedium" style={styles.sectionTitle}>Ton</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(['dramatic', 'humorous', 'dark', 'light', 'neutral'] as WritingTone[]).map(tone => (
                  <Chip
                    key={tone}
                    selected={currentTone === tone}
                    onPress={() => setCurrentTone(tone)}
                    style={styles.toneChip}
                    elevation={1}
                  >
                    {tone === 'dramatic' ? 'Dramatik' :
                     tone === 'humorous' ? 'Mizahi' :
                     tone === 'dark' ? 'Karanlık' :
                     tone === 'light' ? 'Hafif' : 'Nötr'}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.commandsSection, { borderBottomColor: theme.colors.outline }]}>
              <Text variant="bodyMedium" style={styles.sectionTitle}>Komutlar</Text>
              <View style={styles.commandsGrid}>
                {commands.map(command => (
                  <TouchableOpacity
                    key={command.id}
                    onPress={() => handleAICommand(command.id as AICommand)}
                    onLongPress={() => {
                      setSelectedCommand(command.id as AICommand);
                      setShowCommandInfo(true);
                    }}
                    style={[
                      styles.commandButton,
                      selectedCommand === command.id && styles.commandButtonSelected
                    ]}
                  >
                    <IconButton
                      icon={command.icon}
                      mode="contained"
                      size={24}
                      disabled={isGenerating}
                    />
                    <Text variant="labelSmall" style={styles.commandLabel}>
                      {command.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.suggestionsSection}>
              <Text variant="bodyMedium" style={styles.sectionTitle}>AI Önerisi</Text>
              <ScrollView style={styles.suggestionsContainer}>
                {isGenerating ? (
                  <Surface style={styles.loadingCard} elevation={1}>
                    <IconButton icon="loading" size={32} />
                    <Text style={styles.loadingText}>AI yanıtı bekleniyor...</Text>
                  </Surface>
                ) : aiSuggestion ? (
                  <Surface style={styles.suggestionCard} elevation={1}>
                    <Text variant="bodyMedium">{aiSuggestion}</Text>
                    <FAB
                      icon="plus"
                      size="small"
                      onPress={applySuggestion}
                      style={styles.applyButton}
                    />
                  </Surface>
                ) : (
                  <Surface style={styles.emptyCard} elevation={1}>
                    <IconButton icon="robot" size={32} />
                    <Text style={styles.placeholderText}>
                      AI önerilerini görmek için yukarıdaki komutlardan birini kullanın
                    </Text>
                  </Surface>
                )}
              </ScrollView>
            </View>
          </Surface>
        </Animated.View>
      </View>

      {styleAnalysis && (
        <Card style={styles.analysisCard}>
          <Card.Title title="Stil Analizi" />
          <Card.Content>
            <Text>Ton: {styleAnalysis.currentStyle.tone}</Text>
            <Text>Tempo: {styleAnalysis.currentStyle.pacing}</Text>
            <Text>Detay Seviyesi: {styleAnalysis.currentStyle.detail}</Text>
            
            <Title style={styles.suggestionsTitle}>Öneriler</Title>
            {aiSuggestions.map((suggestion, index) => (
              <Paragraph key={index} style={styles.suggestion}>
                {suggestion}
              </Paragraph>
            ))}
          </Card.Content>
        </Card>
      )}

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

        <Dialog visible={showCommandInfo} onDismiss={() => setShowCommandInfo(false)}>
          <Dialog.Title>
            {selectedCommand && commands.find(c => c.id === selectedCommand)?.label}
          </Dialog.Title>
          <Dialog.Content>
            <Text>
              {selectedCommand && commands.find(c => c.id === selectedCommand)?.description}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Text onPress={() => setShowCommandInfo(false)}>Tamam</Text>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
} 