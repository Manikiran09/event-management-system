import { useEffect, useState } from "react";
import api from "../api";
import TopNav from "../components/TopNav";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "organizer",
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(null);
  const [editingUserId, setEditingUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, pendingResponse] = await Promise.all([
        api.get("/auth/users"),
        api.get("/auth/users/pending"),
      ]);

      setUsers(usersResponse.data.users || []);
      setPendingUsers(pendingResponse.data.users || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/auth/users", form);
      setMessage("User account created successfully");
      setForm(initialForm);
      await loadUsers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to create user");
    }
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "participant",
      accountStatus: user.accountStatus || "approved",
    });
    setMessage("");
    setError("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.patch(`/auth/users/${editingUserId}`, editForm);
      setMessage("User updated successfully");
      setEditingUserId("");
      setEditForm(null);
      await loadUsers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to update user");
    }
  };

  const handleDelete = async (userId) => {
    setMessage("");
    setError("");

    try {
      await api.delete(`/auth/users/${userId}`);
      setMessage("User deleted successfully");
      await loadUsers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to delete user");
    }
  };

  const handleApprove = async (userId) => {
    setMessage("");
    setError("");

    try {
      await api.patch(`/auth/users/${userId}/approve`);
      setMessage("Signup approved");
      await loadUsers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to approve signup");
    }
  };

  const handleReject = async (userId) => {
    setMessage("");
    setError("");

    try {
      await api.patch(`/auth/users/${userId}/reject`);
      setMessage("Signup rejected");
      await loadUsers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to reject signup");
    }
  };

  return (
    <main className="min-h-screen">
      <TopNav />
      <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8 flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-teal-700">Admin Controls</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 md:text-[2.45rem]">User Management</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">Create, edit, approve, reject, and delete organizer, admin, and participant accounts.</p>
        </div>

        {message ? <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <section className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur-md md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-[1.65rem] font-bold tracking-tight text-slate-950">Create Account</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Admins can create and approve accounts directly.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">New User</span>
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
              <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2" name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required />
              <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
              <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" minLength={6} required />
              <select className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2" name="role" value={form.role} onChange={handleChange}>
                <option value="organizer">Organizer</option>
                <option value="participant">Participant</option>
                <option value="admin">Admin</option>
              </select>
              <div className="md:col-span-2">
                <button className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/15" type="submit">Create User</button>
              </div>
            </form>
          </section>

          {editForm ? (
            <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur-md md:p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-[1.65rem] font-bold tracking-tight text-slate-950">Edit User</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Change role, account status, or credentials.</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">Editing</span>
              </div>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdate}>
                <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2" name="name" value={editForm.name} onChange={handleEditChange} placeholder="Full Name" required />
                <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2" type="email" name="email" value={editForm.email} onChange={handleEditChange} placeholder="Email" required />
                <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2" type="password" name="password" value={editForm.password} onChange={handleEditChange} placeholder="New Password (optional)" />
                <select className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" name="role" value={editForm.role} onChange={handleEditChange}>
                  <option value="admin">Admin</option>
                  <option value="organizer">Organizer</option>
                  <option value="participant">Participant</option>
                </select>
                <select className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" name="accountStatus" value={editForm.accountStatus} onChange={handleEditChange}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/15" type="submit">Save Changes</button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/10 transition hover:-translate-y-0.5"
                    onClick={() => {
                      setEditForm(null);
                      setEditingUserId("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur-md md:p-6">
          <h2 className="font-display text-[1.65rem] font-bold tracking-tight text-slate-950">All Users</h2>
          {loading ? <p>Loading users...</p> : null}
          {!loading && users.length === 0 ? <p>No users found.</p> : null}
          {!loading && users.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/70">
              <table className="min-w-full border-collapse text-left text-sm text-slate-700">
                <thead>
                  <tr className="bg-slate-950 text-white">
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 align-top">{user.name}</td>
                      <td className="px-4 py-3 align-top">{user.email}</td>
                      <td className="px-4 py-3 align-top">{user.role}</td>
                      <td className="px-4 py-3 align-top">{user.accountStatus || "approved"}</td>
                      <td className="px-4 py-3 align-top">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-3">
                          <button type="button" className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white" onClick={() => startEdit(user)}>
                            Edit
                          </button>
                          <button type="button" className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2 text-xs font-bold text-white" onClick={() => handleDelete(user.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur-md md:p-6">
          <h2 className="font-display text-[1.65rem] font-bold tracking-tight text-slate-950">Pending Signups</h2>
          {loading ? <p>Loading pending signups...</p> : null}
          {!loading && pendingUsers.length === 0 ? <p>No pending signups.</p> : null}
          {!loading && pendingUsers.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/70">
              <table className="min-w-full border-collapse text-left text-sm text-slate-700">
                <thead>
                  <tr className="bg-slate-950 text-white">
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 align-top">{user.name}</td>
                      <td className="px-4 py-3 align-top">{user.email}</td>
                      <td className="px-4 py-3 align-top">{user.role}</td>
                      <td className="px-4 py-3 align-top">{user.accountStatus}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-3">
                          <button type="button" className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white" onClick={() => handleApprove(user.id)}>
                            Approve
                          </button>
                          <button type="button" className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2 text-xs font-bold text-white" onClick={() => handleReject(user.id)}>
                            Reject
                          </button>
                          <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700" onClick={() => startEdit(user)}>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          </section>
        </section>
      </section>
    </main>
  );
};

export default AdminUsersPage;
