import { StyleSheet, useColorScheme } from 'react-native'

export function usePalette() {
  const dark = useColorScheme() === 'dark'

  return {
    background: dark ? '#14181a' : '#f2f3f2',
    surface: dark ? '#1b2023' : '#ffffff',
    ink: dark ? '#e8ecec' : '#191c1e',
    inkSoft: dark ? '#a8b2b4' : '#4a5155',
    rule: dark ? '#2c3336' : '#d6dad9',
    accent: dark ? '#4fc3d6' : '#0b6f80',
    danger: dark ? '#e0917d' : '#93321f',
  }
}

export const layout = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24 },
  field: { borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16 },
  button: { borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  row: { borderBottomWidth: 1, paddingVertical: 16 },
})
