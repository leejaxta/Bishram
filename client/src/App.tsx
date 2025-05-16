import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./utils/AuthContext";
import { ProtectedRoute } from "./utils/ProtectedRoute";
import "./App.css";
import Login from "./app/login";
import Signup from "./app/signup";
import Facilitydashboard from "./app/admin/facilitydashboard";
import Homepage from "./app/homepage";
import Account from "./app/account";
import Facilities from "./app/facilities";
import Rooms from "./app/room";
import Roomdetails from "./app/roomdetails";
import Roomdashboard from "./app/admin/roomdashboard";
import Payementpage from "./app/paymentpage";
import PaymentSuccess from "./app/paymentsuccess";
import BookingGraph from "./app/admin/BookingGraph";
import CurrentUsers from "./app/admin/currentUsers";
import Unauthorized from "./app/Unauthorized";
import Attraction from "./app/attraction";
import RoomCleaning from "./app/admin/RoomCleaning";
import ContactUs from "./app/contactUs";
import AdminAttractionsPage from "./app/admin/attractions";
import AdimHomePage from "./app/admin/homepage";
function App() {
  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/roomdetails/:id" element={<Roomdetails />} />
            <Route path="/facilities" element={<Facilities />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/" element={<Homepage />} />
            <Route path="/attraction" element={<Attraction />} />
            <Route path="/contact-us" element={<ContactUs />} />

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/account" element={<Account />} />
              <Route
                path="/paymentsuccess/:roomId/:checkInDate/:checkOutDate/:adults/:children"
                element={<PaymentSuccess />}
              />
              <Route path="/paymentpage/:id" element={<Payementpage />} />
            </Route>

            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route
                path="/facilitydashboard"
                element={<Facilitydashboard />}
              />
              <Route path="/roomdashboard" element={<Roomdashboard />} />
              <Route path="/bookinggraph" element={<BookingGraph />} />
              <Route path="/currentusers" element={<CurrentUsers />} />
              <Route path="/roomcleaning" element={<RoomCleaning />} />
              <Route
                path="/adminattractions"
                element={<AdminAttractionsPage />}
              />
              <Route path="/adminhome" element={<AdimHomePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;
