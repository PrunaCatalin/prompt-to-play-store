import * as Linking from 'expo-linking'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import DetailScreen from './screens/DetailScreen'
import ListScreen, { type ListState } from './screens/ListScreen'
import LoginScreen from './screens/LoginScreen'

type Route =
  | { name: 'login' }
  | { name: 'list'; state: ListState }
  | { name: 'detail'; id: string }

/**
 * Deep links are the entry point for every automated flow: tapping forward from
 * the home screen on each run is slow and is where flaky failures come from.
 *
 *   demo://login
 *   demo://list?state=empty
 *   demo://detail/42
 */
function routeFromUrl(url: string | null): Route | null {
  if (!url) {
    return null
  }

  const { path, queryParams } = Linking.parse(url)

  if (path?.startsWith('detail')) {
    const id = path.split('/')[1]

    return id ? { name: 'detail', id } : null
  }

  if (path?.startsWith('list')) {
    const state = queryParams?.state

    return {
      name: 'list',
      state: state === 'empty' || state === 'error' ? state : 'ready',
    }
  }

  if (path?.startsWith('login')) {
    return { name: 'login' }
  }

  return null
}

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'login' })

  const applyUrl = useCallback((url: string | null) => {
    const next = routeFromUrl(url)

    if (next) {
      setRoute(next)
    }
  }, [])

  useEffect(() => {
    Linking.getInitialURL().then(applyUrl)

    const subscription = Linking.addEventListener('url', ({ url }) => applyUrl(url))

    return () => subscription.remove()
  }, [applyUrl])

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {route.name === 'login' && (
        <LoginScreen onSignedIn={() => setRoute({ name: 'list', state: 'ready' })} />
      )}
      {route.name === 'list' && (
        <ListScreen state={route.state} onOpen={(id) => setRoute({ name: 'detail', id })} />
      )}
      {route.name === 'detail' && (
        <DetailScreen id={route.id} onBack={() => setRoute({ name: 'list', state: 'ready' })} />
      )}
    </SafeAreaProvider>
  )
}
