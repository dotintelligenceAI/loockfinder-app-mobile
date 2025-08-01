/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Cores do LookFinder - Preto e Branco
        primary: {
          black: '#000000',
          white: '#FFFFFF',
          gray: '#F5F5F5',
          'gray-light': '#F9F9F9',
          'gray-medium': '#E5E5E5',
          'gray-dark': '#333333',
        },
        background: {
          light: '#FFFFFF',
          dark: '#000000',
          gray: '#F5F5F5',
        },
        text: {
          primary: '#000000',
          secondary: '#666666',
          light: '#999999',
          white: '#FFFFFF',
        },
        border: {
          light: '#E5E5E5',
          medium: '#CCCCCC',
          dark: '#333333',
        }
      },
      fontFamily: {
        'space-mono': ['SpaceMono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      }
    },
  },
  plugins: [],
} 