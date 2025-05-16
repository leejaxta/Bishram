import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { API_URL } from "@/constants/baseUrl";
import Navbar from "@/components/layout/navbar";

export default function Signup() {
  const [signup, setSignup] = useState({
    address: "",
    name: "",
    email: "",
    number: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    address: "",
    name: "",
    email: "",
    number: "",
    password: "",
    confirmPassword: "",
    terms: "",
  });

  const [touched, setTouched] = useState({
    address: false,
    name: false,
    email: false,
    number: false,
    password: false,
    confirmPassword: false,
  });

  const [termsAgreed, setTermsAgreed] = useState(false);

  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "email":
        if (!value) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Invalid email format";
        }
        break;
      case "number":
        if (!value) {
          error = "Contact number is required";
        } else if (!/^\d{7,10}$/.test(value)) {
          error = "Contact number should be 10-15 digits";
        }
        break;
      case "name":
        if (!value) {
          error = "Username is required";
        } else if (value.length < 3) {
          error = "Username must be at least 3 characters";
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = "Username can only contain letters, numbers and underscores";
        }
        break;
      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 8) {
          error = "Password must be at least 8 characters";
        } else if (!/(?=.*[a-z])/.test(value)) {
          error = "Password must contain at least one lowercase letter";
        } else if (!/(?=.*[A-Z])/.test(value)) {
          error = "Password must contain at least one uppercase letter";
        } else if (!/(?=.*\d)/.test(value)) {
          error = "Password must contain at least one number";
        } else if (!/(?=.*[!@#$%^&*])/.test(value)) {
          error = "Password must contain at least one special character";
        } else if (/\s/.test(value)) {
          error = "Password cannot contain spaces";
        }
        break;
      case "confirmPassword":
        if (!value) {
          error = "Please confirm your password";
        } else if (value !== signup.password) {
          error = "Passwords do not match";
        }
        break;
      case "address":
        if (!value) {
          error = "Address is required";
        }
        break;
    }

    return error;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // For phone number, only allow numbers
    if (name === "number" && !/^\d*$/.test(value)) {
      return;
    }

    setSignup({ ...signup, [name]: value });

    // Validate field if it's been touched
    if (touched[name as keyof typeof touched]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const validateForm = () => {
    const newErrors = {
      email: validateField("email", signup.email),
      number: validateField("number", signup.number),
      name: validateField("name", signup.name),
      password: validateField("password", signup.password),
      confirmPassword: validateField("confirmPassword", signup.confirmPassword),
      address: validateField("address", signup.address),
      terms: !termsAgreed ? "You must agree to the terms and conditions" : "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Destructure to remove confirmPassword
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...data } = signup;

      const response = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong");
      }

      const result = await response.json();
      console.log("Success:", result);
      localStorage.setItem("token", result.token);
      window.location.href = "/";
    } catch (error: unknown) {
      console.error("Error:", error);
      if (error instanceof Error) {
        setErrors((prev) => ({ ...prev, email: error.message }));
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
        <form className="h-auto w-auto space-y-8" onSubmit={onSubmit}>
          <div>
            <h2 className="text-2xl font-semibold leading-[28px] text-[#3a3a3a]">
              Create New Account
            </h2>
            <h3 className="my-1 text-base  leading-[18px]  text-[#343b41]">
              User are required to fill all information
            </h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-lg font-medium leading-5 text-[#303030]"
              >
                Email:
              </label>
              <input
                onChange={handleChange}
                onBlur={handleBlur}
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email address"
                className={`h-[50px] w-full rounded-lg border ${
                  errors.email
                    ? "border-red-500"
                    : "border-[rgba(155,155,155,0.4)]"
                } px-[16px] py-[10px] text-base font-medium leading-[18px] text-black`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="number"
                className="text-lg font-medium leading-5 text-[#303030]"
              >
                Contact Number:
              </label>
              <input
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your contact number (digits only)"
                type="tel"
                id="number"
                name="number"
                value={signup.number}
                className={`h-[50px] w-full rounded-lg border ${
                  errors.number
                    ? "border-red-500"
                    : "border-[rgba(155,155,155,0.4)]"
                } px-[16px] py-[10px] text-base font-medium leading-[18px] text-black`}
              />
              {errors.number && (
                <p className="text-red-500 text-sm">{errors.number}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="text-lg font-medium leading-5 text-[#303030]"
              >
                Username:
              </label>
              <input
                onChange={handleChange}
                onBlur={handleBlur}
                type="text"
                id="name"
                name="name"
                placeholder="Enter your username (letters, numbers, underscores)"
                className={`h-[50px] w-full rounded-lg border ${
                  errors.name
                    ? "border-red-500"
                    : "border-[rgba(155,155,155,0.4)]"
                } px-[16px] py-[10px] text-base font-medium leading-[18px] text-black`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-lg font-medium leading-5 text-[#303030]"
              >
                Password:
              </label>
              <input
                onChange={handleChange}
                onBlur={handleBlur}
                type="password"
                id="password"
                name="password"
                placeholder="At least 8 chars with uppercase, lowercase, number & symbol"
                className={`h-[50px] w-full rounded-lg border ${
                  errors.password
                    ? "border-red-500"
                    : "border-[rgba(155,155,155,0.4)]"
                } px-[16px] py-[10px] text-base font-medium leading-[18px] text-black`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirmPassword"
                className="text-lg font-medium leading-5 text-[#303030]"
              >
                Confirm Password:
              </label>
              <input
                onChange={handleChange}
                onBlur={handleBlur}
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                className={`h-[50px] w-full rounded-lg border ${
                  errors.confirmPassword
                    ? "border-red-500"
                    : "border-[rgba(155,155,155,0.4)]"
                } px-[16px] py-[10px] text-base font-medium leading-[18px] text-black`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="address"
                className="text-lg font-medium leading-5 text-[#303030]"
              >
                Address:
              </label>
              <input
                onChange={handleChange}
                onBlur={handleBlur}
                type="text"
                id="address"
                name="address"
                placeholder="Enter your full address"
                className={`h-[50px] w-full rounded-lg border ${
                  errors.address
                    ? "border-red-500"
                    : "border-[rgba(155,155,155,0.4)]"
                } px-[16px] py-[10px] text-base font-medium leading-[18px] text-black`}
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address}</p>
              )}
            </div>
          </div>
          <label
            htmlFor="terms-and-conditions"
            className="flex items-center gap-3 cursor-pointer"
          >
            <Checkbox
              id="terms-and-conditions"
              checked={termsAgreed}
              onCheckedChange={(checked) => setTermsAgreed(!!checked)}
              className="bg-white h-5 w-5 border-[#736565]"
            />
            <p className="text-lg font-medium leading-5">
              I agree to the terms and conditions
            </p>
          </label>
          {errors.terms && (
            <p className="text-red-500 text-sm">{errors.terms}</p>
          )}
          <Button
            type="submit"
            className="h-[50px] w-full bg-[#DB5138] text-lg font-light leading-[21px] text-white"
          >
            Sign Up
          </Button>

          <div className="relative mb-3 flex h-5 w-full items-center">
            <div className="w-full border-y border-[#DB5138]"></div>
            <h1 className="text-medium absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-white px-2 text-xl  text-[#aca3a3]">
              OR
            </h1>
          </div>
          <p className="flex items-center  justify-center whitespace-pre text-base leading-[14px]">
            Already have an account?
            <Link to="/login" className="text-lg text-[#284693]">
              {" "}
              Login
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}
