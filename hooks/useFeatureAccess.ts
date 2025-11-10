import { useAuth } from '@/contexts/AuthContext';
import { subscriptionsService } from '@/services';
import React, { useState } from 'react';

export interface FeatureAccess {
  canAccess: boolean;
  isCheckingAccess: boolean;
}

export function useFeatureAccess(
  _featureName: string,
  _featureDescription: string,
  _iconName: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap
): FeatureAccess {
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<string>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free');
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);

  // Carregar plano do usuário e determinar se há limitação
  React.useEffect(() => {
    const loadUserPlan = async () => {
      if (!user?.id) {
        setUserPlan('free');
        setSubscriptionStatus('free');
        setIsCheckingAccess(false);
        return;
      }

      try {
        setIsCheckingAccess(true);
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
      } finally {
        setIsCheckingAccess(false);
      }
    };

    loadUserPlan();
  }, [user?.id]);

  const isFreeUser = userPlan === 'free' && subscriptionStatus === 'free';
  const canAccess = !isFreeUser;

  return {
    canAccess,
    isCheckingAccess,
  };
}
