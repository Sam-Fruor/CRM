// src/app/(dashboard)/admin/users/DeleteUserButton.tsx
"use client";

import { deleteUser } from "@/app/actions/userActions";

export default function DeleteUserButton({ userId, userName }: { userId: string, userName: string }) {
  return (
    <form action={deleteUser}>
      <input type="hidden" name="userId" value={userId} />
      <button 
        type="submit" 
        className="text-red-600 hover:text-red-800 font-bold text-sm bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
        onClick={(e) => {
          if (!confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) {
            e.preventDefault();
          }
        }}
      >
        Delete User
      </button>
    </form>
  );
}