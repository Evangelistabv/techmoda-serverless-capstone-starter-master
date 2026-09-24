import type { ChatMessage, Product, SearchResult } from './types';

// Runtime environment configuration (injected at deployment time)
declare global {
  interface Window {
    __ENV?: {
      VITE_API_URL?: string;
    };
  }
}

// Get API URL from runtime config (priority) or build-time env variable
// Priority: window.__ENV (runtime) > import.meta.env (build-time) > fallback
//
// En el sandbox AWS re/Start NO hay API Gateway: la base es una Lambda Function
// URL (https://<id>.lambda-url.<region>.on.aws/). Esa URL termina en '/', así que
// la normalizamos quitando el slash final para que `${API_URL}/products` no genere
// un doble slash. (El router tolera el doble slash igual, pero mantenemos URLs limpias.)
const RAW_API_URL =
  window.__ENV?.VITE_API_URL ||
  import.meta.env.VITE_API_URL ||
  'https://your-function-url-id.lambda-url.us-east-1.on.aws';

const API_URL = RAW_API_URL.replace(/\/+$/, '');

const SEARCH_API_URL = (
  import.meta.env.VITE_SEARCH_API_URL ||
  'https://your-search-function-url.lambda-url.us-east-1.on.aws'
).replace(/\/+$/, '');

const ASSISTANT_API_URL = (
  import.meta.env.VITE_ASSISTANT_API_URL ||
  'https://your-assistant-function-url.lambda-url.us-east-1.on.aws'
).replace(/\/+$/, '');

// Log the API URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('API URL:', API_URL);
  console.log('Runtime config:', window.__ENV);
  console.log('Build-time config:', import.meta.env.VITE_API_URL);
}

export const api = {
  // List all products
  async listProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    // API returns {products: [...]}
    return data.products || [];
  },

  // Get a single product
  async getProduct(productId: string): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${productId}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  // Create a new product
  async createProduct(product: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Update a product
  async updateProduct(
    productId: string,
    updates: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete a product
  async deleteProduct(productId: string): Promise<void> {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  async semanticSearch(query: string): Promise<SearchResult[]> {
    const response = await fetch(
      `${SEARCH_API_URL}/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  },

  async askAssistant(
    message: string,
    history: ChatMessage[]
  ): Promise<string> {
    const response = await fetch(`${ASSISTANT_API_URL}/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.reply;
  },
};
