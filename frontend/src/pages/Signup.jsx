import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Calendar, Ruler, Weight, Image as ImageIcon
} from "lucide-react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import mediaUpload from "../utils/mediaUpload";

import loginBg from "../assets/loging.jpg";
import GymLogo from "../assets/GymLogo.jpg";

export default function SignupPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    phone: "",
    height: "",
    weight: "",
    dob: "",
    profilePicture: "",   // optional URL
    role: "user",
  });

  // image files + previews
  const [profileFiles, setProfileFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // previews
  useEffect(() => {
    if (!profileFiles.length) { setPreviews([]); return; }
    const urls = Array.from(profileFiles).map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [profileFiles]);

  // BMI
  const bmi = useMemo(() => {
    const h = parseFloat(form.height) / 100;
    const w = parseFloat(form.weight);
    if (!h || !w) return 0;
    const v = w / (h * h);
    return Number.isFinite(v) ? Number(v.toFixed(1)) : 0;
  }, [form.height, form.weight]);

  // password strength
  const pw = form.password || "";
  const pwScore = useMemo(() => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 5);
  }, [pw]);
  const strengthLabel = ["Very weak", "Weak", "Okay", "Strong", "Very strong"][Math.max(0, pwScore - 1)] || "Very weak";
  const strengthClass =
    pwScore <= 1 ? "bg-red-500" :
    pwScore === 2 ? "bg-orange-500" :
    pwScore === 3 ? "bg-yellow-500" :
    pwScore === 4 ? "bg-lime-500" : "bg-emerald-600";

  // per-field validation
  const validateField = (name, value, current = form) => {
    switch (name) {
      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email";
        return "";
      case "firstName":
        return value ? "" : "First name is required";
      case "lastName":
        return value ? "" : "Last name is required";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Minimum 8 characters";
        return "";
      case "confirmPassword":
        if (!value) return "Confirm your password";
        if (value !== current.password) return "Passwords do not match";
        return "";
      case "phone":
        if (!value) return "Phone is required";
        if (!/^[0-9+\-()\s]{7,}$/.test(value)) return "Enter a valid phone number";
        return "";
      case "height":
        if (!value) return "Height is required";
        if (isNaN(Number(value)) || Number(value) <= 0) return "Enter a valid height in cm";
        return "";
      case "weight":
        if (!value) return "Weight is required";
        if (isNaN(Number(value)) || Number(value) <= 0) return "Enter a valid weight in kg";
        return "";
      case "dob":
        if (!value) return "Date of birth is required";
        if (new Date(value) > new Date()) return "DOB cannot be in the future";
        return "";
      default:
        return "";
    }
  };

  const validateAll = (data = form) => {
    const names = ["email","firstName","lastName","password","confirmPassword","phone","height","weight","dob"];
    const e = {};
    names.forEach(n => {
      const msg = validateField(n, data[n], data);
      if (msg) e[n] = msg;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => {
      const next = { ...f, [name]: value };
      // live validate the changed field
      setErrors(prev => ({ ...prev, [name]: validateField(name, value, next) }));
      return next;
    });
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (loading) return;
    if (!validateAll()) return;

    try {
      setLoading(true);

      // Prefer uploaded file; else URL
      let profilePictureUrl = form.profilePicture?.trim() || "";
      if (profileFiles.length > 0) {
        const f = profileFiles[0];
        // guard: only images up to ~5MB
        if (!/^image\//.test(f.type)) throw new Error("Please select an image file");
        if (f.size > 5 * 1024 * 1024) throw new Error("Image too large (max 5MB)");
        const uploaded = await mediaUpload(f);
        profilePictureUrl = uploaded?.url || uploaded?.secure_url || uploaded;
      }

      const payload = {
        email: form.email.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
        phone: form.phone.trim(),
        height: String(form.height),
        weight: String(form.weight),
        dob: form.dob,
        profilePicture: profilePictureUrl || undefined,
        role: form.role || "user",
        bmi,
        point: 0,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/register`,
        payload
      );
      const data = res?.data ?? {};
      const ok = data.success === true || data.user || data._id ||
        /succ(e)?ss|sucess|saved|created/i.test(String(data.message || ""));

      if (ok) {
        toast.success(data.message || "Account created successfully");
        setForm({
          email: "", firstName: "", lastName: "", password: "", confirmPassword: "",
          phone: "", height: "", weight: "", dob: "", profilePicture: "", role: "user",
        });
        setProfileFiles([]); setPreviews([]);
        navigate("/login", { replace: true });
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-black grid grid-cols-1 lg:grid-cols-2">
      {/* Left */}
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
        <img src={loginBg} alt="Gym Background" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 text-center text-white bg-black/40 p-10 rounded-3xl">
          <img src={GymLogo} alt="Gettz Fitness Logo" className="mx-auto h-20 mb-6 rounded-full shadow-lg" />
          <h1 className="text-4xl font-bold tracking-tight">Join Gettz Health & Fitness</h1>
          <p className="mt-3 text-lg opacity-90">Create your account to start your journey.</p>
        </div>
      </div>

      {/* Right */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center justify-center p-6 sm:p-10 bg-white"
      >
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center lg:hidden">
            <img src={GymLogo} alt="Gettz Fitness Logo" className="mx-auto h-16 mb-4" />
            <h2 className="text-2xl font-semibold tracking-tight text-red-600">Create your account</h2>
            <p className="text-sm text-gray-600">It takes less than a minute.</p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Email</label>
                <div className={`mt-1 group relative flex items-center rounded-xl border px-3 py-2 focus-within:ring-2 ${
                  errors.email && touched.email ? "border-red-500 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-red-200"
                }`}>
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  <input name="email" type="email" value={form.email} onChange={onChange} onBlur={onBlur}
                    placeholder="you@gettz.fit" className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-gray-400" />
                </div>
                {touched.email && errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Names */}
              <div>
                <label className="block text-sm font-medium">First name</label>
                <div className={`mt-1 flex items-center rounded-xl border px-3 py-2 focus-within:ring-2 ${
                  errors.firstName && touched.firstName ? "border-red-500 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-red-200"
                }`}>
                  <User className="mr-2 h-4 w-4 text-gray-400" />
                  <input name="firstName" value={form.firstName} onChange={onChange} onBlur={onBlur}
                    placeholder="John" className="w-full bg-transparent py-1.5 text-sm outline-none" />
                </div>
                {touched.firstName && errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Last name</label>
                <div className={`mt-1 flex items-center rounded-xl border px-3 py-2 focus-within:ring-2 ${
                  errors.lastName && touched.lastName ? "border-red-500 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-red-200"
                }`}>
                  <User className="mr-2 h-4 w-4 text-gray-400" />
                  <input name="lastName" value={form.lastName} onChange={onChange} onBlur={onBlur}
                    placeholder="Doe" className="w-full bg-transparent py-1.5 text-sm outline-none" />
                </div>
                {touched.lastName && errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium">Password</label>
                <div className={`mt-1 group relative flex items-center rounded-xl border px-3 py-2 focus-within:ring-2 ${
                  errors.password && touched.password ? "border-red-500 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-red-200"
                }`}>
                  <Lock className="mr-2 h-4 w-4 text-gray-400" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="At least 8 characters"
                    className="w-full bg-transparent py-1.5 text-sm outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="ml-2 inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {touched.password && errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}

                {/* strength meter */}
                <div className="mt-2">
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div className={`h-2 ${strengthClass}`} style={{ width: `${(pwScore/5)*100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-600">Strength: {strengthLabel}</p>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium">Confirm password</label>
                <div className={`mt-1 group relative flex items-center rounded-xl border px-3 py-2 focus-within:ring-2 ${
                  errors.confirmPassword && touched.confirmPassword ? "border-red-500 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-red-200"
                }`}>
                  <Lock className="mr-2 h-4 w-4 text-gray-400" />
                  <input
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="Re-enter password"
                    className="w-full bg-transparent py-1.5 text-sm outline-none"
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)}
                    className="ml-2 inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <div className={`mt-1 flex items-center rounded-xl border px-3 py-2 focus-within:ring-2 ${
                  errors.phone && touched.phone ? "border-red-500 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-red-200"
                }`}>
                  <Phone className="mr-2 h-4 w-4 text-gray-400" />
                  <input name="phone" value={form.phone} onChange={onChange} onBlur={onBlur}
                    placeholder="07xxxxxxxx" className="w-full bg-transparent py-1.5 text-sm outline-none" />
                </div>
                {touched.phone && errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* Height / Weight */}
              <div>
                <label className="block text-sm font-medium">Height (cm)</label>
                <div className={`mt-1 flex items-center rounded-xl border px-3 py-2 focus-within:ring-2 ${
                  errors.height && touched.height ? "border-red-500 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-red-200"
                }`}>
                  <Ruler className="mr-2 h-4 w-4 text-gray-400" />
                  <input name="height" value={form.height} onChange={onChange} onBlur={onBlur}
                    placeholder="170" className="w-full bg-transparent py-1.5 text-sm outline-none" />
                </div>
                {touched.height && errors.height && <p className="text-xs text-red-500 mt-1">{errors.height}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Weight (kg)</label>
                <div className={`mt-1 flex items-center rounded-xl border px-3 py-2 focus-within:ring-2 ${
                  errors.weight && touched.weight ? "border-red-500 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-red-200"
                }`}>
                  <Weight className="mr-2 h-4 w-4 text-gray-400" />
                  <input name="weight" value={form.weight} onChange={onChange} onBlur={onBlur}
                    placeholder="70" className="w-full bg-transparent py-1.5 text-sm outline-none" />
                </div>
                {touched.weight && errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight}</p>}
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-medium">Date of Birth</label>
                <div className={`mt-1 flex items-center rounded-xl border px-3 py-2 focus-within:ring-2 ${
                  errors.dob && touched.dob ? "border-red-500 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-red-200"
                }`}>
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  <input type="date" name="dob" value={form.dob} onChange={onChange} onBlur={onBlur}
                    className="w-full bg-transparent py-1.5 text-sm outline-none" />
                </div>
                {touched.dob && errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
              </div>

              {/* Profile picture */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Profile picture (optional)</label>

                {/* URL input */}
                <input
                  type="url"
                  name="profilePicture"
                  value={form.profilePicture}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Paste image URL (optional)"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
                />

                {/* Dropzone */}
                <div className="mt-3">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 p-6 text-center hover:bg-black/5">
                    <ImageIcon className="mb-2 h-6 w-6 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Drag & drop or click to choose (we’ll upload the first image)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setProfileFiles(e.target.files ? Array.from(e.target.files) : [])}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Previews */}
                {(previews.length > 0 || form.profilePicture.trim()) && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {previews.map((src, idx) => (
                      <img key={src} src={src} alt={`preview-${idx+1}`}
                        className="h-24 w-full rounded-xl object-cover ring-1 ring-gray-200" />
                    ))}
                    {form.profilePicture.trim() && (
                      <img src={form.profilePicture.trim()} alt="url-preview"
                        className="h-24 w-full rounded-xl object-cover ring-1 ring-gray-200" />
                    )}
                  </div>
                )}
              </div>

              {/* BMI */}
              <div className="md:col-span-2 text-xs text-gray-500">
                BMI (auto): <span className="font-medium text-gray-700">{bmi}</span>
              </div>

              {/* Submit */}
              <div className="md:col-span-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-red-700 transition disabled:opacity-60"
                >
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <span>Sign up</span>
                  )}
                </motion.button>

                <p className="mt-3 text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-red-600 hover:underline">Sign in</Link>
                </p>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-[11px] text-gray-500">
            By continuing, you agree to our <a className="underline" href="#">Terms</a> and{" "}
            <a className="underline" href="#">Privacy Policy</a>.
          </p>
        </div>
      </motion.section>
    </div>
  );
}
