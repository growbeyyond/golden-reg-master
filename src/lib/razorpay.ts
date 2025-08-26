declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async (orderData: {
  amount: number;
  currency: string;
  razorpayOrderId: string;
  key: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
}): Promise<any> => {
  const scriptLoaded = await loadRazorpayScript();
  
  if (!scriptLoaded) {
    throw new Error('Failed to load Razorpay SDK');
  }

  console.log('=== RAZORPAY PAYMENT SETUP ===');
  console.log('Amount received (paise):', orderData.amount);
  console.log('Amount in INR:', orderData.amount / 100);
  console.log('Key:', orderData.key ? `${orderData.key.substring(0, 8)}...` : 'MISSING');
  console.log('Order ID:', orderData.razorpayOrderId);

  const options: RazorpayOptions = {
    key: orderData.key,
    amount: orderData.amount, // Amount in paise from server
    currency: orderData.currency,
    name: 'ISTA Media',
    description: 'Event Registration Payment',
    order_id: orderData.razorpayOrderId, // Use razorpayOrderId
    handler: (response: any) => {
      console.log('Payment successful:', response);
      return response;
    },
    prefill: {
      name: orderData.customerDetails.name,
      email: orderData.customerDetails.email,
      contact: orderData.customerDetails.phone,
    },
    theme: {
      color: '#D4AF37',
    },
    modal: {
      ondismiss: () => {
        console.log('Payment modal dismissed');
      },
    },
  };

  return new Promise((resolve, reject) => {
    try {
      const razorpay = new window.Razorpay({
        ...options,
        handler: (response: any) => {
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          },
        },
      });
      
      razorpay.open();
    } catch (error) {
      reject(error);
    }
  });
};