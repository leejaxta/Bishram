import Navbar from "@/components/layout/navbar";
import React from "react";
import Footer from "@/components/layout/footer";
import { useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CryptoJS from "crypto-js";

const Paymentpage = () => {
  const location = useLocation();
  const { id: roomId } = useParams();
  const { checkInDate, checkOutDate, adults, children, totalPrice, nights } =
    location.state || {};

  const formattedCheckInDate = checkInDate
    ? new Date(checkInDate).toLocaleDateString("sv-SE") // Extracts YY-MM-DD
    : "N/A";
  const formattedCheckOutDate = checkOutDate
    ? new Date(checkOutDate).toLocaleDateString("sv-SE") // Extracts YY-MM-DD
    : "N/A";
  const perNightPrice = nights > 0 ? totalPrice / nights : totalPrice;

  // Get the base URL dynamically from the current window location
  const getBaseUrl = () => {
    // This will give you something like "http://localhost:5173" or "https://your-app.onrender.com"
    return `${window.location.protocol}//${window.location.host}`;
  };

  const handleEsewaPayment = (amount: number) => {
    if (!amount || amount <= 0) {
      alert("Invalid amount for payment");
      return;
    }

    const secretKey = "8gBm/:&EnhH.1/q"; // Replace with actual eSewa secret key
    const transactionUUID = `txn_${Date.now()}`;
    const productCode = "EPAYTEST"; // Replace with your Merchant Code
    const taxAmount = 0;
    const totalAmount = amount + taxAmount;
    const signedFieldNames = "total_amount,transaction_uuid,product_code";
    
    const baseUrl = getBaseUrl();

    // Generate eSewa signature
    const signature = CryptoJS.HmacSHA256(
      `total_amount=${totalAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`,
      secretKey
    ).toString(CryptoJS.enc.Base64);

    // Create and submit the form dynamically
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

    const formData = {
      amount: amount,
      tax_amount: 0,
      total_amount: totalAmount,
      transaction_uuid: transactionUUID,
      product_code: productCode,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${baseUrl}/paymentsuccess/${roomId}/${formattedCheckInDate}/${formattedCheckOutDate}/${adults}/${children}/`,
      failure_url: `${baseUrl}/paymentfailure/`,
      signed_field_names: signedFieldNames,
      signature: signature,
    };

    Object.entries(formData).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div>
      <Navbar />
      <div
        style={{ boxShadow: "0 4px 18.4px 0 rgba(0,0,0,0.25)" }}
        className="mx-auto w-[90%] md:w-[817px] my-20 rounded-xl bg-white px-10 py-8 md:px-[102px] md:py-[52px] shadow-lg"
      >
        <h1 className="text-[30px] font-bold text-center mb-10">
          Payment Details
        </h1>

        <div className="mt-10 space-y-5">
          <div className="flex justify-between text-lg font-medium">
            <p>Check-in Date:</p>
            <p>{formattedCheckInDate}</p>
          </div>
          <div className="flex justify-between text-lg font-medium">
            <p>Check-out Date:</p>
            <p>{formattedCheckOutDate}</p>
          </div>
          <div className="flex justify-between text-lg font-medium">
            <p>Adults:</p>
            <p>{adults || 0}</p>
          </div>
          <div className="flex justify-between text-lg font-medium">
            <p>Children:</p>
            <p>{children || 0}</p>
          </div>
          <div className="flex justify-between text-lg font-medium">
            <p>Total Price:</p>
            <p>
              {nights} nights * {perNightPrice} = Rs {totalPrice || "N/A"}
            </p>
          </div>
          <Button
            onClick={() => handleEsewaPayment(totalPrice)}
            disabled={!totalPrice || totalPrice <= 0}
            className="mt-auto w-full h-[58px] bg-[#DB5138] text-[#F7F7F7] text-[20px] font-bold disabled:bg-gray-400"
          >
            Pay Now
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Paymentpage;
