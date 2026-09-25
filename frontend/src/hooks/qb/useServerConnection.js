// Hook لفحص اتصال الخادم
import { useState, useEffect } from 'react';
import { checkServerConnection } from '../services';

/**
 * Hook لفحص حالة اتصال الخادم
 */
export const useServerConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const connected = await checkServerConnection();
      setIsConnected(connected);
      setLastChecked(new Date());
    } catch (error) {
      setIsConnected(false);
      console.error('خطأ في فحص الاتصال:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // فحص اولي
    checkConnection();

    // فحص دوري كل 30 ثانية
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    isLoading,
    lastChecked,
    checkConnection,
  };
};

export default useServerConnection;