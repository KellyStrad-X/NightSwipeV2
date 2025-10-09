/**
 * Retry Queue - S-901
 *
 * Queues failed API calls (especially swipes) and retries them when online
 * - Stores failed requests in memory
 * - Retries when network connection is restored
 * - Prevents data loss during temporary network issues
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@nightswipe_retry_queue';

class RetryQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.listeners = [];
  }

  /**
   * Load queue from AsyncStorage on app start
   */
  async loadQueue() {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(`📦 Loaded ${this.queue.length} items from retry queue`);
      }
    } catch (error) {
      console.error('❌ Error loading retry queue:', error);
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('❌ Error saving retry queue:', error);
    }
  }

  /**
   * Add item to queue
   * @param {Object} request - Request config { url, method, data, headers }
   */
  async add(request) {
    const queueItem = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      request,
      attempts: 0
    };

    this.queue.push(queueItem);
    await this.saveQueue();

    console.log(`📥 Added to retry queue:`, queueItem);
    this.notifyListeners();
  }

  /**
   * Process queue - retry all pending requests
   * @param {Function} apiClient - Axios instance or API client
   */
  async process(apiClient) {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing retry queue: ${this.queue.length} items`);

    const itemsToRetry = [...this.queue];
    const failedItems = [];

    for (const item of itemsToRetry) {
      try {
        const { url, method, data, headers } = item.request;

        console.log(`🔁 Retrying request: ${method} ${url}`);
        await apiClient({
          url,
          method,
          data,
          headers
        });

        console.log(`✅ Retry successful: ${method} ${url}`);

        // Remove from queue on success
        this.queue = this.queue.filter(q => q.id !== item.id);
      } catch (error) {
        console.error(`❌ Retry failed: ${item.request.method} ${item.request.url}`, error);

        // Increment attempts
        item.attempts++;

        // If too many attempts (>5), remove from queue
        if (item.attempts > 5) {
          console.log(`🗑️ Removing item after ${item.attempts} failed attempts`);
          this.queue = this.queue.filter(q => q.id !== item.id);
        } else {
          failedItems.push(item);
        }
      }
    }

    await this.saveQueue();
    this.isProcessing = false;
    this.notifyListeners();

    if (failedItems.length > 0) {
      console.log(`⚠️ ${failedItems.length} items still in retry queue`);
    } else {
      console.log(`✨ Retry queue is empty`);
    }
  }

  /**
   * Clear queue
   */
  async clear() {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Get queue size
   */
  size() {
    return this.queue.length;
  }

  /**
   * Add listener for queue changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * Notify all listeners of queue change
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.queue.length));
  }
}

// Singleton instance
const retryQueue = new RetryQueue();

export default retryQueue;
