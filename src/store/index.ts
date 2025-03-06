import { create } from 'zustand';
import { User, Project, Chapter, Character, PlotPoint } from '../types/models';
import * as firebase from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
  user: User | null;
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  darkMode: boolean;
  autoSave: boolean;

  // Auth Actions
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Project Actions
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Chapter Actions
  addChapter: (projectId: string, chapter: Omit<Chapter, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateChapter: (projectId: string, chapterId: string, data: Partial<Chapter>) => Promise<void>;
  deleteChapter: (projectId: string, chapterId: string) => Promise<void>;

  // Character Actions
  addCharacter: (projectId: string, character: Omit<Character, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCharacter: (projectId: string, characterId: string, data: Partial<Character>) => Promise<void>;
  deleteCharacter: (projectId: string, characterId: string) => Promise<void>;

  // Plot Point Actions
  addPlotPoint: (projectId: string, plotPoint: Omit<PlotPoint, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePlotPoint: (projectId: string, plotPointId: string, data: Partial<PlotPoint>) => Promise<void>;
  deletePlotPoint: (projectId: string, plotPointId: string) => Promise<void>;

  // UI State Actions
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleDarkMode: () => void;
  setAutoSave: (enabled: boolean) => void;
}

type AppStateUpdater = (state: AppState) => Partial<AppState>;

export const useStore = create<AppState>()(
  persist(
    (set: (fn: AppStateUpdater | Partial<AppState>) => void, get: () => AppState) => ({
      user: null,
      currentProject: null,
      projects: [],
      isLoading: false,
      error: null,
      darkMode: false,
      autoSave: true,

      // Auth Actions
      setUser: (user: User | null) => set(() => ({ user })),
      signIn: async (email: string, password: string) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          const firebaseUser = await firebase.signIn(email, password);
          if (!firebaseUser) throw new Error('Giriş başarısız');
          
          const user = await firebase.getDocument<User>('users', firebaseUser.uid);
          if (!user) throw new Error('Kullanıcı bilgileri bulunamadı');
          
          set(() => ({ user, isLoading: false }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },
      signUp: async (email: string, password: string) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          const firebaseUser = await firebase.signUp(email, password);
          if (!firebaseUser) throw new Error('Kayıt başarısız');
          
          const user: User = {
            id: firebaseUser.uid,
            email,
            displayName: email.split('@')[0],
            createdAt: new Date(),
            lastLoginAt: new Date(),
          };
          
          await firebase.createDocument('users', user);
          set(() => ({ user, isLoading: false }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },
      signOut: async () => {
        try {
          set(() => ({ isLoading: true, error: null }));
          await firebase.logOut();
          set(() => ({ user: null, currentProject: null, projects: [], isLoading: false }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },

      // Project Actions
      setCurrentProject: (project: Project | null) => set(() => ({ currentProject: project })),
      setProjects: (projects: Project[]) => set(() => ({ projects })),
      createProject: async (projectData) => {
        try {
          const { user } = get();
          if (!user) throw new Error('Kullanıcı girişi yapılmamış');

          set(() => ({ isLoading: true, error: null }));
          const project: Project = {
            ...projectData,
            id: Date.now().toString(),
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            chapters: [],
            characters: [],
            plotPoints: [],
          };

          await firebase.createDocument('projects', project);
          set(state => ({
            projects: [...state.projects, project],
            currentProject: project,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },
      updateProject: async (projectId, data) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          await firebase.updateDocument('projects', { id: projectId, ...data });
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId ? { ...p, ...data, updatedAt: new Date() } : p
            ),
            currentProject: state.currentProject?.id === projectId 
              ? { ...state.currentProject, ...data, updatedAt: new Date() }
              : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },
      deleteProject: async (projectId) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          await firebase.deleteDocument('projects', projectId);
          set(state => ({
            projects: state.projects.filter(p => p.id !== projectId),
            currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },

      // Chapter Actions
      addChapter: async (projectId, chapterData) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          const chapter: Chapter = {
            ...chapterData,
            id: Date.now().toString(),
            projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastEditedBy: get().user?.id || '',
          };

          await firebase.createDocument(`projects/${projectId}/chapters`, chapter);
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId 
                ? { ...p, chapters: [...p.chapters, chapter] }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? { ...state.currentProject, chapters: [...state.currentProject.chapters, chapter] }
              : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },
      updateChapter: async (projectId, chapterId, data) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          await firebase.updateDocument(`projects/${projectId}/chapters`, { id: chapterId, ...data });
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId
                ? {
                    ...p,
                    chapters: p.chapters.map(c =>
                      c.id === chapterId
                        ? { ...c, ...data, updatedAt: new Date() }
                        : c
                    ),
                  }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? {
                  ...state.currentProject,
                  chapters: state.currentProject.chapters.map(c =>
                    c.id === chapterId
                      ? { ...c, ...data, updatedAt: new Date() }
                      : c
                  ),
                }
              : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },
      deleteChapter: async (projectId, chapterId) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          await firebase.deleteDocument(`projects/${projectId}/chapters`, chapterId);
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId
                ? { ...p, chapters: p.chapters.filter(c => c.id !== chapterId) }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? { ...state.currentProject, chapters: state.currentProject.chapters.filter(c => c.id !== chapterId) }
              : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },

      // Character Actions
      addCharacter: async (projectId, characterData) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          const character: Character = {
            ...characterData,
            id: Date.now().toString(),
            projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await firebase.createDocument(`projects/${projectId}/characters`, character);
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId 
                ? { ...p, characters: [...p.characters, character] }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? { ...state.currentProject, characters: [...state.currentProject.characters, character] }
              : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },
      updateCharacter: async (projectId, characterId, data) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          await firebase.updateDocument(`projects/${projectId}/characters`, { id: characterId, ...data });
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId
                ? {
                    ...p,
                    characters: p.characters.map(c =>
                      c.id === characterId
                        ? { ...c, ...data, updatedAt: new Date() }
                        : c
                    ),
                  }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? {
                  ...state.currentProject,
                  characters: state.currentProject.characters.map(c =>
                    c.id === characterId
                      ? { ...c, ...data, updatedAt: new Date() }
                      : c
                  ),
                }
              : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },
      deleteCharacter: async (projectId, characterId) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          await firebase.deleteDocument(`projects/${projectId}/characters`, characterId);
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId
                ? { ...p, characters: p.characters.filter(c => c.id !== characterId) }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? { ...state.currentProject, characters: state.currentProject.characters.filter(c => c.id !== characterId) }
              : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },

      // Plot Point Actions
      addPlotPoint: async (projectId, plotPointData) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          const plotPoint: PlotPoint = {
            ...plotPointData,
            id: Date.now().toString(),
            projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await firebase.createDocument(`projects/${projectId}/plotPoints`, plotPoint);
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId 
                ? { ...p, plotPoints: [...p.plotPoints, plotPoint] }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? { ...state.currentProject, plotPoints: [...state.currentProject.plotPoints, plotPoint] }
              : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },
      updatePlotPoint: async (projectId, plotPointId, data) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          await firebase.updateDocument(`projects/${projectId}/plotPoints`, { id: plotPointId, ...data });
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId
                ? {
                    ...p,
                    plotPoints: p.plotPoints.map(pp =>
                      pp.id === plotPointId
                        ? { ...pp, ...data, updatedAt: new Date() }
                        : pp
                    ),
                  }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? {
                  ...state.currentProject,
                  plotPoints: state.currentProject.plotPoints.map(pp =>
                    pp.id === plotPointId
                      ? { ...pp, ...data, updatedAt: new Date() }
                      : pp
                  ),
                }
              : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },
      deletePlotPoint: async (projectId, plotPointId) => {
        try {
          set(() => ({ isLoading: true, error: null }));
          await firebase.deleteDocument(`projects/${projectId}/plotPoints`, plotPointId);
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId
                ? { ...p, plotPoints: p.plotPoints.filter(pp => pp.id !== plotPointId) }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? { ...state.currentProject, plotPoints: state.currentProject.plotPoints.filter(pp => pp.id !== plotPointId) }
              : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set(() => ({ error: (error as Error).message, isLoading: false }));
          throw error;
        }
      },

      // UI State Actions
      setLoading: (isLoading) => set(() => ({ isLoading })),
      setError: (error) => set(() => ({ error })),
      toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
      setAutoSave: (enabled) => set(() => ({ autoSave: enabled })),
    }),
    {
      name: 'writer-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 