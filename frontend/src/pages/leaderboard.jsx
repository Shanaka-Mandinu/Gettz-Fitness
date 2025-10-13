import React, { useEffect, useState } from "react";
import Header from "../components/header";
import { Crown, Award, User } from "lucide-react";

const API = "http://localhost:3000/api/leaderboard";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLeaders(data);
      } catch (e) {
        console.error("Failed to load leaderboard:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <header className="mt-1 border-b border-gray-200 bg-transparent">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h1 className="text-4xl font-extrabold flex items-center justify-center gap-2 bg-gradient-to-r from-[#e30613] to-red-600 text-transparent bg-clip-text">
            <Crown className="text-yellow-400 drop-shadow" size={36} /> Leaderboard
          </h1>
          <p className="mt-2 text-lg text-gray-700 font-medium">
            Track the top performers and climb your way up!
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-10 text-center text-gray-600">
            <p className="text-lg">No leaderboard entries yet. Start earning points to appear here!</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-rose-200 shadow-xl bg-white/90 backdrop-blur">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-[#e30613] to-red-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white align-middle">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white align-middle">Member</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white align-middle">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-white align-middle">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/80">
                {leaders.map((row, idx) => {
                  // Medal and color for top 3
                  let rankIcon = null;
                  let rowClass = "";
                  if (idx === 0) {
                    rankIcon = <Award className="text-yellow-400 inline-block mr-1" size={20} title="1st" />;
                    rowClass = "bg-yellow-50 font-bold shadow-sm";
                  } else if (idx === 1) {
                    rankIcon = <Award className="text-gray-400 inline-block mr-1" size={20} title="2nd" />;
                    rowClass = "bg-gray-50 font-semibold";
                  } else if (idx === 2) {
                    rankIcon = <Award className="text-amber-700 inline-block mr-1" size={20} title="3rd" />;
                    rowClass = "bg-amber-50 font-semibold";
                  } else {
                    rowClass = "hover:bg-rose-50 transition";
                  }
                  return (
                    <tr key={row._id} className={rowClass + " align-middle"} style={{height: '90px'}}>
                      <td className="px-6 py-4 text-lg text-gray-800 align-middle">
                        <div className="flex items-center gap-1 h-full">{rankIcon}#{idx + 1}</div>
                      </td>
                      <td className="px-6 py-4 text-base text-gray-900 align-middle">
                        <div className="flex items-center gap-3 h-full">
                          {/* Avatar circle with initials */}
                          <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-rose-200 to-red-200 text-xl font-bold text-white shadow">
                            {row.user_id?.firstName?.[0] || ''}{row.user_id?.lastName?.[0] || ''}
                          </span>
                          <span className="font-semibold">
                            {row.user_id?.firstName} {row.user_id?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-base text-gray-600 align-middle font-medium">
                        <div className="h-full flex items-center">{row.user_id?.createdAt ? new Date(row.user_id.createdAt).toLocaleDateString() : "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-xl font-extrabold text-[#e30613] align-middle">
                        <div className="h-full flex items-center justify-end">{row.user_id?.point}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
