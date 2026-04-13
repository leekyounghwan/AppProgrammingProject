import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { UserProfile, SavedRecipe, Recipe } from '../types'

type AppState = {
  profile: UserProfile | null
  savedRecipes: SavedRecipe[]
}

type AppAction =
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'SAVE_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; payload: string }

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROFILE': {
      const profile = action.payload
      localStorage.setItem('user_profile', JSON.stringify(profile))
      return { ...state, profile }
    }
    case 'SAVE_RECIPE': {
      const already = state.savedRecipes.some(r => r.id === action.payload.id)
      if (already) return state
      const saved: SavedRecipe = { ...action.payload, savedAt: new Date().toISOString() }
      const next = [saved, ...state.savedRecipes]
      localStorage.setItem('saved_recipes', JSON.stringify(next))
      return { ...state, savedRecipes: next }
    }
    case 'DELETE_RECIPE': {
      const next = state.savedRecipes.filter(r => r.id !== action.payload)
      localStorage.setItem('saved_recipes', JSON.stringify(next))
      return { ...state, savedRecipes: next }
    }
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    profile: null,
    savedRecipes: [],
  })

  useEffect(() => {
    const p = localStorage.getItem('user_profile')
    if (p) dispatch({ type: 'SET_PROFILE', payload: JSON.parse(p) })

    const r = localStorage.getItem('saved_recipes')
    if (r) {
      const recipes: SavedRecipe[] = JSON.parse(r)
      recipes.forEach(recipe => dispatch({ type: 'SAVE_RECIPE', payload: recipe }))
    }
  }, [])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
