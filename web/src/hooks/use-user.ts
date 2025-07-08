import { faker } from '@faker-js/faker'
import { v4 } from 'uuid'
import { createStore, useStore } from 'zustand'
import type { User } from '~/types/user'

type UserStore = {
  user: User
  setUser: (
    updater: (user: Omit<User, 'id'>) => Partial<Omit<User, 'id'>>,
  ) => void
}

export const userStore = createStore<UserStore>((set) => {
  return {
    user: {
      id: v4(),
      name: faker.internet.username(),
    },
    setUser: (updater) => {
      set((s) => ({
        user: {
          ...s.user,
          ...updater(s.user),
        },
      }))
    },
  }
})

export function useUser() {
  return useStore(userStore, (state) => state.user)
}

export const setUser = userStore.getState().setUser
