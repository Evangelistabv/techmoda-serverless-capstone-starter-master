import { Package, ShoppingCart } from 'lucide-react';
import type { Product } from '../lib/types';
import { useRef, useState } from 'react';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  isAdmin?: boolean;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  isAdmin,
}: ProductCardProps) {
  const displayedDescription =
    product.aiDescription || product.description;

  const imageAlt =
    product.altText || product.aiAltText || product.name;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedVoice = useRef<{ url: string; expiresAt: number } | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');

  const playAudio = async () => {
    if (audioLoading) return;

    setAudioLoading(true);
    setAudioError('');

    try {
      let cached = cachedVoice.current;

      if (!cached || Date.now() >= cached.expiresAt) {
        const baseUrl = import.meta.env.VITE_VOICE_API_URL;

        if (!baseUrl) {
          throw new Error('Falta configurar VITE_VOICE_API_URL');
        }

        const response = await fetch(
          `${baseUrl.replace(/\/+$/, '')}/products/${encodeURIComponent(product.productId)}/voice`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lang: 'es' }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'No se pudo generar el audio');
        }

        if (typeof data.audioUrl !== 'string' || !data.audioUrl) {
          throw new Error('El servidor no devolvió audioUrl');
        }

        cached = {
          url: data.audioUrl,
          expiresAt:
            Date.now() + Math.max(0, (Number(data.expiresIn) || 3600) - 60) * 1000,
        };

        cachedVoice.current = cached;
      }

      const audio = audioRef.current;

      if (audio) {
        audio.src = cached.url;
        await audio.play();
      }
    } catch (error) {
      cachedVoice.current = null;
      setAudioError(
        error instanceof Error ? error.message : 'No se pudo reproducir el audio'
      );
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-xl">
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={imageAlt}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {product.name}
          </h3>

          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            {product.category}
          </span>
        </div>

        <p className="mb-2 text-sm text-gray-600">
          {displayedDescription}
        </p>

        {product.aiDescription && (
          <p className="mb-4 text-xs font-medium text-purple-600">
            Descripción generada con IA
          </p>
        )}

        <div className="mb-4">
          <button
            type="button"
            onClick={playAudio}
            disabled={audioLoading}
            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            {audioLoading ? 'Preparando audio…' : '🔊 escuchar'}
          </button>

          <audio ref={audioRef} controls preload="none" className="mt-2 w-full" />

          {audioError && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {audioError}
            </p>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>

          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Package className="h-4 w-4" />
            <span>{product.stock} disponibles</span>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit?.(product)}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Editar
            </button>

            <button
              type="button"
              onClick={() => onDelete?.(product.productId)}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={product.stock === 0}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium ${
              product.stock === 0
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
          </button>
        )}
      </div>
    </article>
  );
}