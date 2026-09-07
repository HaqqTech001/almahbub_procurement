import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { RegisterScreen, type RegisterFormValues } from "@hamd/ui/auth";
import { registerRequest } from "../api/auth-client.js";

export function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      await registerRequest({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        companyName: values.companyName,
        companyType: values.companyType,
        address: values.address,
        city: values.city,
        state: values.state,
        country: values.country,
        password: values.password,
        agreeToTerms: values.agreeToTerms,
      });
      navigate(`/otp?email=${encodeURIComponent(values.email)}`, {
        replace: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return <RegisterScreen onSubmit={onSubmit} loading={loading} />;
}
