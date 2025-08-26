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
  orderId: string;
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

  const options: RazorpayOptions = {
    key: 'rzp_test_R7Y0EO9dkheiJ7', // Using the provided key
    amount: orderData.amount * 100, // Convert to paise
    currency: orderData.currency,
    name: 'ISTA Media',
    description: 'Event Registration Payment',
    order_id: orderData.orderId,
    handler: (response: any) => {
      console.log('Payment successful:', response);
      // Payment success will be handled by the calling component
      return response;
    },
    prefill: {
      name: orderData.customerDetails.name,
      email: orderData.customerDetails.email,
      contact: orderData.customerDetails.phone,
    },
    theme: {
      color: '#D4AF37', // Gold color matching the design
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