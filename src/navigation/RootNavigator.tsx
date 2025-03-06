import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import WriterScreen from '../screens/WriterScreen';
import CharacterScreen from '../screens/CharacterScreen';
import PlotScreen from '../screens/PlotScreen';
import WorldScreen from '../screens/WorldScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Writer"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Writer" component={WriterScreen} />
      <Stack.Screen name="Characters" component={CharacterScreen} />
      <Stack.Screen name="Plot" component={PlotScreen} />
      <Stack.Screen name="World" component={WorldScreen} />
      <Stack.Screen name="Analysis" component={AnalysisScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
} 