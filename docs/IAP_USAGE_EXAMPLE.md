# 🛍️ Exemplo de Uso do Sistema IAP

Este documento mostra como usar o novo sistema de In-App Purchases no LookFinder.

## 📱 Implementação em Componentes

### **1. Usando o Hook useFeatureAccess**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

export default function ChatScreen() {
  const { 
    canAccess, 
    showUpgradeModal, 
    UpgradeModalComponent 
  } = useFeatureAccess(
    'Chat com IA', 
    'Acesso ilimitado ao chat com inteligência artificial',
    'chatbubbles'
  );

  const handleChatPress = () => {
    if (canAccess) {
      // Usuário tem acesso, abrir chat
      console.log('Abrindo chat...');
    } else {
      // Usuário não tem acesso, mostrar modal de upgrade
      showUpgradeModal();
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleChatPress}>
        <Text>Iniciar Chat com IA</Text>
      </TouchableOpacity>
      
      {/* Modal de upgrade será exibido automaticamente */}
      <UpgradeModalComponent />
    </View>
  );
}
```

### **2. Usando o Serviço IAP Diretamente**

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { iapService } from '@/services/iapService';
import { subscriptionsService } from '@/services/subscriptionsService';

export default function UpgradeScreen() {
  const [products, setProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await subscriptionsService.getIAPProducts();
      if (result.success) {
        setProducts(result.products || []);
        setSubscriptions(result.subscriptions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handlePurchase = async (productId: string, isSubscription: boolean) => {
    setLoading(true);
    try {
      let result;
      if (isSubscription) {
        result = await iapService.purchaseSubscription(productId);
      } else {
        result = await iapService.purchaseProduct(productId);
      }

      if (result.success) {
        Alert.alert('Sucesso!', 'Compra realizada com sucesso!');
      } else {
        Alert.alert('Erro', result.error || 'Erro na compra');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao processar compra');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await subscriptionsService.restorePurchases();
      if (result.success) {
        Alert.alert('Sucesso!', `${result.restoredCount} compra(s) restaurada(s)`);
      } else {
        Alert.alert('Erro', result.error || 'Erro ao restaurar compras');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao restaurar compras');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>Planos Disponíveis</Text>
      
      {/* Produtos únicos */}
      {products.map(product => (
        <TouchableOpacity 
          key={product.productId}
          onPress={() => handlePurchase(product.productId, false)}
          disabled={loading}
        >
          <Text>{product.title} - {product.localizedPrice}</Text>
        </TouchableOpacity>
      ))}

      {/* Assinaturas */}
      {subscriptions.map(subscription => (
        <TouchableOpacity 
          key={subscription.productId}
          onPress={() => handlePurchase(subscription.productId, true)}
          disabled={loading}
        >
          <Text>{subscription.title} - {subscription.localizedPrice}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={handleRestore} disabled={loading}>
        <Text>Restaurar Compras</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## 🔧 Configuração Inicial

### **1. Inicializar IAP no App**

```typescript
// App.tsx ou _layout.tsx
import { useEffect } from 'react';
import { iapService } from '@/services/iapService';

export default function App() {
  useEffect(() => {
    // Inicializar IAP quando o app carrega
    iapService.initialize().then(result => {
      if (result.success) {
        console.log('IAP inicializado com sucesso');
      } else {
        console.error('Erro ao inicializar IAP:', result.error);
      }
    });

    // Cleanup quando o app fecha
    return () => {
      iapService.cleanup();
    };
  }, []);

  return (
    // Seu app aqui
  );
}
```

### **2. Verificar Status de Assinatura**

```typescript
import { useEffect, useState } from 'react';
import { subscriptionsService } from '@/services/subscriptionsService';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    if (user?.id) {
      checkSubscriptionStatus();
    }
  }, [user?.id]);

  const checkSubscriptionStatus = async () => {
    try {
      const result = await subscriptionsService.getProfileWithPlan(user.id);
      if (result.success && result.data) {
        setSubscriptionStatus(result.data);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  return (
    <View>
      <Text>Status: {subscriptionStatus?.subscription_status}</Text>
      <Text>Plano: {subscriptionStatus?.plan?.name}</Text>
    </View>
  );
}
```

## 🎯 Fluxo Completo de Compra

### **1. Usuário Clica em Upgrade**
```typescript
const handleUpgrade = () => {
  // Mostrar modal de upgrade
  showUpgradeModal();
};
```

### **2. Modal de Upgrade é Exibido**
```typescript
// O modal carrega automaticamente os produtos IAP
// Usuário vê preços e descrições
// Usuário seleciona um plano
```

### **3. Processamento da Compra**
```typescript
// IAP processa a compra
// App Store/Google Play gerencia pagamento
// Webhook atualiza status no banco
// Interface é atualizada automaticamente
```

### **4. Verificação de Acesso**
```typescript
// Hook verifica status atualizado
// Usuário ganha acesso às funcionalidades premium
// Modal é fechado automaticamente
```

## 🔄 Restauração de Compras

### **Implementação Automática**
```typescript
// O hook useFeatureAccess já inclui restauração automática
// Quando o usuário volta ao app, compras são verificadas
// Status é sincronizado automaticamente
```

### **Restauração Manual**
```typescript
const handleRestorePurchases = async () => {
  try {
    const result = await subscriptionsService.restorePurchases();
    if (result.success && result.restoredCount > 0) {
      Alert.alert('Sucesso!', `${result.restoredCount} compra(s) restaurada(s)`);
    } else {
      Alert.alert('Info', 'Nenhuma compra encontrada para restaurar');
    }
  } catch (error) {
    Alert.alert('Erro', 'Erro ao restaurar compras');
  }
};
```

## 🧪 Testando IAP

### **1. Ambiente Sandbox**
```typescript
// Criar conta de teste no App Store Connect
// Configurar dispositivo com conta sandbox
// Testar compras sem cobrança real
```

### **2. TestFlight**
```typescript
// Adicionar testadores internos
// Testar fluxo completo
// Verificar restauração de compras
```

### **3. Logs de Debug**
```typescript
// Verificar logs do console
// Monitorar status de compras
// Verificar sincronização com banco
```

## 📊 Monitoramento

### **Métricas Importantes**
- Taxa de conversão por produto
- Receita por região
- Cancelamentos de assinatura
- Restaurações de compra

### **App Store Connect**
- Vá para Analytics > In-App Purchases
- Monitore vendas e conversões
- Ajuste preços conforme necessário

## 🚨 Tratamento de Erros

### **Erros Comuns**
```typescript
// Usuário cancelou compra
if (error.message.includes('User canceled')) {
  // Não mostrar erro, apenas fechar modal
  return;
}

// Erro de rede
if (error.message.includes('network')) {
  Alert.alert('Erro de Conexão', 'Verifique sua internet e tente novamente');
  return;
}

// Produto não encontrado
if (error.message.includes('Product not found')) {
  Alert.alert('Erro', 'Produto não disponível no momento');
  return;
}
```

### **Fallback para Redirecionamento**
```typescript
// Se IAP falhar, oferecer redirecionamento como fallback
const handleUpgradeFallback = () => {
  Alert.alert(
    'Upgrade Premium',
    'Para fazer upgrade, visite nosso site:',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Visitar Site', onPress: () => {
        Linking.openURL('https://lookfinder.com/upgrade');
      }}
    ]
  );
};
```

## ✅ Checklist de Implementação

- [ ] IAP inicializado no app
- [ ] Produtos configurados no App Store Connect
- [ ] Hook useFeatureAccess implementado
- [ ] Modal de upgrade funcionando
- [ ] Restauração de compras testada
- [ ] Tratamento de erros implementado
- [ ] Logs de debug configurados
- [ ] Testado em sandbox
- [ ] Testado no TestFlight
- [ ] Pronto para produção
