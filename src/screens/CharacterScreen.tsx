import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Appbar, Surface, Text, TextInput, IconButton, Portal, Dialog, FAB, useTheme, Chip, Menu, SegmentedButtons, Avatar, Card, Title, Paragraph, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import * as AI from '../services/ai';
import { Character } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type CharacterRole = 'protagonist' | 'antagonist' | 'supporting';
type RelationType = 'friend' | 'enemy' | 'family' | 'romantic' | 'mentor' | 'rival';

type Character = {
  id: string;
  name: string;
  role: CharacterRole;
  avatar?: string;
  description: string;
  personality: string[];
  goals: string[];
  conflicts: string[];
  relationships: CharacterRelationship[];
  background: string;
  appearance: string;
  voice: string;
};

type CharacterRelationship = {
  targetId: string;
  type: RelationType;
  description: string;
  strength: number;
};

const { width } = Dimensions.get('window');
const DETAIL_WIDTH = width * 0.4;

export default function CharacterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRelationDialog, setShowRelationDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'main' | 'side'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [relationTarget, setRelationTarget] = useState<Character | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [interactionResult, setInteractionResult] = useState<{
    dialogue: string;
    reactions: { [key: string]: string };
    consequences: string[];
  } | null>(null);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [interactionSituation, setInteractionSituation] = useState('');

  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         character.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'main') return (character.role === 'protagonist' || character.role === 'antagonist') && matchesSearch;
    if (activeTab === 'side') return character.role === 'supporting' && matchesSearch;
    return matchesSearch;
  });

  const generateCharacterDetails = async (name: string, role: CharacterRole) => {
    if (!name) {
      setError('Lütfen karakter adını girin');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const details = await AI.generateCharacterDetails(name, 
        role === 'protagonist' ? 'ana karakter' :
        role === 'antagonist' ? 'kötü karakter' : 'yardımcı karakter'
      );

      const newCharacter: Character = {
        id: Date.now().toString(),
        name,
        role,
        description: details.appearance,
        personality: details.personality,
        goals: details.goals,
        conflicts: details.conflicts,
        relationships: [],
        background: details.background,
        appearance: details.appearance,
        voice: details.voice,
      };

      setCharacters(prev => [...prev, newCharacter]);
      setShowAddDialog(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const addRelationship = (source: Character, target: Character, type: RelationType) => {
    const relationship: CharacterRelationship = {
      targetId: target.id,
      type,
      description: '',
      strength: 0.5,
    };

    setCharacters(prev => prev.map(char => 
      char.id === source.id
        ? { ...char, relationships: [...char.relationships, relationship] }
        : char
    ));
  };

  const getRoleColor = (role: CharacterRole) => {
    switch (role) {
      case 'protagonist': return theme.colors.primary;
      case 'antagonist': return theme.colors.error;
      case 'supporting': return theme.colors.secondary;
    }
  };

  const getRelationColor = (type: RelationType) => {
    switch (type) {
      case 'friend': return theme.colors.primary;
      case 'enemy': return theme.colors.error;
      case 'family': return theme.colors.secondary;
      case 'romantic': return '#FF69B4'; // pink
      case 'mentor': return '#4B0082'; // indigo
      case 'rival': return '#FF4500'; // orange red
    }
  };

  const getRelationIcon = (type: RelationType) => {
    switch (type) {
      case 'friend': return 'handshake';
      case 'enemy': return 'sword-cross';
      case 'family': return 'home-heart';
      case 'romantic': return 'heart';
      case 'mentor': return 'school';
      case 'rival': return 'lightning-bolt';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCharacterInteraction = async () => {
    if (selectedCharacters.length !== 2) return;
    
    try {
      const result = await AI.generateCharacterInteraction(
        selectedCharacters[0],
        selectedCharacters[1],
        interactionSituation
      );
      
      setInteractionResult(result);
    } catch (error) {
      console.error('Karakter etkileşimi hatası:', error);
    }
  };

  const toggleCharacterSelection = (character: Character) => {
    if (selectedCharacters.find(c => c.id === character.id)) {
      setSelectedCharacters(prev => prev.filter(c => c.id !== character.id));
    } else if (selectedCharacters.length < 2) {
      setSelectedCharacters(prev => [...prev, character]);
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
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>Karakterler</Text>
        </View>
        <FAB
          icon="plus"
          label="Yeni Karakter"
          onPress={() => setShowAddDialog(true)}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        />
      </Animated.View>

      <View style={styles.content}>
        <Surface style={[styles.characterList, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <View style={[styles.searchContainer, { borderBottomColor: theme.colors.outline }]}>
            <TextInput
              mode="outlined"
              placeholder="Ara..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              right={<TextInput.Icon icon="magnify" />}
              style={[styles.searchInput, { color: theme.colors.onSurface }]}
            />
            <SegmentedButtons
              value={activeTab}
              onValueChange={value => setActiveTab(value as typeof activeTab)}
              buttons={[
                { value: 'all', label: 'Tümü' },
                { value: 'main', label: 'Ana Karakterler' },
                { value: 'side', label: 'Yardımcı Karakterler' },
              ]}
              style={[styles.segmentedButtons, { backgroundColor: theme.colors.surfaceVariant }]}
            />
          </View>

          <ScrollView style={styles.characterScroll}>
            {filteredCharacters.map((character, index) => (
              <Animated.View
                key={character.id}
                entering={FadeIn.delay(index * 100)}
              >
                <TouchableOpacity
                  onPress={() => toggleCharacterSelection(character)}
                  style={[
                    styles.characterCard,
                    selectedCharacters.find(c => c.id === character.id) && [
                      styles.selectedCard,
                      { borderColor: theme.colors.primary }
                    ]
                  ]}
                >
                  <Card>
                    <Card.Title
                      title={character.name}
                      subtitle={character.role}
                      left={props => (
                        <Avatar.Text
                          {...props}
                          label={getInitials(character.name)}
                          size={40}
                        />
                      )}
                    />
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Surface>

        {selectedCharacter ? (
          <Animated.View
            entering={SlideInRight}
            style={styles.characterDetail}
          >
            <Surface style={[styles.detailContent, { backgroundColor: theme.colors.surface }]} elevation={2}>
              <View style={[styles.detailHeader, { borderBottomColor: theme.colors.outline }]}>
                <Avatar.Text
                  label={getInitials(selectedCharacter.name)}
                  size={64}
                  style={[
                    styles.avatar,
                    { backgroundColor: getRoleColor(selectedCharacter.role) }
                  ]}
                />
                <View style={styles.detailHeaderInfo}>
                  <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>{selectedCharacter.name}</Text>
                  <Chip 
                    compact 
                    style={[styles.roleChip, { backgroundColor: getRoleColor(selectedCharacter.role) }]}
                  >
                    {selectedCharacter.role === 'protagonist' ? 'Protagonist' :
                     selectedCharacter.role === 'antagonist' ? 'Antagonist' : 'Yardımcı'}
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
                  <Text variant="titleMedium" style={styles.sectionTitle}>Görünüm</Text>
                  <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>{selectedCharacter.appearance}</Text>
                  </Surface>
                </View>

                <View style={[styles.detailSection, { borderBottomColor: theme.colors.outline }]}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Kişilik</Text>
                  <View style={[styles.tagContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    {selectedCharacter.personality.map((trait, index) => (
                      <Chip
                        key={index}
                        style={[styles.tag, { backgroundColor: theme.colors.onSurfaceVariant }]}
                        elevation={1}
                      >
                        {trait}
                      </Chip>
                    ))}
                  </View>
                </View>

                <View style={[styles.detailSection, { borderBottomColor: theme.colors.outline }]}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Geçmiş</Text>
                  <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>{selectedCharacter.background}</Text>
                  </Surface>
                </View>

                <View style={[styles.detailSection, { borderBottomColor: theme.colors.outline }]}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Hedefler</Text>
                  <View style={[styles.tagContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    {selectedCharacter.goals.map((goal, index) => (
                      <Chip
                        key={index}
                        style={[styles.tag, { backgroundColor: theme.colors.onSurfaceVariant }]}
                        elevation={1}
                      >
                        {goal}
                      </Chip>
                    ))}
                  </View>
                </View>

                <View style={[styles.detailSection, { borderBottomColor: theme.colors.outline }]}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Çatışmalar</Text>
                  <View style={[styles.tagContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    {selectedCharacter.conflicts.map((conflict, index) => (
                      <Chip
                        key={index}
                        style={[styles.tag, { backgroundColor: theme.colors.onSurfaceVariant }]}
                        elevation={1}
                      >
                        {conflict}
                      </Chip>
                    ))}
                  </View>
                </View>

                <View style={[styles.detailSection, { borderBottomColor: theme.colors.outline }]}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Ses</Text>
                  <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>{selectedCharacter.voice}</Text>
                  </Surface>
                </View>

                <View style={[styles.detailSection, { borderBottomColor: theme.colors.outline }]}>
                  <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>İlişkiler</Text>
                    <IconButton
                      icon="plus"
                      mode="contained"
                      onPress={() => setShowRelationDialog(true)}
                    />
                  </View>
                  <View style={[styles.relationshipsContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    {selectedCharacter.relationships.map((rel, index) => {
                      const targetChar = characters.find(c => c.id === rel.targetId);
                      return targetChar ? (
                        <Surface key={index} style={[styles.relationCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                          <Avatar.Text
                            label={getInitials(targetChar.name)}
                            size={32}
                            style={[
                              styles.avatar,
                              { backgroundColor: getRoleColor(targetChar.role) }
                            ]}
                          />
                          <View style={[styles.relationInfo, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <Text variant="titleSmall" style={[styles.title, { color: theme.colors.onSurface }]}>{targetChar.name}</Text>
                            <Chip 
                              compact 
                              style={[styles.relationChip, { backgroundColor: getRelationColor(rel.type) }]}
                              icon={getRelationIcon(rel.type)}
                            >
                              {rel.type === 'friend' ? 'Arkadaş' :
                               rel.type === 'enemy' ? 'Düşman' :
                               rel.type === 'family' ? 'Aile' :
                               rel.type === 'romantic' ? 'Romantik' :
                               rel.type === 'mentor' ? 'Mentor' : 'Rakip'}
                            </Chip>
                            <Text variant="bodySmall" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>{rel.description}</Text>
                          </View>
                          <View style={[styles.relationStrength, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <Text variant="bodySmall" style={[styles.strengthText, { color: theme.colors.onSurfaceVariant }]}>
                              {Math.round(rel.strength * 100)}%
                            </Text>
                            <View style={[styles.strengthBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                              <Animated.View 
                                style={[
                                  styles.strengthFill,
                                  { 
                                    width: `${rel.strength * 100}%`,
                                    backgroundColor: getRelationColor(rel.type)
                                  }
                                ]}
                              />
                            </View>
                          </View>
                        </Surface>
                      ) : null;
                    })}
                  </View>
                </View>
              </ScrollView>
            </Surface>
          </Animated.View>
        ) : (
          <View style={[styles.emptyDetail, { backgroundColor: theme.colors.surface }]}>
            <IconButton
              icon="account-group"
              size={48}
              style={[styles.emptyIcon, { opacity: 0.5 }]}
            />
            <Text variant="titleLarge" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              Detayları görüntülemek için bir karakter seçin
            </Text>
          </View>
        )}

        {selectedCharacters.length === 2 && (
          <FAB
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            icon="account-switch"
            label="Etkileşim Oluştur"
            onPress={() => setShowInteractionDialog(true)}
          />
        )}
      </View>

      <Portal>
        <Dialog visible={!!error} onDismiss={() => setError(null)}>
          <Dialog.Title>Hata</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>{error}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Text onPress={() => setError(null)} style={[styles.description, { color: theme.colors.primary }]}>Tamam</Text>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Yeni Karakter</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Karakter Adı"
              value={selectedCharacter?.name || ''}
              onChangeText={name => setSelectedCharacter(prev => prev ? { ...prev, name } : {
                id: Date.now().toString(),
                name,
                role: 'supporting',
                description: '',
                personality: [],
                goals: [],
                conflicts: [],
                relationships: [],
                background: '',
                appearance: '',
                voice: '',
              } as Character)}
              style={[styles.input, { color: theme.colors.onSurface }]}
            />
            <SegmentedButtons
              value={selectedCharacter?.role || 'supporting'}
              onValueChange={value => setSelectedCharacter(prev => prev ? { ...prev, role: value as CharacterRole } : null)}
              buttons={[
                { value: 'protagonist', label: 'Protagonist' },
                { value: 'antagonist', label: 'Antagonist' },
                { value: 'supporting', label: 'Yardımcı' },
              ]}
              style={[styles.segmentedButtons, { backgroundColor: theme.colors.surfaceVariant }]}
            />
            <FAB
              icon={isGenerating ? "loading" : "magic-staff"}
              label="AI ile Detaylandır"
              onPress={() => selectedCharacter && generateCharacterDetails(selectedCharacter.name, selectedCharacter.role)}
              style={[styles.generateButton, { backgroundColor: theme.colors.primary }]}
              loading={isGenerating}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <IconButton icon="close" onPress={() => setShowAddDialog(false)} />
            <IconButton icon="check" onPress={() => selectedCharacter && generateCharacterDetails(selectedCharacter.name, selectedCharacter.role)} />
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showRelationDialog} onDismiss={() => setShowRelationDialog(false)}>
          <Dialog.Title>İlişki Ekle</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={[styles.dialogLabel, { color: theme.colors.onSurfaceVariant }]}>Karakter</Text>
            <ScrollView style={[styles.characterPicker, { backgroundColor: theme.colors.surfaceVariant }]}>
              {characters
                .filter(char => char.id !== selectedCharacter?.id)
                .map(char => (
                  <Surface 
                    key={char.id}
                    style={[
                      styles.pickerCard,
                      relationTarget?.id === char.id && styles.pickerCardSelected,
                      { backgroundColor: theme.colors.surfaceVariant }
                    ]}
                    elevation={1}
                  >
                    <Avatar.Text
                      label={getInitials(char.name)}
                      size={32}
                      style={[
                        styles.avatar,
                        { backgroundColor: getRoleColor(char.role) }
                      ]}
                    />
                    <Text style={[styles.title, { color: theme.colors.onSurface }]}>{char.name}</Text>
                    <IconButton
                      icon={relationTarget?.id === char.id ? 'check' : 'plus'}
                      size={20}
                      onPress={() => setRelationTarget(char)}
                    />
                  </Surface>
                ))}
            </ScrollView>

            <Text variant="bodyMedium" style={[styles.dialogLabel, { color: theme.colors.onSurfaceVariant }]}>İlişki Türü</Text>
            <View style={[styles.relationTypes, { backgroundColor: theme.colors.surfaceVariant }]}>
              {(['friend', 'enemy', 'family', 'romantic', 'mentor', 'rival'] as RelationType[]).map(type => (
                <Chip
                  key={type}
                  style={[styles.relationTypeChip, { backgroundColor: getRelationColor(type) }]}
                  icon={getRelationIcon(type)}
                  onPress={() => {
                    if (selectedCharacter && relationTarget) {
                      addRelationship(selectedCharacter, relationTarget, type);
                      setShowRelationDialog(false);
                      setRelationTarget(null);
                    }
                  }}
                >
                  {type === 'friend' ? 'Arkadaş' :
                   type === 'enemy' ? 'Düşman' :
                   type === 'family' ? 'Aile' :
                   type === 'romantic' ? 'Romantik' :
                   type === 'mentor' ? 'Mentor' : 'Rakip'}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
        </Dialog>

        <Dialog
          visible={showInteractionDialog}
          onDismiss={() => setShowInteractionDialog(false)}
        >
          <Dialog.Title>Karakter Etkileşimi</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Etkileşim Durumu"
              value={interactionSituation}
              onChangeText={setInteractionSituation}
              placeholder="Örn: İlk karşılaşma, çatışma, uzlaşma..."
              style={[styles.input, { color: theme.colors.onSurface }]}
            />
            
            {interactionResult && (
              <View style={[styles.interactionResult, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Title style={[styles.title, { color: theme.colors.onSurface }]}>Diyalog</Title>
                <Paragraph style={[styles.dialogue, { color: theme.colors.onSurfaceVariant }]}>
                  {interactionResult.dialogue}
                </Paragraph>
                
                <Title style={[styles.title, { color: theme.colors.onSurface }]}>Tepkiler</Title>
                {Object.entries(interactionResult.reactions).map(([charId, reaction]) => (
                  <Paragraph key={charId} style={[styles.dialogue, { color: theme.colors.onSurfaceVariant }]}>
                    {characters.find(c => c.id === charId)?.name}: {reaction}
                  </Paragraph>
                ))}
                
                <Title style={[styles.title, { color: theme.colors.onSurface }]}>Sonuçlar</Title>
                {interactionResult.consequences.map((consequence, index) => (
                  <Paragraph key={index} style={[styles.consequence, { color: theme.colors.onSurfaceVariant }]}>
                    • {consequence}
                  </Paragraph>
                ))}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInteractionDialog(false)} style={[styles.description, { backgroundColor: theme.colors.primary }]}>Kapat</Button>
            <Button onPress={handleCharacterInteraction} mode="contained" style={[styles.generateButton, { backgroundColor: theme.colors.primary }]}>
              Etkileşim Oluştur
            </Button>
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
  addButton: {
    marginRight: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  characterList: {
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
  segmentedButtons: {
    marginBottom: 8,
  },
  characterScroll: {
    flex: 1,
  },
  characterCard: {
    marginBottom: 8,
    marginHorizontal: 16,
  },
  selectedCard: {
    borderWidth: 2,
    borderRadius: 8,
  },
  avatar: {
    margin: 0,
  },
  characterInfo: {
    flex: 1,
    gap: 4,
  },
  roleChip: {
    alignSelf: 'flex-start',
  },
  description: {
    opacity: 0.7,
  },
  characterDetail: {
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
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  relationshipsContainer: {
    gap: 8,
  },
  relationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  relationInfo: {
    flex: 1,
    gap: 4,
  },
  relationChip: {
    alignSelf: 'flex-start',
  },
  relationStrength: {
    width: 80,
    gap: 4,
  },
  strengthText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
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
  dialogLabel: {
    marginBottom: 8,
    opacity: 0.7,
  },
  characterPicker: {
    maxHeight: 200,
    marginBottom: 16,
  },
  pickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    gap: 8,
  },
  pickerCardSelected: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  relationTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationTypeChip: {
    marginBottom: 8,
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
  interactionResult: {
    marginTop: 16,
  },
  dialogue: {
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  consequence: {
    marginLeft: 8,
  },
}); 