import React, { useEffect, useRef, useState } from 'react';
import { Button, FlatList, KeyboardAvoidingView, StyleSheet, Text, TextInput, View } from 'react-native';
import { io, Socket } from 'socket.io-client';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://31.97.202.251:8888', {
      transports: ['websocket'],
    });

    // Handle incoming messages
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketRef.current.on('message', (response: string) => {
      setLoading(true);
      setTimeout(() => {
        addMessage(response, false);
        setLoading(false);
      }, 500); // simulate slight delay
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    socketRef.current.on('connect_error', (err) => {
      console.log('Connection error:', err);
      addMessage('⚠️ Connection error. Please try again.', false);
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        isUser,
      },
    ]);
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    // Add user message to UI immediately
    addMessage(inputText, true);

    // Send message to server
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', inputText);
    } else {
      addMessage('⚠️ Not connected to server', false);
    }

    setInputText('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0} enabled={true}>
      <View style={styles.container}>
        <Text style={{ textAlign: "center", color: "black", fontFamily: "nunito700", fontSize: 24, marginTop: 30, fontWeight: "bold" }}>VishwaAI</Text>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.message, item.isUser ? styles.userMessage : styles.botMessage]}>
              <Text>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={styles.messagesContainer}
        />
        {loading && (
          <Text style={{ textAlign: 'left', color: 'gray', fontStyle: 'italic', marginBottom: 8 }}>Bot is Thinking...</Text>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
          />
          <Button title="Send" onPress={handleSend} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  message: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECECEC',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
});

export default Index;