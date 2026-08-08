import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const SignUp = () => {
  const navigate = useNavigate();
  const { user, isReceptionist, isOwner } = useAppContext();

  useEffect(() => {
    document.title = "Sign Up — SmartStayX";
  }, []);

  useEffect(() => {
    if (user && isReceptionist) navigate("/Receptionist");
    if (user && isOwner) navigate("/Owner");
  }, [user, isReceptionist, isOwner, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfaf8] px-4 pt-24 pb-16">
      <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_top_left,_rgba(37, 99, 235,0.08),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(37, 99, 235,0.06),_transparent_26%)]" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
        <ClerkSignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none border-none w-full",
              headerTitle: "text-slate-900",
              headerSubtitle: "text-slate-500",
              formButtonPrimary: "gold-button",
              socialButtonsBlockButton: "border border-black/[0.08] bg-white text-slate-700",
              formFieldInput: "bg-white border-black/[0.1] text-slate-900",
              formFieldLabel: "text-slate-500",
              footerActionText: "text-slate-500",
              footerActionLink: "text-[#2563EB]",
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignUp;
