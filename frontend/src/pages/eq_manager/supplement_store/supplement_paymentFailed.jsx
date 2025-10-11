export default function SupplementPaymentFailed() {
  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center bg-white text-gray-900">
      <img src="https://cdn-icons-png.flaticon.com/512/463/463612.png" alt="Payment failed" className="w-32 h-32 mb-6" />
      <h1 className="text-2xl font-bold text-red-700 mb-2">Payment Failed</h1>
      <p className="mb-4">Unfortunately, your supplement payment could not be processed.</p>
      <a href="/cart" className="mt-4 inline-block rounded-lg bg-red-600 text-white px-6 py-2 font-semibold hover:bg-red-700">Back to Cart</a>
    </div>
  );
}
