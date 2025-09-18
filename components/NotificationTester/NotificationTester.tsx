import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface NotificationTesterProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationTester({ visible, onClose }: NotificationTesterProps) {
  const { user, expoPushToken } = useAuth();
  const {
    notifications,
    stats,
    loading,
    loadNotifications,
    markAsRead,
    deactivateNotification,
    sendTestNotification,
    processNotifications,
    unreadCount,
    hasUnread
  } = useNotifications();

  const [processing, setProcessing] = useState(false);

  const handleTestNotification = async () => {
    await sendTestNotification(
      'Teste LookFinder 🎉',
      'Esta é uma notificação de teste do seu app!'
    );
    Alert.alert('Sucesso', 'Notificação de teste enviada!');
  };

  const handleProcessNotifications = async () => {
    setProcessing(true);
    try {
      await processNotifications();
      Alert.alert('Sucesso', 'Notificações processadas!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar notificações');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsRead = async (avisoId: string) => {
    await markAsRead(avisoId);
  };

  const handleDeactivate = async (avisoId: string) => {
    Alert.alert(
      'Confirmar',
      'Deseja desativar esta notificação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desativar', 
          style: 'destructive',
          onPress: () => deactivateNotification(avisoId)
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔔 Notificações</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Informações do Token */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Token do Dispositivo</Text>
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenText}>
                {expoPushToken ? `${expoPushToken.substring(0, 50)}...` : 'Não configurado'}
              </Text>
              {expoPushToken && (
                <View style={styles.tokenStatus}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.tokenStatusText}>Ativo</Text>
                </View>
              )}
            </View>
          </View>

          {/* Estatísticas */}
          {stats && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Estatísticas</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.naoMostrados}</Text>
                  <Text style={styles.statLabel}>Não lidas</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.mostrados}</Text>
                  <Text style={styles.statLabel}>Lidas</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{stats.ativos}</Text>
                  <Text style={styles.statLabel}>Ativas</Text>
                </View>
              </View>
            </View>
          )}

          {/* Ações de Teste */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧪 Ações de Teste</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity 
                style={styles.testButton} 
                onPress={handleTestNotification}
              >
                <Ionicons name="notifications" size={20} color="#fff" />
                <Text style={styles.testButtonText}>Teste Local</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.testButton, { backgroundColor: '#3B82F6' }]} 
                onPress={handleProcessNotifications}
                disabled={processing}
              >
                <Ionicons name="sync" size={20} color="#fff" />
                <Text style={styles.testButtonText}>
                  {processing ? 'Processando...' : 'Processar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.testButton, { backgroundColor: '#10B981' }]} 
                onPress={() => loadNotifications()}
                disabled={loading}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.testButtonText}>Recarregar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Notificações */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Notificações ({notifications.length})</Text>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Nenhuma notificação encontrada</Text>
              </View>
            ) : (
              notifications.map((notif) => (
                <View key={notif.id} style={styles.notificationCard}>
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationTitleRow}>
                      <Text style={styles.notificationTitle}>{notif.titulo}</Text>
                      <View style={styles.notificationBadges}>
                        {!notif.mostrado_em && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>Nova</Text>
                          </View>
                        )}
                        <View style={[
                          styles.typeBadge,
                          { backgroundColor: getTypeColor(notif.aviso_tipo) }
                        ]}>
                          <Text style={styles.typeBadgeText}>{notif.aviso_tipo}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.notificationDescription}>{notif.descricao}</Text>
                    <Text style={styles.notificationDate}>
                      Criado: {formatDate(notif.criado_em)}
                    </Text>
                    {notif.mostrado_em && (
                      <Text style={styles.notificationDate}>
                        Lido: {formatDate(notif.mostrado_em)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.notificationActions}>
                    {!notif.mostrado_em && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleMarkAsRead(notif.id)}
                      >
                        <Ionicons name="checkmark" size={16} color="#10B981" />
                        <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                          Marcar como lida
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    {notif.ativo && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeactivate(notif.id)}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                        <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                          Desativar
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function getTypeColor(tipo: string): string {
  switch (tipo) {
    case 'welcome_tour': return '#3B82F6';
    case 'new_feature': return '#10B981';
    case 'promotion': return '#F59E0B';
    case 'update': return '#8B5CF6';
    case 'maintenance': return '#EF4444';
    default: return '#6B7280';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  tokenContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  tokenStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tokenStatusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  notificationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationHeader: {
    marginBottom: 12,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  notificationBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});
