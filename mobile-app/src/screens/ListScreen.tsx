import { FlatList, Pressable, Text, View } from 'react-native'

import { layout, usePalette } from '../theme'

export type ListState = 'ready' | 'empty' | 'error'

type Props = { state: ListState; onOpen: (id: string) => void }

const items = [
  { id: '1', title: 'Local model, cloud judgement' },
  { id: '2', title: 'Driving the simulator' },
  { id: '3', title: 'Signed builds from a push' },
]

export default function ListScreen({ state, onOpen }: Props) {
  const palette = usePalette()

  // Empty and error states get a title, an explanation and a way out. A blank
  // screen with no call to action is a bug, not a state.
  if (state !== 'ready') {
    const copy =
      state === 'empty'
        ? { title: 'Nothing here yet', body: 'Articles you save will show up on this screen.' }
        : { title: 'Could not load', body: 'The network refused. Pull to try again.' }

    return (
      <View style={[layout.screen, { backgroundColor: palette.background }]}>
        <Text testID="list-state-title" style={[layout.title, { color: palette.ink }]}>
          {copy.title}
        </Text>
        <Text style={[layout.body, { color: palette.inkSoft }]}>{copy.body}</Text>
      </View>
    )
  }

  return (
    <View style={[layout.screen, { backgroundColor: palette.background, justifyContent: 'flex-start' }]}>
      <Text style={[layout.title, { color: palette.ink }]}>Articles</Text>

      <FlatList
        testID="list-items"
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable testID={`list-item-${item.id}`} onPress={() => onOpen(item.id)}>
            <View style={[layout.row, { borderBottomColor: palette.rule }]}>
              <Text style={[layout.body, { color: palette.ink }]}>{item.title}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  )
}
