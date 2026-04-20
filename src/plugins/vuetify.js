import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: {
    defaultTheme: 'app',
    themes: {
      app: {
        dark: false,
        colors: {
          primary: '#E60012',
          secondary: '#111111',
          surface: '#FFFFFF'
        }
      }
    }
  }
})
