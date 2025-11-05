import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export const invoiceService = {
  // Get invoice by ID with enhanced error handling
  getInvoice: async (id) => {
    try {
      console.log("🔄 Fetching invoice with ID:", id);

      // Validate ID before making request
      if (!id || id === "undefined" || id === "null") {
        throw new Error("Invalid invoice ID");
      }

      const response = await api.get(`/invoices/${id}`);
      console.log("✅ Invoice API response received:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Invoice API error details:", {
        url: `/invoices/${id}`,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // Enhanced error message
      if (error.response?.status === 404) {
        throw new Error(
          "Invoice not found. It may have been deleted or the ID is incorrect."
        );
      } else if (error.response?.status === 400) {
        throw new Error("Invalid invoice ID format.");
      } else if (error.message === "Network Error") {
        throw new Error("Network error. Please check your connection.");
      } else {
        throw error;
      }
    }
  },

  // Get all invoices
  getAllInvoices: async () => {
    try {
      const response = await api.get("/invoices");
      return response;
    } catch (error) {
      console.error("Error fetching all invoices:", error);
      throw error;
    }
  },

  // Generate invoice for sale with payment details
  generateInvoice: async (saleId, paymentData = {}) => {
    try {
      const response = await api.post(
        `/invoices/generate/${saleId}`,
        paymentData
      );
      return response;
    } catch (error) {
      console.error("Error generating invoice:", error);
      throw error;
    }
  },

  // Update payment status
  updatePaymentStatus: async (invoiceId, paymentStatus) => {
    try {
      const response = await api.patch(
        `/invoices/${invoiceId}/payment-status`,
        {
          paymentStatus,
        }
      );
      return response;
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  },

  // Delete invoice
  deleteInvoice: async (invoiceId) => {
    try {
      const response = await api.delete(`/invoices/${invoiceId}`);
      return response;
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw error;
    }
  },
};

export default api;
