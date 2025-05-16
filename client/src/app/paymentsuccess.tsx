import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getCurrentUser, getAuthHeader } from "../utils/auth";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import CryptoJS from "crypto-js";
import { API_URL } from "@/constants/baseUrl";

interface Payment {
  transaction_uuid: string;
  transactionId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalAmount: number;
}

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId, checkInDate, checkOutDate, adults, children } = useParams();
  // const roomId = searchParams.get("roomId");
  // const checkInDate = searchParams.get("checkInDate");
  // const checkOutDate = searchParams.get("checkOutDate");
  // const adults = searchParams.get("adults");
  // const children = searchParams.get("children");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const secretKey = "8gBm/:&EnhH.1/q";
  const currentUser = useMemo(() => getCurrentUser(), []);
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!currentUser) {
          navigate("/login", { state: { from: location.pathname } });
          return;
        }

        const query = new URLSearchParams(location.search);
        const encodedData = query.get("data");

        if (!encodedData) {
          throw new Error("No payment data received");
        }

        // 1. Decode and parse eSewa data
        const decodedData = JSON.parse(atob(encodedData));
        console.log(decodedData);
        // 2. Verify signature (client-side check)
        const signedFieldNames = decodedData.signed_field_names.split(",");
        const message = signedFieldNames
          .map((field: string) => `${field}=${decodedData[field]}`)
          .join(",");

        const computedSignature = CryptoJS.HmacSHA256(
          message,
          secretKey
        ).toString(CryptoJS.enc.Base64);

        const signatureValid = computedSignature === decodedData.signature;
        setIsValid(signatureValid);

        if (!signatureValid) {
          throw new Error("Payment verification failed");
        }
        console.log("reached");

        // 3. Prepare headers
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(getAuthHeader() as Record<string, string>),
        };

        // 4. Send to backend for processing
        const response = await fetch(`${API_URL}/api/payments/verify`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            transactionId: decodedData.transaction_code,
            transaction_uuid: decodedData.transaction_uuid,
            roomId: roomId,
            userId: currentUser.id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            adults: adults,
            children: children,
            totalAmount: decodedData.total_amount,
            eSewaData: decodedData,
          }),
        });

        // Handle non-OK responses first
        if (!response.ok) {
          let errorMessage = "Payment processing failed";

          // Try to get error message from response body
          try {
            const errorData = await response.text();
            if (errorData) {
              try {
                const parsedError = JSON.parse(errorData);
                errorMessage = parsedError.message || errorData;
              } catch {
                errorMessage = errorData;
              }
            }
          } catch (e) {
            console.error("Error reading error response:", e);
          }

          throw new Error(errorMessage);
        }

        // Parse successful response
        const textResponse = await response.text();
        if (!textResponse) {
          throw new Error("Empty response from server");
        }

        const paymentData = JSON.parse(textResponse);
        setPayment(paymentData.payment);
      } catch (err) {
        console.error("Payment error:", err);
        setError(
          err instanceof Error ? err.message : "Payment processing failed"
        );
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [currentUser]);

  const handleDownloadInvoice = async () => {
    if (!payment) return;

    try {
      const response = await fetch(
        `${API_URL}/api/payments/invoice/${payment.transactionId}`,
        { headers: getAuthHeader() as HeadersInit }
      );

      if (!response.ok) throw new Error("Failed to download");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice_${payment.transactionId}.pdf`;
      link.click();
    } catch (error) {
      console.error("Error fetching invoice:", error);
      alert("Error downloading invoice");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#DB5138]" />
            <p className="text-lg">Processing your payment...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center max-w-md space-y-6">
            <XCircle className="w-16 h-16 mx-auto text-red-500" />
            <h1 className="text-3xl font-bold">Payment Error</h1>
            <p className="text-lg text-red-600">{error}</p>
            <div className="pt-4 space-y-3">
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-[#DB5138] hover:bg-[#C34128]"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-green-500 p-6 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-white" />
            <h1 className="text-3xl font-bold text-white mt-4">
              Payment Successful!
            </h1>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Booking Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Booking Reference</p>
                  <p className="font-medium">
                    {payment?.transaction_uuid || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-medium">
                    {payment?.transactionId || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Check-in Date</p>
                  <p className="font-medium">
                    {payment?.checkIn
                      ? new Date(payment.checkIn).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Check-out Date</p>
                  <p className="font-medium">
                    {payment?.checkOut
                      ? new Date(payment.checkOut).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Guests</p>
                  <p className="font-medium">
                    {payment?.adults || 0} Adults, {payment?.children || 0}{" "}
                    Children
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Total Paid</p>
                  <p className="font-medium text-green-600">
                    NPR {payment?.totalAmount?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => navigate("/")}
                className="flex-1 bg-[#DB5138] hover:bg-[#C34128]"
              >
                Back to Home
              </Button>
              <Button
                onClick={handleDownloadInvoice}
                variant="outline"
                className="flex-1 border-[#DB5138] text-[#DB5138] hover:bg-[#DB5138]/10"
              >
                Download Invoice (PDF)
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
