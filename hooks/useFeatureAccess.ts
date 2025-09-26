import { useAuth } from '@/contexts/AuthContext';
import { subscriptionsService } from '@/services';
import { router } from 'expo-router';
import React, { useState } from 'react';

export interface FeatureAccess {
  canAccess: boolean;
  showUpgradeModal: () => void;
  hideUpgradeModal: () => void;
  isUpgradeModalVisible: boolean;
  handleUpgrade: () => void;
  handleGoHome: () => void;
  upgradeModalProps: {
    visible: boolean;
    onClose: () => void;
    onUpgradeSuccess: () => void;
  };
}

export function useFeatureAccess(featureName: string, featureDescription: string, iconName: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap): FeatureAccess {
  const { user } = useAuth();
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);


  // Verificar se o usuário tem acesso à feature
  // Usuário é gratuito apenas se tem plano free E status free
  const isFreeUser = userPlan === 'free' && subscriptionStatus === 'free';
  const canAccess = !isFreeUser;

  const showUpgradeModal = () => {
    setIsUpgradeModalVisible(true);
  };

  const hideUpgradeModal = () => {
    setIsUpgradeModalVisible(false);
  };

  const handleUpgrade = () => {
    // Não fechar o modal aqui, deixar o UpgradeModal gerenciar
    // O modal será fechado quando a compra for concluída
  };

  const handleUpgradeSuccess = () => {
    // Recarregar dados do usuário após upgrade bem-sucedido
    if (user?.id) {
      subscriptionsService.getProfileWithPlan(user.id).then(response => {
        if (response.success && response.data) {
          const planSlug = response.data.plan?.slug || 'free';
          const status = response.data.subscription_status || 'free';
          setUserPlan(planSlug);
          setSubscriptionStatus(status);
        }
      });
    }
  };

  const handleGoHome = () => {
    hideUpgradeModal();
    router.push('/(tabs)/home' as any);
  };

  // Carregar plano do usuário
  React.useEffect(() => {
    const loadUserPlan = async () => {
      if (user?.id) {
        try {
          const response = await subscriptionsService.getProfileWithPlan(user.id);
          
          if (response.success && response.data) {
            const planSlug = response.data.plan?.slug || 'free';
            const status = response.data.subscription_status || 'free';
            setUserPlan(planSlug);
            setSubscriptionStatus(status);
          } else {
            setUserPlan('free');
            setSubscriptionStatus('free');
          }
        } catch (error) {
          console.error('Erro ao carregar plano do usuário:', error);
          setUserPlan('free');
          setSubscriptionStatus('free');
        }
      } else {
        setUserPlan('free');
        setSubscriptionStatus('free');
      }
    };

    loadUserPlan();
  }, [user?.id]);

  // Mostrar modal automaticamente após 5 segundos para usuários gratuitos
  React.useEffect(() => {
    if (isFreeUser) {
      const timer = setTimeout(() => {
        setIsUpgradeModalVisible(true);
      }, 5000); // 5 segundos

      return () => clearTimeout(timer);
    }
  }, [isFreeUser]);

  return {
    canAccess,
    showUpgradeModal,
    hideUpgradeModal,
    isUpgradeModalVisible,
    handleUpgrade,
    handleGoHome,
    upgradeModalProps: {
      visible: isUpgradeModalVisible,
      onClose: hideUpgradeModal,
      onUpgradeSuccess: handleUpgradeSuccess,
    },
  };
}
