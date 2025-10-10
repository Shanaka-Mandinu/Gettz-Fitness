
import React, { useEffect, useState, useMemo } from "react";
import Header from "../../components/header";
import Footer from "../../components/footer";
import DefaultAvatar from "../../assets/default-avatar.png";

export default function UserDashboard() {
	const [user, setUser] = useState(null);
	const [inquiries, setInquiries] = useState([]);
	const [loadingInquiries, setLoadingInquiries] = useState(false);

	useEffect(() => {
		try {
			const token = localStorage.getItem("token");
			const userStr = localStorage.getItem("user");
			if (token && userStr) setUser(JSON.parse(userStr));
		} catch {
			setUser(null);
		}
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) return;
		setLoadingInquiries(true);
		fetch("/api/inquiry/user", {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => {
				setInquiries(Array.isArray(data) ? data : []);
				setLoadingInquiries(false);
			})
			.catch(() => setLoadingInquiries(false));
	}, [user]);

	const displayName = useMemo(() => {
		if (!user) return "Guest";
		if (user.firstName || user.lastName) {
			return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
		}
		if (user.name && typeof user.name === "string") return user.name;
		if (user.email && typeof user.email === "string") return user.email.split("@")[0];
		return "Member";
	}, [user]);

	const avatarSrc = useMemo(() => {
		if (user?.avatar && typeof user.avatar === "string" && user.avatar.startsWith("http")) return user.avatar;
		if (user?.profilePicture && typeof user.profilePicture === "string" && user.profilePicture.startsWith("http")) return user.profilePicture;
		if (user?.profilePicture && typeof user.profilePicture === "string") return user.profilePicture;
		if (user?.avatar && typeof user.avatar === "string") return user.avatar;
		return DefaultAvatar;
	}, [user]);

	// Placeholder stats, replace with real data if available
	const stats = [
		{ label: "Membership", value: user?.membershipStatus || "Active" },
		{ label: "Active Plan", value: user?.planName || "Standard" },
		{ label: "Joined", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-" },
	];

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Header />
			<main className="flex-1 flex flex-col items-center justify-center pt-28 pb-10 px-4">
				<div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6">
					<img
						src={avatarSrc}
						alt={displayName}
						className="h-28 w-28 rounded-full object-cover border-4 border-red-500 shadow"
						onError={e => { e.target.onerror = null; e.target.src = DefaultAvatar; }}
					/>
					<h2 className="text-2xl font-bold text-red-600">{displayName}</h2>
					<div className="w-full flex flex-col md:flex-row md:justify-between gap-4">
						<div className="flex-1">
							<div className="mb-2 text-gray-700"><span className="font-semibold">Email:</span> {user?.email || "-"}</div>
							<div className="mb-2 text-gray-700"><span className="font-semibold">Phone:</span> {user?.phone || "-"}</div>
							<div className="mb-2 text-gray-700"><span className="font-semibold">Member ID:</span> {user?._id || user?.id || "-"}</div>
						</div>
						<div className="flex-1 flex flex-col gap-2">
							{stats.map((s, i) => (
								<div key={i} className="bg-gray-100 rounded-lg px-4 py-2 flex items-center justify-between">
									<span className="font-medium text-gray-600">{s.label}</span>
									<span className="font-semibold text-gray-800">{s.value}</span>
								</div>
							))}
						</div>
					</div>
				</div>
				{/* User Inquiries Section */}
				<div className="w-full max-w-2xl mt-8 bg-white rounded-2xl shadow p-6">
					<h3 className="text-xl font-bold text-gray-800 mb-4">Your Inquiries</h3>
					{loadingInquiries ? (
						<div>Loading inquiries...</div>
					) : inquiries.length === 0 ? (
						<div className="text-gray-500">No inquiries found.</div>
					) : (
						<ul className="space-y-4">
							{inquiries.map((inq) => (
								<li key={inq._id} className="border rounded-lg p-4">
									<div className="font-semibold text-red-600">{inq.inquiry_type}</div>
									<div className="text-gray-700 mb-2">{inq.inquiry_message}</div>
									<div className="text-xs text-gray-400 mb-2">Sent: {new Date(inq.inquiry_date).toLocaleString()}</div>
									<div className="mt-2">
										<div className="font-semibold text-gray-700">Replies:</div>
										{inq.inquiry_response && inq.inquiry_response.length > 0 ? (
											<ul className="ml-4 mt-1 space-y-1">
												{inq.inquiry_response.map((resp, idx) => (
													<li key={idx} className="text-sm text-gray-800">
														<span className="font-medium">{resp.responder === "admin" ? "Admin" : "You"}:</span> {resp.message}
														<span className="ml-2 text-xs text-gray-400">{resp.date ? new Date(resp.date).toLocaleString() : ""}</span>
													</li>
												))}
											</ul>
										) : (
											<div className="text-gray-500">No replies yet.</div>
										)}
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</main>
			<Footer />
		</div>
	);
}
