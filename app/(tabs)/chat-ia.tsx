import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
}

export default function ChatIAScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou sua IA Finder, assistente de moda pessoal do LookFinder. Como posso te ajudar hoje?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);

  const quickSuggestions = [
    "Como combinar cores?",
    "Looks para trabalho",
    "Tendências 2025",
    "Acessórios essenciais",
    "Estilo minimalista",
    "Looks casuais"
  ];

  const fashionResponses = {
    'cores': [
      'Para combinar cores, use a regra dos 60-30-10: 60% cor neutra, 30% cor secundária e 10% cor de destaque! 🎨',
      'Cores neutras como preto, branco, bege e cinza são versáteis e combinam com tudo. ✨',
      'Para um look monocromático, use diferentes tons da mesma cor para criar profundidade. 🌈',
    ],
    'estilo': [
      'Seu estilo deve refletir sua personalidade! Que tal experimentar diferentes estilos até encontrar o seu? 💫',
      'O estilo minimalista está em alta: peças básicas, cores neutras e cortes limpos. 🤍',
      'Para um estilo casual chic, combine jeans com blazer e acessórios elegantes. ✨',
    ],
    'looks': [
      'Para o trabalho: blazer + calça social + sapato fechado = look profissional impecável! 👔',
      'Para o fim de semana: jeans + t-shirt + tênis + jaqueta jeans = casual e confortável. 👕',
      'Para uma ocasião especial: vestido midi + salto + acessórios delicados = elegante e sofisticado. 👗',
    ],
    'tendencias': [
      'As tendências 2025 incluem: cores terrosas, estampas florais, oversized e sustentabilidade! 🌿',
      'O estilo Y2K continua forte com cores metálicas e peças futuristas! ⚡',
      'Moda sustentável é tendência: invista em peças atemporais e de qualidade. 🌱',
    ],
    'acessorios': [
      'Acessórios transformam qualquer look! Um colar statement pode elevar um outfit básico. 💎',
      'Para o dia: brincos pequenos, relógio delicado e bolsa estruturada. ☀️',
      'Para a noite: brincos maiores, clutch elegante e sapatos de salto. 🌙',
    ],
  };

  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('cor') || message.includes('combinar')) {
      return fashionResponses.cores[Math.floor(Math.random() * fashionResponses.cores.length)];
    }
    
    if (message.includes('estilo') || message.includes('personalidade')) {
      return fashionResponses.estilo[Math.floor(Math.random() * fashionResponses.estilo.length)];
    }
    
    if (message.includes('look') || message.includes('outfit') || message.includes('roupa')) {
      return fashionResponses.looks[Math.floor(Math.random() * fashionResponses.looks.length)];
    }
    
    if (message.includes('tendencia') || message.includes('moda') || message.includes('atual') || message.includes('2025')) {
      return fashionResponses.tendencias[Math.floor(Math.random() * fashionResponses.tendencias.length)];
    }
    
    if (message.includes('acessorio') || message.includes('bolsa') || message.includes('sapato') || message.includes('joia')) {
      return fashionResponses.acessorios[Math.floor(Math.random() * fashionResponses.acessorios.length)];
    }

    // Respostas gerais
    const generalResponses = [
      'Interessante! Conte-me mais sobre seu estilo pessoal para eu poder te ajudar melhor. 💭',
      'Que tipo de ocasião você está se preparando? Trabalho, festa, casual? 🤔',
      'Posso te ajudar com combinações de cores, sugestões de looks ou dicas de estilo. O que você gostaria de saber? ✨',
      'Seu guarda-roupa tem mais peças básicas ou você gosta de ousar com estampas e cores? 🎨',
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simular delay da IA
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(textToSend),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => {
        const updatedMessages = [...prev, aiResponse];
        saveCurrentChat(updatedMessages);
        return updatedMessages;
      });
      setIsTyping(false);
    }, 1500);
  };

  const saveCurrentChat = (currentMessages: Message[]) => {
    if (currentMessages.length <= 1) return; // Não salvar se apenas mensagem inicial

    const chatTitle = currentMessages[1]?.text.slice(0, 30) + '...' || 'Nova conversa';
    const lastMessage = currentMessages[currentMessages.length - 1]?.text || '';

    const chat: ChatHistory = {
      id: currentChatId || Date.now().toString(),
      title: chatTitle,
      messages: currentMessages,
      lastMessage: lastMessage,
      timestamp: new Date(),
    };

    setChatHistory(prev => {
      const existingIndex = prev.findIndex(c => c.id === chat.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = chat;
        return updated;
      }
      return [chat, ...prev];
    });

    if (!currentChatId) {
      setCurrentChatId(chat.id);
    }
  };

  const startNewChat = () => {
    setMessages([{
      id: '1',
      text: 'Olá! Sou sua IA Finder, assistente de moda pessoal do LookFinder. Como posso te ajudar hoje? Posso sugerir looks, combinar peças, dar dicas de estilo ou responder qualquer dúvida sobre moda! 👗✨',
      isUser: false,
      timestamp: new Date(),
    }]);
    setCurrentChatId('');
    setShowHistory(false);
  };

  const loadChat = (chat: ChatHistory) => {
    setMessages(chat.messages);
    setCurrentChatId(chat.id);
    setShowHistory(false);
  };

  const deleteChat = (chatId: string) => {
    Alert.alert(
      'Excluir conversa',
      'Tem certeza que deseja excluir esta conversa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
            if (currentChatId === chatId) {
              startNewChat();
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const renderMessage = (message: Message, index: number) => (
    <Animatable.View
      key={message.id}
      animation="fadeInUp"
      delay={index * 100}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      {!message.isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        </View>
      )}
      
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.aiText,
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            message.isUser ? styles.userTime : styles.aiTime,
          ]}
        >
          {message.timestamp.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </Animatable.View>
  );

  const renderHistoryItem = ({ item }: { item: ChatHistory }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => loadChat(item)}
    >
      <View style={styles.historyContent}>
        <Text style={styles.historyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.historyLastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        <Text style={styles.historyTime}>
          {item.timestamp.toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteChat(item.id)}
      >
        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderQuickSuggestion = (suggestion: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.suggestionButton}
      onPress={() => sendMessage(suggestion)}
    >
      <Text style={styles.suggestionText}>{suggestion}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.aiInfo}>
            <View style={styles.aiAvatarLarge}>
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.aiName}>IA Finder</Text>
              <View style={styles.statusContainer}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.aiStatus}>Online • Especialista em estilo</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowHistory(true)}
            >
              <Ionicons name="time-outline" size={24} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={startNewChat}
            >
              <Ionicons name="add-outline" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => renderMessage(message, index))}
          
          {isTyping && (
            <Animatable.View
              animation="fadeIn"
              style={[styles.messageContainer, styles.aiMessage]}
            >
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.typingIndicator}>
                  <Animatable.View
                    animation="pulse"
                    iterationCount="infinite"
                    delay={0}
                    style={styles.typingDot}
                  />
                  <Animatable.View
                    animation="pulse"
                    iterationCount="infinite"
                    delay={200}
                    style={styles.typingDot}
                  />
                  <Animatable.View
                    animation="pulse"
                    iterationCount="infinite"
                    delay={400}
                    style={styles.typingDot}
                  />
                </View>
              </View>
            </Animatable.View>
          )}

          {/* Quick Suggestions */}
          {messages.length === 1 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Perguntas rápidas:</Text>
              <View style={styles.suggestionsGrid}>
                {quickSuggestions.map((suggestion, index) => renderQuickSuggestion(suggestion, index))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Pergunte sobre moda, estilo, looks..."
              placeholderTextColor="#999999"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? "#FFFFFF" : "#CCCCCC"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={styles.historyModal}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyHeaderTitle}>Histórico de Conversas</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHistory(false)}
            >
              <Ionicons name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          
          {chatHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="chatbubbles-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyHistoryText}>Nenhuma conversa ainda</Text>
              <Text style={styles.emptyHistorySubtext}>
                Suas conversas com a IA Finder aparecerão aqui
              </Text>
            </View>
          ) : (
            <FlatList
              data={chatHistory}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoryItem}
              style={styles.historyList}
              contentContainerStyle={styles.historyListContent}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiAvatarLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  aiStatus: {
    fontSize: 13,
    color: '#666666',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#1a1a1a',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  aiTime: {
    color: '#999999',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 2,
  },
  suggestionsContainer: {
    marginTop: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#1a1a1a',
  },
  sendButtonInactive: {
    backgroundColor: '#F0F0F0',
  },
  // History Modal Styles
  historyModal: {
    marginTop: 50,
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    padding: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  historyLastMessage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  historyTime: {
    fontSize: 12,
    color: '#999999',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
});