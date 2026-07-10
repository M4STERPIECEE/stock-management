/* eslint-disable react-refresh/only-export-components */

'use client'

export function ColorModeProvider(props) {
  return <>{props.children}</>
}

export function useColorMode() {
  return {
    colorMode: 'light',
    setColorMode: () => {},
    toggleColorMode: () => {},
  }
}

export function useColorModeValue(light) {
  return light
}
