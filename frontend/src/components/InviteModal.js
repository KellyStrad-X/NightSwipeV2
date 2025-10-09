import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';

/**
 * InviteModal - S-402
 *
 * Host invite modal showing:
 * - Host profile info
 * - Shareable join link
 * - Copy link button
 * - Share button (native share sheet)
 * - Close button
 *
 * Props:
 * - visible: boolean
 * - onClose: () => void
 * - onInviteSent: () => void
 * - sessionData: { session_id, join_code, session_url }
 * - hostProfile: { display_name }
 */
export default function InviteModal({
  visible,
  onClose,
  onInviteSent,
  sessionData,
  hostProfile
}) {
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleCopyLink = async () => {
    try {
      setCopying(true);
      await Clipboard.setStringAsync(sessionData.session_url);
      Alert.alert('Link Copied!', 'Invite link has been copied to clipboard');
      console.log('📋 Link copied:', sessionData.session_url);
    } catch (error) {
      console.error('Failed to copy link:', error);
      Alert.alert('Error', 'Failed to copy link to clipboard');
    } finally {
      setCopying(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Share Not Available',
          'Sharing is not available on this device. Please copy the link instead.'
        );
        return;
      }

      // Create shareable message
      const message = `Join me on NightSwipe!\n\n${sessionData.session_url}`;

      // For now, we'll use clipboard + alert
      // TODO: Create a temporary file or use different sharing method
      await Clipboard.setStringAsync(message);
      Alert.alert(
        'Ready to Share',
        'Invite message copied! You can now paste it into your messaging app.',
        [
          { text: 'OK', onPress: () => {
            onInviteSent();
            onClose();
          }}
        ]
      );

      console.log('📤 Invite shared:', sessionData.session_url);
    } catch (error) {
      console.error('Failed to share link:', error);
      Alert.alert('Error', 'Failed to share link');
    } finally {
      setSharing(false);
    }
  };

  if (!sessionData) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Invite Someone</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Host Info */}
          <View style={styles.hostInfo}>
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileEmoji}>👤</Text>
            </View>
            <View>
              <Text style={styles.hostLabel}>Session Host</Text>
              <Text style={styles.hostName}>{hostProfile?.display_name || 'You'}</Text>
            </View>
          </View>

          {/* Join Link Display */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkLabel}>Share this link:</Text>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>
                {sessionData.session_url}
              </Text>
            </View>
            <Text style={styles.joinCodeHint}>
              Join Code: <Text style={styles.joinCode}>{sessionData.join_code}</Text>
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.copyButton]}
              onPress={handleCopyLink}
              disabled={copying}
            >
              {copying ? (
                <ActivityIndicator color="#6200ee" size="small" />
              ) : (
                <>
                  <Text style={styles.copyButtonText}>📋 Copy Link</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={handleShare}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.shareButtonText}>📤 Share Invite</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Hint Text */}
          <Text style={styles.hint}>
            Once you send the invite, you'll be taken to the lobby to wait for your guest.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: '#888',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  profilePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileEmoji: {
    fontSize: 32,
  },
  hostLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  hostName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  linkContainer: {
    marginBottom: 24,
  },
  linkLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  linkBox: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#6200ee',
    fontFamily: 'monospace',
  },
  joinCodeHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  joinCode: {
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  copyButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  copyButtonText: {
    color: '#6200ee',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#6200ee',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
