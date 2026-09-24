import { FormEvent, useState } from 'react';
import { Store, Settings, Search, Plus, Loader2 } from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { useProducts } from './hooks/useProducts';
import { ChatWidget } from './components/ChatWidget';
import { api } from './lib/api';
import type { Product, SearchResult } from './lib/types';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [semanticResults, setSemanticResults] = useState<SearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts();

  const handleSaveProduct = async (productData: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      const result = await updateProduct(editingProduct.productId, productData);
      if (result.success) {
        setEditingProduct(undefined);
      } else {
        alert(result.error);
      }
    } else {
      const result = await createProduct(productData);
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      const result = await deleteProduct(productId);
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };
  const handleSemanticSearch = async (event: FormEvent) => {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) {
      setSemanticResults(null);
      setSearchError('');
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    try {
      const results = await api.semanticSearch(query);
      setSemanticResults(results);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : 'Falló la búsqueda semántica'
      );
    } finally {
      setSearchLoading(false);
    }
  };
  const semanticPositions = new Map(
    (semanticResults || []).map((result, index) => [
      result.productId,
      index,
    ])
  );

  const filteredProducts = products
    .filter((product) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();

      // Antes de ejecutar la búsqueda semántica, conserva el filtro local
      // que esperan los tests existentes.
      const matchesLocalSearch =
        semanticResults !== null ||
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        product.aiDescription?.toLowerCase().includes(normalizedSearch);

      // Después de ejecutar la búsqueda semántica, usa los IDs
      // devueltos por GET /search?q=.
      const matchesSemanticSearch =
        semanticResults === null ||
        semanticPositions.has(product.productId);

      const matchesCategory =
        categoryFilter === 'Todos' ||
        product.category === categoryFilter;

      return (
        matchesLocalSearch &&
        matchesSemanticSearch &&
        matchesCategory
      );
  })
  .sort((a, b) => {
    if (semanticResults === null) return 0;

    return (
      (semanticPositions.get(a.productId) ?? Number.MAX_SAFE_INTEGER) -
      (semanticPositions.get(b.productId) ?? Number.MAX_SAFE_INTEGER)
    );
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TechModa</h1>
                <p className="text-sm text-gray-500">Catálogo de Productos</p>
              </div>
            </div>
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isAdmin
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              {isAdmin ? 'Modo Cliente' : 'Modo Admin'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <form onSubmit={handleSemanticSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  type="search"
                  placeholder="Buscar productos por significado..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);

                    if (!event.target.value.trim()) {
                      setSemanticResults(null);
                      setSearchError('');
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={searchLoading}
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {searchLoading ? 'Buscando…' : 'Buscar con IA'}
              </button>

              {semanticResults !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSemanticResults(null);
                    setSearchError('');
                  }}
                  className="rounded-lg border px-4 py-3 text-gray-700 hover:bg-gray-50"
                >
                  Limpiar
                </button>
              )}
            </form>
            {searchError && (<p role="alert" className="mt-2 text-sm text-red-600">{searchError}</p>
                )}
                {semanticResults !== null && !searchError && (
                  <p className="mt-2 text-sm text-gray-500" aria-live="polite">
                    {semanticResults.length} resultados ordenados por relevancia semántica.
                  </p>
                )}
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="Todos">Todas las Categorías</option>
              <option value="Ropa">Ropa</option>
              <option value="Zapatos">Zapatos</option>
              <option value="Accesorios">Accesorios</option>
            </select>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              <Plus className="w-5 h-5" />
              Agregar Nuevo Producto
            </button>
          )}
        </div>

        {loading ? (
          // role="status" + aria-live: un lector de pantalla anuncia la carga.
          <div role="status" aria-live="polite" className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-hidden="true" />
            <span className="sr-only">Cargando productos…</span>
          </div>
        ) : error ? (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error: {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-500">
              {searchTerm || categoryFilter !== 'Todos'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Agrega productos para comenzar'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
<ChatWidget />
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            TechModa © 2024 - E-commerce de Moda Serverless
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
