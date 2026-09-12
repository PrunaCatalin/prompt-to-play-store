import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

import { layout, usePalette } from '../theme'

type Props = { onSignedIn: () => void }

/**
 * The password is intentionally checked against a constant: this app exists to
 * be driven by an agent, not to authenticate anyone.
 */
export default function LoginScreen({ onSignedIn }: Props) {
  const palette = usePalette()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (password !== 'correct-horse') {
      // The email survives a failure; the password does not.
      setPassword('')
      setError('That password is not right. Try again.')

      return
    }

    setError(null)
    onSignedIn()
  }

  return (
    <View style={[layout.screen, { backgroundColor: palette.background }]}>
      <Text style={[layout.title, { color: palette.ink }]}>Sign in</Text>

      <TextInput
        accessibilityLabel="Email"
        testID="login-email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        placeholderTextColor={palette.inkSoft}
        value={email}
        onChangeText={setEmail}
        style={[layout.field, { borderColor: palette.rule, color: palette.ink }]}
      />

      <TextInput
        accessibilityLabel="Password"
        testID="login-password"
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={palette.inkSoft}
        value={password}
        onChangeText={setPassword}
        style={[layout.field, { borderColor: palette.rule, color: palette.ink }]}
      />

      {error && (
        <Text testID="login-error" style={[layout.body, { color: palette.danger }]}>
          {error}
        </Text>
      )}

      <Pressable
        testID="login-submit"
        onPress={submit}
        style={[layout.button, { backgroundColor: palette.accent }]}
      >
        <Text style={layout.buttonLabel}>Sign in</Text>
      </Pressable>
    </View>
  )
}
