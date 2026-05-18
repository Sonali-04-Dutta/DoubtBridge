export const razorpayTestOptions = {
  method: {
    upi: true,
    netbanking: true,
    card: true,
    wallet: true,
    paylater: true,
    emi: true
  },

  retry: {
    enabled: true,
    max_count: 3
  }
};