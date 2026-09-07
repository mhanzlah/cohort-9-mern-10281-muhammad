import { useState, type ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Plus, Search } from "lucide-react";

import SearchModal from "./SearchModal";
import Tooltip from "./Tooltip";
import { useAuthStore } from "../store/auth.store";

export default function Sidebar(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-72 bg-gray-50 border-r border-gray-300 flex flex-col justify-between">
        <div className="h-16 px-3 border-b border-gray-300 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-200 transition"
          >
            <div className="w-6 h-6 rounded bg-black text-white flex items-center justify-center text-xs font-bold">
              N
            </div>
            <span className="font-semibold text-sm text-gray-800">NotPad</span>
          </Link>

          {user && (
            <div className="flex items-center gap-1">
              <Tooltip text="New note">
                <button
                  onClick={() => navigate("/n/new")}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-600 hover:text-black transition"
                  aria-label="Create new note"
                >
                  <Plus size={16} />
                </button>
              </Tooltip>

              <Tooltip text="Search">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-600 hover:text-black transition"
                  aria-label="Search notes"
                >
                  <Search size={16} />
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        {user && (
          <div className="flex-1 px-3 py-2">
            <nav className="flex flex-col gap-1">
              <Link
                to="/"
                className="text-sm flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200 text-gray-700"
              >
                <FileText size={16} />
                Notes
              </Link>
            </nav>
          </div>
        )}

        <div className="h-24 border-t border-gray-300 p-3 flex items-center">
          {loading ? (
            <div className="text-sm text-gray-400 px-2">Loading...</div>
          ) : user ? (
            <Link
              to="/profile"
              className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-gray-200 transition"
            >
              <img
                src={`https://api.dicebear.com/10.x/lorelei/svg?seed=${user.id}`}
                alt={`${user.username} avatar`}
                className="w-8 h-8 rounded-full border border-gray-300"
              />

              <div className="flex flex-col text-sm leading-tight">
                <span className="font-medium text-gray-800">
                  {user.username}
                </span>
                <span className="text-xs text-gray-500">View profile</span>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <Link
                to="/login"
                className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-center hover:bg-gray-100 transition"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="text-sm px-3 py-1.5 rounded-md bg-black text-white text-center hover:bg-black/90 transition"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </aside>

      {user && (
        <SearchModal isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
      )}
    </>
  );
}
