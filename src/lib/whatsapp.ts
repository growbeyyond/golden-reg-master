/**
 * WhatsApp utility functions for opening WhatsApp links
 * Uses wa.me format for better compatibility across devices and browsers
 */

const WHATSAPP_NUMBER = "919948999001"; // No + prefix for wa.me links

/**
 * Opens WhatsApp chat with the configured number
 */
export const openWhatsApp = (): void => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Opens WhatsApp chat with a pre-filled message
 * @param message - The message to pre-fill in WhatsApp
 */
export const openWhatsAppWithMessage = (message: string): void => {
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Generates a WhatsApp URL without opening it
 * Useful for creating links in JSX
 * @param message - Optional pre-filled message
 * @returns WhatsApp URL
 */
export const getWhatsAppUrl = (message?: string): string => {
  if (message) {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  }
  return `https://wa.me/${WHATSAPP_NUMBER}`;
};

/**
 * Gets the WhatsApp number for display purposes
 * @returns Formatted phone number
 */
export const getWhatsAppNumber = (): string => {
  return `+${WHATSAPP_NUMBER}`;
};