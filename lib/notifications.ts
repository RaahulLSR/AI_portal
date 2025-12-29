
export const sendEmailNotification = async (to: string, subject: string, body: string) => {
  console.log(`[Nexus Notify] Initiating ${to === 'admin' ? 'Admin Alert' : 'Customer Update'}...`);
  
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body })
    });

    const result = await response.json();

    if (!response.ok) {
      console.warn('[Nexus Notify] Server rejected the request:', result);
      return { 
        success: false, 
        error: result.error || 'Mail dispatch failed',
        details: result.details 
      };
    }

    console.log('[Nexus Notify] Transmission confirmed:', result.messageId);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Nexus Notify] Network or fatal error:', error);
    return { success: false, error: 'Network communication failure' };
  }
};
