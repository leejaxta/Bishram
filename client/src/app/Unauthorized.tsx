import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center">
        {/* Warning Icon (Inline SVG) */}
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-red-600 mb-3">Access Denied</h1>

        {/* Dynamic Message */}
        <p className="text-gray-600 mb-6">
          {user ? (
            <>
              Hello{" "}
              <span className="font-semibold text-gray-800">{user.name}</span>,
              you don't have permission to access this page.
            </>
          ) : (
            "You need to be logged in to access this content."
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
          >
            Go Back
          </button>

          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Return Home
          </button>

          {!user && (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Login
            </button>
          )}
        </div>

        {/* Additional Help Text */}
        {user?.isAdmin === false && (
          <p className="mt-6 text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        )}
      </div>
    </div>
  );
};

export default Unauthorized;
