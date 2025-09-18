# 🎨 Guia do Tailwind CSS com NativeWind

## Configuração Implementada

Este projeto agora está configurado com **NativeWind**, uma implementação do Tailwind CSS para React Native.

### Arquivos de Configuração

- **`tailwind.config.js`** - Configuração do Tailwind com cores personalizadas
- **`metro.config.js`** - Configuração do Metro para processar CSS
- **`babel.config.js`** - Configuração do Babel para JSX
- **`global.css`** - Arquivo CSS global com diretivas do Tailwind
- **`app.json`** - Plugin do NativeWind adicionado

### Cores Personalizadas

```javascript
// Cores definidas no tailwind.config.js
colors: {
  primary: {
    light: '#0a7ea4',
    dark: '#fff',
  },
  background: {
    light: '#fff',
    dark: '#151718',
  },
  text: {
    light: '#11181C',
    dark: '#ECEDEE',
  },
  icon: {
    light: '#687076',
    dark: '#9BA1A6',
  }
}
```

## Como Usar

### 1. Classes Básicas

```tsx
import { View, Text } from 'react-native';

// Layout
<View className="flex-1 justify-center items-center">
  <Text className="text-xl font-bold text-center">
    Olá Tailwind!
  </Text>
</View>

// Espaçamentos e cores
<View className="p-4 m-2 bg-blue-500 rounded-lg">
  <Text className="text-white">Card estilizado</Text>
</View>
```

### 2. Responsive e Temas

```tsx
// Condicional baseada no tema
const colorScheme = useColorScheme();

<View 
  className={`
    p-4 rounded-xl
    ${colorScheme === 'dark' 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200'
    }
  `}
>
  <Text 
    className={`
      text-lg font-semibold
      ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}
    `}
  >
    Texto adaptivo
  </Text>
</View>
```

### 3. Cores Personalizadas

```tsx
// Usando cores definidas no config
<View className="bg-primary-light">
  <Text className="text-background-dark">
    Usando cores personalizadas
  </Text>
</View>
```

### 4. Flexbox e Layout

```tsx
// Layout flexível
<View className="flex-row justify-between items-center">
  <Text className="flex-1 text-left">Esquerda</Text>
  <Text className="text-center">Centro</Text>
  <Text className="text-right">Direita</Text>
</View>

// Grid-like com gap
<View className="space-y-4">
  <View className="h-20 bg-red-300 rounded" />
  <View className="h-20 bg-green-300 rounded" />
  <View className="h-20 bg-blue-300 rounded" />
</View>
```

### 5. Animações e Estados

```tsx
// Estados interativos
<TouchableOpacity 
  className="bg-blue-500 active:bg-blue-600 p-4 rounded-lg"
  activeOpacity={0.8}
>
  <Text className="text-white text-center font-semibold">
    Botão Interativo
  </Text>
</TouchableOpacity>
```

## Classes Mais Úteis para React Native

### Layout
- `flex-1`, `flex-row`, `flex-col`
- `justify-center`, `justify-between`, `justify-around`
- `items-center`, `items-start`, `items-end`
- `absolute`, `relative`

### Espaçamento
- `p-4`, `px-2`, `py-3`, `pt-1`, `pb-2` (padding)
- `m-4`, `mx-2`, `my-3`, `mt-1`, `mb-2` (margin)
- `space-x-2`, `space-y-4` (gap entre filhos)

### Dimensões
- `w-full`, `h-full`, `w-20`, `h-32`
- `min-w-0`, `max-w-xs`, `min-h-0`, `max-h-screen`

### Cores
- `bg-red-500`, `text-blue-600`
- `border-gray-300`, `shadow-lg`

### Tipografia
- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`
- `font-normal`, `font-semibold`, `font-bold`
- `text-left`, `text-center`, `text-right`

### Bordas e Efeitos
- `rounded`, `rounded-lg`, `rounded-full`
- `border`, `border-2`, `border-t`
- `shadow-sm`, `shadow-md`, `shadow-lg`

## Exemplo Completo

```tsx
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export function TailwindCard() {
  const colorScheme = useColorScheme();
  
  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <View 
          className={`
            bg-white dark:bg-gray-800 
            rounded-2xl shadow-lg 
            p-6 mb-4
            border border-gray-200 dark:border-gray-700
          `}
        >
          <Text 
            className={`
              text-2xl font-bold mb-3
              text-gray-900 dark:text-white
            `}
          >
            Card Moderno
          </Text>
          
          <Text 
            className={`
              text-base leading-6 mb-4
              text-gray-600 dark:text-gray-300
            `}
          >
            Este é um exemplo de card estilizado com Tailwind CSS.
          </Text>
          
          <View className="flex-row space-x-3">
            <TouchableOpacity 
              className={`
                flex-1 bg-primary-light 
                py-3 px-4 rounded-lg
                active:bg-primary-light/90
              `}
            >
              <Text className="text-white text-center font-semibold">
                Ação Principal
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`
                flex-1 border border-gray-300 dark:border-gray-600
                py-3 px-4 rounded-lg
                active:bg-gray-50 dark:active:bg-gray-700
              `}
            >
              <Text 
                className={`
                  text-center font-semibold
                  text-gray-700 dark:text-gray-300
                `}
              >
                Secundária
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
```

## Dicas Importantes

1. **Use template literals** para classes condicionais longas
2. **Combine com hooks de tema** para suporte claro/escuro
3. **Teste em múltiplas plataformas** (iOS, Android, Web)
4. **Use cores personalizadas** definidas no config
5. **Mantenha consistência** com o design system

## Comandos Úteis

```bash
# Iniciar servidor de desenvolvimento
npm start

# Limpar cache do Metro
npx expo start --clear

# Build para produção
npx expo build
```

A configuração está completa e pronta para uso! 🚀 