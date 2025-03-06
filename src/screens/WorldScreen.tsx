import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import {
  Appbar,
  Surface,
  Text,
  TextInput,
  IconButton,
  Portal,
  Dialog,
  FAB,
  useTheme,
  Chip,
  Menu,
  SegmentedButtons,
  ActivityIndicator,
  Card,
  Button,
  Paragraph,
  Title
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import * as AI from '../services/ai';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type WorldElement = {
  id: string;
  name: string;
  description: string;
  type: 'location' | 'culture' | 'magic' | 'technology' | 'history' | 'religion' | 'politics';
  details: {
    [key: string]: string | string[];
  };
  connections: string[];
};

type WorldExpansion = {
  aspect: string;
  details: string | string[];
  relatedElements?: string[];
  potentialConflicts?: string[];
};

export default function WorldScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const [elements, setElements] = useState<WorldElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<WorldElement | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newElement, setNewElement] = useState<Partial<WorldElement>>({
    name: '',
    description: '',
    type: 'location',
    details: {},
    connections: [],
  });

  const [activeTab, setActiveTab] = useState<'all' | 'locations' | 'cultures' | 'magic'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [expansions, setExpansions] = useState<WorldExpansion[]>([]);
  const [showExpansionDialog, setShowExpansionDialog] = useState(false);
  const [expansionDepth, setExpansionDepth] = useState<'detail' | 'connection' | 'conflict'>('detail');
  const [isGeneratingExpansion, setIsGeneratingExpansion] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });

  const filteredElements = elements.filter(element => {
    const matchesSearch = element.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         element.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'locations') return element.type === 'location' && matchesSearch;
    if (activeTab === 'cultures') return element.type === 'culture' && matchesSearch;
    if (activeTab === 'magic') return element.type === 'magic' && matchesSearch;
    return matchesSearch;
  });

  const generateWorldElement = async (name: string, type: WorldElement['type'] | undefined) => {
    if (!name || !type) {
      setError('Lütfen isim ve tür girin');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const details = await AI.generateWorldElement(name, 
        type === 'location' ? 'yer' :
        type === 'culture' ? 'kültür' :
        type === 'magic' ? 'büyü sistemi' :
        type === 'technology' ? 'teknoloji' :
        type === 'history' ? 'tarihsel dönem' :
        type === 'religion' ? 'inanç sistemi' : 'politik sistem'
      );

      const element: WorldElement = {
        id: Date.now().toString(),
        name,
        type,
        description: details.description,
        details: details.details,
        connections: [],
      };

      setElements([...elements, element]);
      setShowAddDialog(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const addWorldElement = () => {
    if (!newElement.name || !newElement.type) return;

    const element: WorldElement = {
      id: Date.now().toString(),
      name: newElement.name,
      description: newElement.description || '',
      type: newElement.type,
      details: newElement.details || {},
      connections: newElement.connections || [],
    };

    setElements([...elements, element]);
    setNewElement({
      name: '',
      description: '',
      type: 'location',
      details: {},
      connections: [],
    });
    setShowAddDialog(false);
  };

  const addConnection = (sourceId: string, targetId: string) => {
    setElements(prev => prev.map(el => {
      if (el.id === sourceId) {
        return {
          ...el,
          connections: [...el.connections, targetId],
        };
      }
      return el;
    }));
  };

  const handleWorldExpansion = async () => {
    if (!selectedElement) return;
    
    setIsGeneratingExpansion(true);
    try {
      const result = await AI.expandWorldBuilding(selectedElement, expansionDepth);
      setExpansions(result.expansions);
    } catch (error) {
      console.error('Dünya öğesi geliştirme hatası:', error);
      setError((error as Error).message);
    } finally {
      setIsGeneratingExpansion(false);
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
          <Text variant="headlineMedium" style={styles.title}>Dünya Oluşturma</Text>
        </View>
        <FAB
          icon="plus"
          label="Yeni Öğe"
          onPress={() => setShowAddDialog(true)}
          style={styles.addButton}
        />
      </Animated.View>

      <View style={styles.content}>
        <Surface style={styles.elementList} elevation={2}>
          <View style={styles.searchContainer}>
            <TextInput
              mode="outlined"
              placeholder="Ara..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              right={<TextInput.Icon icon="magnify" />}
              style={styles.searchInput}
            />
            <SegmentedButtons
              value={activeTab}
              onValueChange={value => setActiveTab(value as typeof activeTab)}
              buttons={[
                { value: 'all', label: 'Tümü' },
                { value: 'locations', label: 'Yerler' },
                { value: 'cultures', label: 'Kültürler' },
                { value: 'magic', label: 'Büyü' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <ScrollView style={styles.elementScroll}>
            {filteredElements.map(element => (
              <Animated.View
                key={element.id}
                entering={FadeIn.delay(200)}
              >
                <Surface 
                  style={[
                    styles.elementCard,
                    selectedElement?.id === element.id && styles.selectedCard
                  ]}
                  elevation={2}
                >
                  <IconButton
                    icon={
                      element.type === 'location' ? 'map-marker' :
                      element.type === 'culture' ? 'account-group' :
                      element.type === 'magic' ? 'auto-fix' :
                      element.type === 'technology' ? 'chip' :
                      element.type === 'history' ? 'book-open-page-variant' :
                      element.type === 'religion' ? 'star' : 'bank'
                    }
                    size={24}
                    style={styles.elementIcon}
                  />
                  <View style={styles.elementInfo}>
                    <Text variant="titleMedium">{element.name}</Text>
                    <Chip compact style={styles.typeChip}>
                      {element.type === 'location' ? 'Yer' :
                       element.type === 'culture' ? 'Kültür' :
                       element.type === 'magic' ? 'Büyü' :
                       element.type === 'technology' ? 'Teknoloji' :
                       element.type === 'history' ? 'Tarih' :
                       element.type === 'religion' ? 'Din' : 'Politika'}
                    </Chip>
                    <Text numberOfLines={2} style={styles.description}>
                      {element.description || 'Açıklama eklenmemiş'}
                    </Text>
                  </View>
                  <IconButton
                    icon="chevron-right"
                    onPress={() => setSelectedElement(element)}
                  />
                </Surface>
              </Animated.View>
            ))}
          </ScrollView>
        </Surface>

        {selectedElement ? (
          <Animated.View
            entering={SlideInRight}
            style={styles.elementDetail}
          >
            <Surface style={styles.detailContent} elevation={2}>
              <View style={styles.detailHeader}>
                <IconButton
                  icon={
                    selectedElement.type === 'location' ? 'map-marker' :
                    selectedElement.type === 'culture' ? 'account-group' :
                    selectedElement.type === 'magic' ? 'auto-fix' :
                    selectedElement.type === 'technology' ? 'chip' :
                    selectedElement.type === 'history' ? 'book-open-page-variant' :
                    selectedElement.type === 'religion' ? 'star' : 'bank'
                  }
                  size={32}
                />
                <View style={styles.detailHeaderInfo}>
                  <Text variant="headlineMedium">{selectedElement.name}</Text>
                  <Chip compact style={styles.typeChip}>
                    {selectedElement.type === 'location' ? 'Yer' :
                     selectedElement.type === 'culture' ? 'Kültür' :
                     selectedElement.type === 'magic' ? 'Büyü' :
                     selectedElement.type === 'technology' ? 'Teknoloji' :
                     selectedElement.type === 'history' ? 'Tarih' :
                     selectedElement.type === 'religion' ? 'Din' : 'Politika'}
                  </Chip>
                </View>
                <IconButton
                  icon="pencil"
                  mode="contained"
                  onPress={() => {/* Düzenleme işlevi */}}
                />
              </View>

              <ScrollView style={styles.detailScroll}>
                <View style={styles.detailSection}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Açıklama</Text>
                  <Surface style={styles.sectionCard} elevation={1}>
                    <Text>{selectedElement.description}</Text>
                  </Surface>
                </View>

                {Object.entries(selectedElement.details).map(([key, value]) => (
                  <View key={key} style={styles.detailSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                    {Array.isArray(value) ? (
                      <View style={styles.tagContainer}>
                        {value.map((item, index) => (
                          <Chip key={index} compact style={styles.tag}>
                            {item}
                          </Chip>
                        ))}
                      </View>
                    ) : (
                      <Surface style={styles.sectionCard} elevation={1}>
                        <Text>{value}</Text>
                      </Surface>
                    )}
                  </View>
                ))}

                <View style={styles.detailSection}>
                  <View style={styles.sectionHeader}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Bağlantılar</Text>
                    <IconButton
                      icon="plus"
                      mode="contained"
                      onPress={() => {/* Bağlantı ekleme işlevi */}}
                    />
                  </View>
                  <View style={styles.connectionsContainer}>
                    {selectedElement.connections.map(connectionId => {
                      const connectedElement = elements.find(e => e.id === connectionId);
                      return connectedElement ? (
                        <Chip
                          key={connectionId}
                          onPress={() => setSelectedElement(connectedElement)}
                          style={styles.connectionChip}
                          avatar={
                            <IconButton
                              icon={
                                connectedElement.type === 'location' ? 'map-marker' :
                                connectedElement.type === 'culture' ? 'account-group' :
                                connectedElement.type === 'magic' ? 'auto-fix' :
                                connectedElement.type === 'technology' ? 'chip' :
                                connectedElement.type === 'history' ? 'book-open-page-variant' :
                                connectedElement.type === 'religion' ? 'star' : 'bank'
                              }
                              size={16}
                            />
                          }
                        >
                          {connectedElement.name}
                        </Chip>
                      ) : null;
                    })}
                  </View>
                </View>
              </ScrollView>
            </Surface>
          </Animated.View>
        ) : (
          <View style={styles.emptyDetail}>
            <IconButton
              icon="earth"
              size={48}
              style={styles.emptyIcon}
            />
            <Text variant="titleLarge" style={styles.emptyText}>
              Detayları görüntülemek için bir öğe seçin
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
          <Dialog.Title>Yeni Dünya Öğesi</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="İsim"
              value={newElement.name}
              onChangeText={name => setNewElement(prev => ({ ...prev, name }))}
              style={styles.input}
            />
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={menuAnchor}
            >
              <Menu.Item 
                title="Yer"
                onPress={() => {
                  setNewElement(prev => ({ ...prev, type: 'location' }));
                  setMenuVisible(false);
                }}
              />
              <Menu.Item 
                title="Kültür"
                onPress={() => {
                  setNewElement(prev => ({ ...prev, type: 'culture' }));
                  setMenuVisible(false);
                }}
              />
              <Menu.Item 
                title="Büyü"
                onPress={() => {
                  setNewElement(prev => ({ ...prev, type: 'magic' }));
                  setMenuVisible(false);
                }}
              />
              <Menu.Item 
                title="Teknoloji"
                onPress={() => {
                  setNewElement(prev => ({ ...prev, type: 'technology' }));
                  setMenuVisible(false);
                }}
              />
              <Menu.Item 
                title="Tarih"
                onPress={() => {
                  setNewElement(prev => ({ ...prev, type: 'history' }));
                  setMenuVisible(false);
                }}
              />
              <Menu.Item 
                title="Din"
                onPress={() => {
                  setNewElement(prev => ({ ...prev, type: 'religion' }));
                  setMenuVisible(false);
                }}
              />
              <Menu.Item 
                title="Politika"
                onPress={() => {
                  setNewElement(prev => ({ ...prev, type: 'politics' }));
                  setMenuVisible(false);
                }}
              />
            </Menu>
            <FAB
              icon={isGenerating ? "loading" : "magic-staff"}
              label="AI ile Detaylandır"
              onPress={() => {
                if (newElement.name && newElement.type) {
                  generateWorldElement(newElement.name, newElement.type);
                } else {
                  setError('Lütfen isim ve tür girin');
                }
              }}
              style={styles.generateButton}
              loading={isGenerating}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <IconButton icon="close" onPress={() => setShowAddDialog(false)} />
            <IconButton icon="check" onPress={addWorldElement} />
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
  addButton: {
    marginRight: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  elementList: {
    width: 360,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchInput: {
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  elementScroll: {
    flex: 1,
  },
  elementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 8,
    borderRadius: 12,
    gap: 12,
  },
  selectedCard: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  elementIcon: {
    margin: 0,
  },
  elementInfo: {
    flex: 1,
    gap: 4,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  description: {
    opacity: 0.7,
  },
  elementDetail: {
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
    gap: 8,
  },
  detailScroll: {
    flex: 1,
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
    backgroundColor: '#f8f9fa',
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
  connectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  connectionChip: {
    marginRight: 8,
    marginBottom: 8,
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
  input: {
    marginBottom: 16,
  },
  generateButton: {
    marginTop: 16,
  },
}); 