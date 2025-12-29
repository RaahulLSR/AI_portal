
export const sendEmailNotification = async (to: string, subject: string, body: string) => {
  console.log(`[Nexus Notify] Dispatching to ${to}...`);
  
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body })
    });

    const result = await response.json();

    if (!response.ok) {
      // Log the full error to the console for developer visibility
      console.error('[Nexus Notify] Server-side error:', result);
      return { 
        success: false, 
        error: result.error || 'Mail dispatch failed',
        details: result.raw_error || 'No additional details'
      };
    }

    console.log('[Nexus Notify] Successfully delivered:', result.messageId);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Nexus Notify] Fetch error:', error);
    return { success: false, error: 'Network communication failure' };
  }
};
