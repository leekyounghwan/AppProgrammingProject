export type Recipe = {
  id: string
  name: string
  time: string
  servings: number
  ingredients: string[]
  steps: string[]
  tip?: string
  sourceIngredients: string[]
  createdAt: string
}

export type SavedRecipe = Recipe & {
  savedAt: string
}

export type UserProfile = {
  id: string
  nickname: string
  dietPreferences: string[]
  allergyIngredients: string[]
  createdAt: string
  updatedAt: string
}
