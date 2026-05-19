import create from 'zustand'

export const useUIStore = create((set) => ({
  currency: 'USD',
  language: 'en',
  setCurrency: (currency) => set({ currency }),
  setLanguage: (language) => set({ language }),
}))

export default useUIStore
