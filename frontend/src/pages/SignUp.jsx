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
    if (user && isReceptionist) navigate("/receptionist");
    if (user && isOwner) navigate("/manager");
  }, [user, isReceptionist, isOwner, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fffaf4] dark:bg-[#0B1D24] px-4 pt-24 pb-16">
      <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_top_left,_rgba(80, 119, 179,0.08),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(80, 119, 179,0.06),_transparent_26%)]" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-black/[0.06] dark:border-[#1D3842] bg-white dark:bg-[#122A32] p-6 shadow-[0_20px_60px_rgba(0,56,68,0.08)] md:p-8">
        <ClerkSignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none border-none w-full",
              headerTitle: "text-slate-900 dark:text-[#E9F1F2]",
              headerSubtitle: "text-slate-500 dark:text-[#8299A0]",
              formButtonPrimary: "gold-button",
              socialButtonsBlockButton: "border border-black/[0.08] dark:border-[#1D3842] bg-white dark:bg-[#122A32] text-slate-700 dark:text-[#C1D2D6]",
              formFieldInput: "bg-white dark:bg-[#122A32] border-black/[0.1] dark:border-[#1D3842] text-slate-900 dark:text-[#E9F1F2]",
              formFieldLabel: "text-slate-500 dark:text-[#8299A0]",
              footerActionText: "text-slate-500 dark:text-[#8299A0]",
              footerActionLink: "text-[#5077B3] dark:text-[#93B3E0]",
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignUp;
