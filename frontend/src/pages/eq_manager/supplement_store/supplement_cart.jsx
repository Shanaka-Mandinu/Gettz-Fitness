import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

//format cunrrency
const fmtLKR = (num) => {
    const n = Number(num) || 0;
    try {
        return new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2,
        }).format(n);
    } catch {
        return `LKR ${n.toFixed(2)}`;
    }
};

const STORAGE_KEY = "supplement_cart_v2";

const getFirstImage = (supImage) => {
    if (Array.isArray(supImage) && supImage.length > 0) return supImage[0];
    if (typeof supImage === "string" && supImage) return supImage;
    return null;
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);


    const addItem = ({ product, quantity = 1 }) => {
        if (!product) return;

        const id = product.Sup_code;
        if (!id) return;


        // If product is out of stock, silently ignore the add
        if (product.Sup_status === "Out of stock") {
            return;
        }

        const maxQty = Number(product.Sup_quantity);
        const price = Number(product.Sup_price);

        setItems((curr) => {
            const idx = curr.findIndex((i) => i.id === id);
            if (idx > -1) {
                const next = [...curr];
                const newQty = Math.min(next[idx].qty + quantity, maxQty);
                next[idx] = { ...next[idx], qty: newQty };
                if (newQty === next[idx].qty) {
                    // toast.success("Added Item to Cart");
                }
                return next;
            }

            const line = {
                id,
                Sup_code: product.Sup_code,
                name: product.Sup_name || "Unknown",
                type: product.Sup_type || "",
                price,
                status: product.Sup_status,
                stock: maxQty,
                supplier: product.Sup_supplier || "",
                image: getFirstImage(product.Sup_image),
                qty: Math.min(quantity, maxQty),
            };

            if (line.qty < quantity) {
                toast.error("Only limited stock available. Added the maximum allowed.");
            }
            return [line, ...curr];
        });
    };

    const removeItem = (id) => {
        setItems((curr) => curr.filter((i) => i.id !== id));
        toast.success("Item removed");
    };


    const updateQty = (id, qty) => {
        setItems((curr) =>
            curr.map((i) => {
                if (i.id !== id) return i;
                const max = Number.isFinite(i.stock) ? i.stock : Infinity;
                const nextQty = Math.max(1, Math.min(Number(qty) || 1, max));
                return { ...i, qty: nextQty };
            })
        );
    };

    const clearCart = () => {
        setItems([])
        toast.success("All items removed");
    };

    const clearCartSilently = () => {
        setItems([]);
    };

    const subtotal = useMemo(
        () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
        [items]
    );

    const value = {
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        clearCartSilently,
        subtotal,
        count: items.reduce((n, i) => n + i.qty, 0),
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
    return ctx;
}

export default function SupplementCart() {
    const { items, removeItem, updateQty, clearCart, subtotal } = useCart();
    const navigate = useNavigate();

    if (!items.length) {
        return (
            <div className="bg-white border border-gray-200 shadow-sm p-55 text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Your cart is empty</h3>
                <p className="text-gray-500 mt-1">Add some supplements to get started.</p>
            </div>
        );
    }

    return (
        <div className="bg-white  border border-gray-200 shadow-sm p-6 w-full min-h-[600px] sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Cart</h2>

            <ul className="divide-y divide-gray-200">
                {items.map((item) => (
                    <li key={item.id} className="py-4 sm:py-5 flex items-center gap-4">

                        <div className="w-20 h-20 shrink-0 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            ) : (
                                <span className="text-xs text-gray-400">No Image</span>
                            )}
                        </div>

                        {/* info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 leading-tight line-clamp-2">
                                    {item.name}
                                </p>

                            </div>
                            {item.type && (
                                <p className="text-sm text-gray-500 mt-0.5">{item.type}</p>
                            )}
                            {item.supplier && (
                                <p className="text-xs text-gray-500">Supplier: {item.supplier}</p>
                            )}


                            <div className="mt-1 flex items-center gap-2">
                                {item.status === "Out of stock" ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Out of stock
                                    </span>
                                ) : (
                                    <span className="text-xs text-green-600 font-medium">In stock</span>
                                )}
                                {Number.isFinite(item.stock) && (
                                    <span className="text-xs text-gray-500">• {item.stock} available</span>
                                )}
                            </div>

                            <p className="text-sm font-medium text-gray-900 mt-2">
                                {fmtLKR(item.price)} <span className="text-gray-500">/ unit</span>
                            </p>
                        </div>


                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => updateQty(item.id, Math.max(1, (item.qty || 1) - 1))}
                                className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center active:scale-95 disabled:opacity-50"
                                aria-label="Decrease"
                                disabled={item.status === "Out of stock"}
                            >
                                <Minus className="w-4 h-4 text-gray-700" />
                            </button>
                            <input
                                className="w-14 text-center font-semibold text-gray-900 border border-gray-200 rounded-lg py-2 px-2 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={item.qty}
                                onChange={(e) => {
                                    const v = Number(e.target.value.replace(/\D/g, ""));
                                    updateQty(item.id, v > 0 ? v : 1);
                                }}
                                disabled={item.status === "Out of stock"}
                            />
                            <button
                                type="button"
                                onClick={() => updateQty(item.id, (item.qty || 1) + 1)}
                                className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center active:scale-95 disabled:opacity-50"
                                aria-label="Increase"
                                disabled={
                                    item.status === "Out of stock" ||
                                    (Number.isFinite(item.stock) && item.qty >= item.stock)
                                }
                                title={
                                    Number.isFinite(item.stock) && item.qty >= item.stock
                                        ? "Reached available stock"
                                        : undefined
                                }
                            >
                                <Plus className="w-4 h-4 text-gray-700" />
                            </button>
                        </div>

                        {/*total*/}
                        <div className="w-24 text-right font-semibold text-gray-900">
                            {fmtLKR(item.price * item.qty)}
                        </div>


                        <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="ml-2 p-2 rounded-lg hover:bg-red-50 active:scale-95"
                            aria-label="Remove item"
                            title="Remove item"
                        >
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                    </li>
                ))}
            </ul>

            {/* footer */}
            <div className="mt-6 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={clearCart}
                    className="px-4 py-2 rounded-lg border border-red-700 text-gray-700 hover:bg-gray-50 active:scale-95"
                >
                    Clear Cart
                </button>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Subtotal</p>
                        <p className="text-xl font-bold text-gray-900">{fmtLKR(subtotal)}</p>
                    </div>
                    <button
                        type="button"
                        className="w-full bg-red-700 md:hover:orange-200 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg md:hover:shadow-xl "
                        onClick={() => navigate("/supplement/checkout", { state: { cart: items } })}
                    >
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}

