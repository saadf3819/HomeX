import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './colors';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getFirestore,
} from 'firebase/firestore';
import { app } from '../integrations/firebase';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ---------------------- Message Bubble Component ---------------------- */
const MessageBubble = ({ item, currentUserId }) => {
  const isMe = item.senderId === currentUserId;
  const messageTime = item.timestamp
    ? new Date(item.timestamp.toDate()).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : 'Pending';

  const getCheckIcon = () => (isMe ? (item.read ? 'checkmark-done' : 'checkmark') : null);
  const getCheckColor = () =>
    isMe && item.read ? COLORS.yellow : COLORS.darkGray;

  return (
    <View style={[styles.bubbleContainer, isMe && styles.myBubbleContainer]}>
      <LinearGradient
        colors={isMe ? [COLORS.blue, '#0066CC'] : [COLORS.white, COLORS.lightBlue]}
        style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}
        start={[0, 0]}
        end={[1, 0]}
      >
        <Text style={[styles.msgText, isMe && styles.myText]}>{item.text}</Text>
        <View style={styles.timeContainer}>
          <Text style={[styles.timestamp, isMe && styles.myTimestamp]}>
            {messageTime}
          </Text>
          {getCheckIcon() && (
            <Ionicons name={getCheckIcon()} size={14} color={getCheckColor()} />
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

/* ----------------------------- Main Screen ----------------------------- */
const ChatScreen = ({ navigation, route }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const flatListRef = useRef();

  const { user: chatPartner } = route.params || {};
  const chatPartnerId = chatPartner?.id;
  const chatPartnerName = chatPartner?.name || 'Chat User';

  const db = getFirestore(app);
  const auth = getAuth(app);

  /* ------------------- Get Current User ID (AsyncStorage) ------------------- */
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const storedId = await AsyncStorage.getItem('userid');
        if (storedId) {
          setCurrentUserId(storedId);
        } else {
          const firebaseUser = auth.currentUser;
          if (firebaseUser) setCurrentUserId(firebaseUser.uid);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };
    getCurrentUserId();
  }, []);

  /* ----------------------------- Fetch Messages ----------------------------- */
  useEffect(() => {
    if (!currentUserId || !chatPartnerId) {
      setLoading(false);
      return;
    }

    const chatId = [currentUserId, chatPartnerId].sort().join('_');
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const msgs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
        setLoading(false);

        // Mark unread messages as read
        const unreadMsgs = querySnapshot.docs.filter(
          (doc) => doc.data().receiverId === currentUserId && !doc.data().read
        );
        for (const msg of unreadMsgs) {
          await updateDoc(doc.ref, { read: true });
        }
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId, chatPartnerId]);

  /* -------------------------- Auto Scroll to Bottom -------------------------- */
  useEffect(() => {
    if (flatListRef.current && messages.length > 0 && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  /* ----------------------------- Send Message ----------------------------- */
  const sendMessage = async () => {
    if (!currentUserId || !chatPartnerId || !message.trim()) return;
    const chatId = [currentUserId, chatPartnerId].sort().join('_');
    const msgText = message.trim();

    try {
      setMessage('');
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderId: currentUserId,
        receiverId: chatPartnerId,
        text: msgText,
        timestamp: serverTimestamp(),
        read: false,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(msgText);
    }
  };

  /* ----------------------------- UI Rendering ----------------------------- */
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.blue, '#0066CC']}
        style={styles.header}
        start={[0, 0]}
        end={[1, 0]}
      >
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Image
              source={
                chatPartner?.image
                  ? { uri: chatPartner.image }
                  : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(chatPartnerName)}&background=random&size=200` }
              }
              style={styles.avatar}
            />
            <View>
              <Text style={styles.headerTitle}>{chatPartnerName}</Text>
              {chatPartner?.service && (
                <Text style={styles.headerSubtitle}>{chatPartner.service}</Text>
              )}
            </View>
          </View>

          {/* <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call-outline" size={22} color={COLORS.white} />
          </TouchableOpacity> */}
        </View>
      </LinearGradient>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble item={item} currentUserId={currentUserId} />
        )}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color={COLORS.darkGray} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        }
      />

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <LinearGradient
          colors={[COLORS.white, COLORS.lightBlue]}
          style={styles.inputContainer}
          start={[0, 0]}
          end={[1, 0]}
        >
   

          <TextInput
            style={styles.inputBox}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.darkGray}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <LinearGradient
              colors={message.trim() ? [COLORS.blue, '#0066CC'] : [COLORS.darkGray, COLORS.darkGray]}
              style={styles.sendGradient}
              start={[0, 0]}
              end={[1, 0]}
            >
              <Ionicons name="send" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
};

/* ----------------------------- Styles ----------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightBlue },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: COLORS.darkGray, marginTop: 10 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 45 : 25,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  backButton: { padding: 4 },
  callButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
    marginRight: 12,
  },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '600' },
  headerSubtitle: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  chatList: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    flexGrow: 1,
  },
  bubbleContainer: { marginVertical: 8, maxWidth: '80%' },
  myBubbleContainer: { alignSelf: 'flex-end' },
  bubble: {
    padding: 15,
    borderRadius: 20,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myBubble: { borderBottomRightRadius: 4 },
  otherBubble: { borderBottomLeftRadius: 4 },
  msgText: { fontSize: 16, color: COLORS.darkGray, lineHeight: 22 },
  myText: { color: COLORS.white },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  timestamp: { fontSize: 12, color: COLORS.darkGray, marginRight: 4 },
  myTimestamp: { color: COLORS.yellow },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.blue,
    backgroundColor: COLORS.white,
    elevation: 4,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  inputBox: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGray,
    maxHeight: 100,
    paddingVertical: 4,
    marginHorizontal: 10,
  },
  sendBtn: { borderRadius: 20, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.5 },
  sendGradient: {
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: COLORS.lightBlue,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.7,
    marginTop: 8,
  },
});

export default ChatScreen;
