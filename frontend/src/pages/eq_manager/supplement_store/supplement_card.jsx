import { useState, useMemo } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Supplement_card({ product, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);


    const priceNumber = typeof product?.Sup_price === 'number' ? product.Sup_price : 0;
    const priceText = useMemo(() => {
        try {
            return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(priceNumber);
        } catch {

            return `LKR ${priceNumber.toFixed(2)}`;
        }
    }, [priceNumber]);

    const isOutOfStock = product?.Sup_status === 'Out of stock' || (Number(product?.Sup_quantity || 0) <= 0);

    const handleAdd = () => {
        if (isOutOfStock) return; 
        if (typeof onAddToCart === 'function') {
            onAddToCart({ product, quantity });
            toast.success("Item added to your cart!");
        }
    };

    return (
        <div
            className="w-full max-w-full sm:max-w-sm md:max-w-md lg:max-w-sm mx-auto bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 md:hover:scale-[1.02] md:hover:shadow-2xl"
            role="region"
            aria-label={product?.Sup_name || 'Supplement'}
        >
            {/* {img view} */}
            <div className="relative group">
                <img
                    src={product?.Sup_image}
                    alt={product?.Sup_name || 'Supplement image'}
                    className="w-full aspect-[4/3] object-contain bg-gray-50 transition-transform duration-500 md:group-hover:scale-110"
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, 400px"
                />

                
            </div>
            {/* {info} */}
            <div className="p-4 sm:p-6">
                {product?.Sup_type && (
                    <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1 sm:mb-2">
                        {product.Sup_type}
                    </p>
                )}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mb-2 sm:mb-4 line-clamp-2">
                    {product?.Sup_name || 'Unknown Product'}
                </h3>
                <div className="mb-3 sm:mb-4">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">{priceText}</span>
                </div>
                <div className="mb-4 sm:mb-6">
                    <label htmlFor="qty" className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                    </label>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 active:scale-95 transition md:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            aria-label="Decrease quantity"
                        >
                            −
                        </button>
                        <input
                            id="qty"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-16 text-center font-semibold text-gray-900 border border-gray-200 rounded-lg py-2 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            value={quantity}
                            onChange={(e) => {
                                const v = Number(e.target.value.replace(/\D/g, ''));
                                setQuantity(Number.isFinite(v) && v > 0 ? v : 1);
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => q + 1)}
                            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 active:scale-95 transition md:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            aria-label="Increase quantity"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* {add to cart btn} */}
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                    className={`w-full ${isOutOfStock ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-700 to-red-500 md:hover:from-red-400 md:hover:to-red-600 text-white'} font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${isOutOfStock ? '' : 'shadow-lg md:hover:shadow-xl'}`}
                >
                    <ShoppingCart className={`w-5 h-5 ${isOutOfStock ? 'text-gray-400' : ''}`} />
                    <span className="text-sm sm:text-base">{isOutOfStock ? 'Out of stock' : 'Add to Cart'}</span>
                </button>
            </div>
        </div>
    );
}
