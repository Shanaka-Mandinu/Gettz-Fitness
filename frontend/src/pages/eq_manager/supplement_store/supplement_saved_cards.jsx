import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const last4 = (num) => String(num ?? "").slice(-4);
const mask = (num) => `•••• •••• •••• ${last4(num)}`;

export default function SupplementSavedCards() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      const token = localStorage.getItem("token");
      axios
        .get(import.meta.env.VITE_BACKEND_URL + "/api/card/", {
          headers: {
            Authorization: "Bearer " + token,
          },
        })
        .then((response) => {
          setCards(response.data);
          setLoaded(true);
        });
    }
  }, [loaded]);

  // When user selects a card, go back to supplement checkout with card details and cart/amount state
  function useThisCard(card) {
    navigate("/supplement/checkout", {
      state: {
        ...location.state,
        cards: card,
      },
    });
  }

  return (
    <div className="min-h-[505px] bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Saved cards</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your payment methods for supplement checkout.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate("/cards/new")}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Add new card
            </button>
          </div>
        </div>
        {cards.length === 0 && loaded && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
            No saved cards yet. Click <span className="font-medium">Add new card</span> to get started.
          </div>
        )}
        {cards.map((card, index) => (
          <div key={index} className="space-y-3 mt-2">
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
                  {card.card_id}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{mask(card.card_number)}</p>
                  <p className="text-sm text-gray-600">
                    {card.card_name} — Expires {card.expiry_date}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => useThisCard(card)}
                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 cursor-pointer"
                >
                  Use This Card
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loaded && (
          <div className="flex items-center justify-center h-[400px] w-full">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}
