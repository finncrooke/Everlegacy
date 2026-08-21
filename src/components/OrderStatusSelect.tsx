"use client";

import { useState } from "react";

export function OrderStatusSelect({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setSaving(true);
    await fetch("/api/admin/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: newStatus }),
    });
    setSaving(false);
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      aria-label="Order status"
      className="rounded border border-gray-300 px-2 py-1 text-sm"
    >
      <option value="processing">Processing</option>
      <option value="shipped">Shipped</option>
      <option value="delivered">Delivered</option>
    </select>
  );
}
