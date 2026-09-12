import { Pressable, Text, View } from 'react-native'

import { layout, usePalette } from '../theme'

type Props = { id: string; onBack: () => void }

export default function DetailScreen({ id, onBack }: Props) {
  const palette = usePalette()

  return (
    <View style={[layout.screen, { backgroundColor: palette.background }]}>
      <Text testID="detail-title" style={[layout.title, { color: palette.ink }]}>
        Article {id}
      </Text>

      <Text style={[layout.body, { color: palette.inkSoft }]}>
        Reached by deep link at demo://detail/{id}. Every screen in this app is
        addressable, which is what makes the automated flows fast and stable.
      </Text>

      <Pressable testID="detail-back" onPress={onBack} style={[layout.button, { backgroundColor: palette.accent }]}>
        <Text style={layout.buttonLabel}>Back to list</Text>
      </Pressable>
    </View>
  )
}
