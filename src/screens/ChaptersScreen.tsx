import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Appbar, Surface, Text, FAB, List, IconButton, Portal, Dialog, TextInput, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Chapter = {
  id: string;
  title: string;
  wordCount: number;
  status: 'draft' | 'inProgress' | 'completed';
  lastEdited: Date;
};

export default function ChaptersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [showChapterOptions, setShowChapterOptions] = useState(false);

  const getStatusIcon = (status: Chapter['status']) => {
    switch (status) {
      case 'draft':
        return 'pencil-outline';
      case 'inProgress':
        return 'pencil';
      case 'completed':
        return 'check-circle';
    }
  };

  const getStatusColor = (status: Chapter['status']) => {
    switch (status) {
      case 'draft':
        return theme.colors.error;
      case 'inProgress':
        return theme.colors.primary;
      case 'completed':
        return theme.colors.secondary;
    }
  };

  const addChapter = () => {
    if (newChapterTitle.trim()) {
      const newChapter: Chapter = {
        id: Date.now().toString(),
        title: newChapterTitle,
        wordCount: 0,
        status: 'draft',
        lastEdited: new Date(),
      };
      setChapters([...chapters, newChapter]);
      setNewChapterTitle('');
      setShowAddChapter(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Bölümler" />
        <Appbar.Action icon="sort" onPress={() => {}} />
      </Appbar.Header>

      <Animated.View 
        entering={FadeIn.duration(500)}
        style={styles.content}
      >
        <ScrollView>
          {chapters.map((chapter, index) => (
            <Animated.View
              key={chapter.id}
              entering={SlideInRight.delay(index * 100)}
            >
              <Surface style={styles.chapterCard} elevation={1}>
                <List.Item
                  title={chapter.title}
                  description={`${chapter.wordCount} kelime • Son düzenleme: ${chapter.lastEdited.toLocaleDateString()}`}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={getStatusIcon(chapter.status)}
                      color={getStatusColor(chapter.status)}
                    />
                  )}
                  right={props => (
                    <IconButton
                      {...props}
                      icon="dots-vertical"
                      onPress={() => {
                        setSelectedChapter(chapter);
                        setShowChapterOptions(true);
                      }}
                    />
                  )}
                  onPress={() => {
                    // Bölümü düzenlemeye git
                  }}
                />
              </Surface>
            </Animated.View>
          ))}
        </ScrollView>

        {chapters.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="titleMedium">Henüz bölüm yok</Text>
            <Text variant="bodyMedium" style={styles.emptyStateDescription}>
              İlk bölümünüzü eklemek için + butonuna tıklayın
            </Text>
          </View>
        )}
      </Animated.View>

      <Portal>
        <Dialog visible={showAddChapter} onDismiss={() => setShowAddChapter(false)}>
          <Dialog.Title>Yeni Bölüm</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Bölüm Başlığı"
              value={newChapterTitle}
              onChangeText={setNewChapterTitle}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <IconButton icon="close" onPress={() => setShowAddChapter(false)} />
            <IconButton icon="check" onPress={addChapter} />
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showChapterOptions} onDismiss={() => setShowChapterOptions(false)}>
          <Dialog.Title>Bölüm İşlemleri</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="Düzenle"
              left={props => <List.Icon {...props} icon="pencil" />}
              onPress={() => {
                setShowChapterOptions(false);
                // Bölümü düzenlemeye git
              }}
            />
            <List.Item
              title="Durumu Değiştir"
              left={props => <List.Icon {...props} icon="refresh" />}
              onPress={() => {
                if (selectedChapter) {
                  const newStatus: Chapter['status'] = 
                    selectedChapter.status === 'draft' ? 'inProgress' :
                    selectedChapter.status === 'inProgress' ? 'completed' : 'draft';
                  
                  setChapters(chapters.map(ch => 
                    ch.id === selectedChapter.id ? { ...ch, status: newStatus } : ch
                  ));
                }
                setShowChapterOptions(false);
              }}
            />
            <List.Item
              title="Sil"
              left={props => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
              onPress={() => {
                if (selectedChapter) {
                  setChapters(chapters.filter(ch => ch.id !== selectedChapter.id));
                }
                setShowChapterOptions(false);
              }}
            />
          </Dialog.Content>
        </Dialog>
      </Portal>

      <FAB
        icon="plus"
        label="Yeni Bölüm"
        style={styles.fab}
        onPress={() => setShowAddChapter(true)}
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
  chapterCard: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateDescription: {
    marginTop: 8,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 