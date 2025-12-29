
export const sendEmailNotification = async (to: string, subject: string, body: string) => {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body })
    });
    if (!response.ok) {
      const err = await response.json();
      console.error('Notification Error:', err);
    }
  } catch (error) {
    console.error('Failed to trigger notification:', error);
  }
};
