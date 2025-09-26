import { useI18n } from '@/contexts/I18nContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface DeactivationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: { reason?: string; feedback?: string }) => void;
  loading?: boolean;
}

const DEACTIVATION_REASONS = [
  { id: 'not_using', label: 'Não estou usando mais o app' },
  { id: 'found_alternative', label: 'Encontrei uma alternativa melhor' },
  { id: 'privacy_concerns', label: 'Preocupações com privacidade' },
  { id: 'too_expensive', label: 'Muito caro' },
  { id: 'technical_issues', label: 'Problemas técnicos' },
  { id: 'other', label: 'Outro motivo' },
];

export default function DeactivationModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
}: DeactivationModalProps) {
  const { t } = useI18n();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
    setShowFeedback(true);
  };

  const handleConfirm = () => {
    if (!selectedReason) {
      Alert.alert(
        'Seleção Obrigatória',
        'Por favor, selecione um motivo para a desativação.'
      );
      return;
    }

    const reason = DEACTIVATION_REASONS.find(r => r.id === selectedReason)?.label;
    
    Alert.alert(
      'Confirmar Desativação',
      'Tem certeza que deseja desativar sua conta? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: () => onConfirm({
            reason: reason || selectedReason,
            feedback: feedback.trim() || undefined
          }),
        },
      ]
    );
  };

  const handleClose = () => {
    setSelectedReason('');
    setFeedback('');
    setShowFeedback(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Desativar Conta</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={24} color="#FF6B6B" />
            <Text style={styles.warningText}>
              Ao desativar sua conta, você perderá acesso a todos os seus dados e não poderá recuperá-los.
            </Text>
          </View>

          <Text style={styles.question}>
            Por que você está desativando sua conta?
          </Text>

          <View style={styles.reasonsContainer}>
            {DEACTIVATION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonButton,
                  selectedReason === reason.id && styles.reasonButtonSelected,
                ]}
                onPress={() => handleReasonSelect(reason.id)}
              >
                <View style={styles.reasonContent}>
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason.id && styles.reasonTextSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                  <View
                    style={[
                      styles.radioButton,
                      selectedReason === reason.id && styles.radioButtonSelected,
                    ]}
                  >
                    {selectedReason === reason.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {showFeedback && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackLabel}>
                Gostaria de nos contar mais sobre sua experiência? (Opcional)
              </Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Seus comentários nos ajudam a melhorar o app..."
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {feedback.length}/500 caracteres
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedReason || loading) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selectedReason || loading}
          >
            {loading ? (
              <Text style={styles.confirmButtonText}>Desativando...</Text>
            ) : (
              <Text style={styles.confirmButtonText}>Desativar Conta</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  reasonsContainer: {
    marginBottom: 24,
  },
  reasonButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reasonButtonSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#A78BFA',
  },
  reasonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    marginRight: 12,
  },
  reasonTextSelected: {
    color: '#7C3AED',
    fontWeight: '500',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#7C3AED',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
  },
  feedbackContainer: {
    marginBottom: 24,
  },
  feedbackLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  feedbackInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
