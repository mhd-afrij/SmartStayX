import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const StaffLogin = () => {
  const navigate = useNavigate();
  const { user, isReceptionist, isOwner } = useAppContext();

  useEffect(() => {
    document.title = "Login — SmartStayX";
  }, []);
  useEffect(() => {
    if (user && isReceptionist) navigate("/receptionist");
    if (user && isOwner) navigate("/manager");
  }, [user, isReceptionist, isOwner, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F5F0] dark:bg-[#111412] px-4 pt-24 pb-16">
      <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_top,_rgba(24,59,53,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(24,59,53,0.05),_transparent_24%)]" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] p-6 shadow-[0_20px_60px_rgba(24,59,53,0.08)] md:p-8">
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none border-none w-full",
              headerTitle: "text-slate-900 dark:text-[#F2EFE8]",
              headerSubtitle: "text-slate-500 dark:text-[#A9AEA7]",
              formButtonPrimary: "gold-button",
              socialButtonsBlockButton: "border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-700 dark:text-[#F2EFE8]",
              formFieldInput: "bg-white dark:bg-[#1A1E1B] border-black/[0.1] dark:border-[#303631] text-slate-900 dark:text-[#F2EFE8]",
              formFieldLabel: "text-slate-500 dark:text-[#A9AEA7]",
              footerActionText: "text-slate-500 dark:text-[#A9AEA7]",
              footerActionLink: "text-[#183B35] dark:text-[#8FB8A8]",
            },
          }}
        />
      </div>
    </div>
  );
};

export default StaffLogin;
