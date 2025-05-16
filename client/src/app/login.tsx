import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { API_URL } from "@/constants/baseUrl";
import Navbar from "@/components/layout/navbar";

export default function Login() {
  const [login, setLogin] = useState({
    email: "",
    password: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    try {
      const response = await fetch(
        `${API_URL}/api/users?email=${data.email}&password=${data.password}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Check if the response status is not OK
      if (!response.ok) {
        const errorData = await response.json(); // Extract the error message
        throw new Error(errorData.message || "Something went wrong");
      }

      // Parse the response as JSON
      const result = await response.json();
      console.log("Success:", result);
      localStorage.setItem("token", result.token);
      // Navigate to the appropriate dashboard
      const payload = JSON.parse(atob(result.token.split(".")[1]));
      if (payload.isAdmin === true) {
        window.location.href = "/facilitydashboard";
      } else {
        window.location.href = "/";
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
        alert(error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  };

  return (
    <>
      <Navbar />
      <div
        style={{ boxShadow: "0 4px 18.4px 0 rgba(0,0,0,0.25)" }}
        className="mx-auto w-[817px] my-20 rounded-xl bg-white px-[102px] py-[52px]"
      >
        <form className="h-auto w-auto space-y-8">
          {/* <Image
            src={"/logos/NetaliProLogo.svg"}
            alt="logo"
            width={175}
            height={135}
            className="mx-auto"
          /> */}
          <div>
            <h2 className="text-2xl font-semibold leading-[28px] text-[#3a3a3a]">
              Login
            </h2>
            <h3 className="text-base mt-[6px] leading-[18px]  text-[#343b41]">
              User are required to fill all information
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-lg font-medium leading-5 text-[#303030]"
              >
                Email
              </label>
              <input
                onChange={(e) => setLogin({ ...login, email: e.target.value })}
                type="email"
                id="email"
                placeholder="Enter your email address"
                className="bg-white h-[50px] w-full rounded-lg border border-[rgba(155,155,155,0.4)] px-[16px] py-[10px] text-base font-medium leading-[18px] text-black"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-lg font-medium leading-5 text-[#303030]"
              >
                Password
              </label>
              <input
                onChange={(e) =>
                  setLogin({ ...login, password: e.target.value })
                }
                type="password"
                id="password"
                placeholder="Enter your password"
                className="bg-white h-[50px] w-full rounded-lg border border-[rgba(155,155,155,0.4)] px-[16px] py-[10px] text-base font-medium leading-[18px] text-black"
              />
            </div>
          </div>

          <Button
            onClick={() => onSubmit(login)}
            type="button"
            className="h-[50px] w-full bg-[#DB5138] text-lg font-light leading-[21px] text-white"
          >
            Login{" "}
          </Button>
          <div className="relative mb-3 flex h-5 w-full items-center">
            <div className="w-full border-y border-[#DB5138]"></div>
            <h1 className="text-medium absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-white px-2 text-xl  text-[#e17c6b]">
              OR
            </h1>
          </div>

          <p className="text-black flex items-center  justify-center whitespace-pre text-base leading-[14px]">
            Don&apos;t have an account?
            <Link to="/signup" className="text-lg text-[#284693]">
              {" "}
              Signup
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}
