import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

interface ForgotPasswordFormProps {
  onBack: () => void;
  mode?: "forgot" | "change"; 
  email?: string;
}

const ForgotPasswordForm = ({ onBack, mode = "forgot", email: initialEmail = "" }: ForgotPasswordFormProps) => {

  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [email, setEmail] = useState(initialEmail); // use initialEmail as default
  const [serverOtp, setServerOtp] = useState<string>(""); 

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);
  
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email || !email.includes('@')) {
    toast({
      title: "Error",
      description: "Please enter a valid email address",
      variant: "destructive",
      duration: 2000,
    });
    return;
  }
  setIsLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/sendOTP?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    });

    const data = await response.json();

    if (response.ok && data.statusCode === 200) {
      setServerOtp(String(data.payload));
      toast({
        title: "OTP Sent",
        description: data.message,
        duration: 2000,
      });

      // Optionally save OTP or metadata here (don't store OTP in prod)
      setStep('otp');
    } else {
      toast({
        title: "Error",
        description: data.message || "Failed to send OTP",
        variant: "destructive",
        duration: 2000,
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
      duration: 2000,
    });
    console.error("OTP send error:", error);
  }
  setIsLoading(false);
 };

 const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
  if (e.key === "Backspace") {
    if (otp[index] === "" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  }
};



  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();

    const enteredOtp = otp.join(""); 

    if (enteredOtp.length !== 4) {
      toast({
        title: "Error",
        description: "Please enter the complete 4-digit OTP",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    if (enteredOtp === serverOtp) {
      toast({
        title: "OTP Verified",
        description: "Your OTP has been verified successfully",
        duration: 2000,
      });
      setStep("newPassword"); 
    } else {
      toast({
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect",
        variant: "destructive",
        duration: 2000,
      });
    }
  };


  const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!password || password.length < 6) {
    toast({
      title: "Error",
      description: "Password must be at least 6 characters long",
      variant: "destructive",
      duration: 2000,
    });
    return;
  }

  if (password !== confirmPassword) {
    toast({
      title: "Error",
      description: "Passwords do not match",
      variant: "destructive",
      duration: 2000,
    });
    return;
  }

  try {
    const url = `${API_BASE_URL}/updatePasswordByEmail?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "*/*"
      }
    });

    const data = await response.json();

    if (response.ok && data.statusCode === 200) {
      toast({
        title: "Success",
        description: data.message,
        duration: 2000,
      });
      onBack();
    } else {
      toast({
        title: "Error",
        description: data.message || "Failed to update password",
        variant: "destructive",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Reset password error:", error);
    toast({
      title: "Error",
      description: "Something went wrong while updating password.",
      variant: "destructive",
      duration: 2000,
    });
  }
};


  return (
    <Card className="w-full max-w-md animate-fade-in bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="text-center pt-8">
        <CardTitle className="text-2xl font-bold text-gray-900">
          {step === 'email' && (mode === "change" ? "Change Password" : "Forgot Password")}
          {step === 'otp' && "Verify OTP"}
          {step === 'newPassword' && "Reset Password"}
        </CardTitle>

        <p className="text-sm text-gray-500 mt-1">
          {step === 'email' && (mode === "change"
            ? "Please verify your email to set your password"
            : "We'll send an OTP to your email")}
          {step === 'otp' && `OTP sent to ${email}`}
          {step === 'newPassword' && "Set a new password to continue"}
        </p>

      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail size={16} /> Email Address <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1 rounded-lg"
              >
                <ArrowLeft className="mr-2" size={16} /> Back to Login
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:to-black text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 108 8h-4l3 3 3-3h-4a8 8 0 01-8 8z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <>
                    Get OTP <ArrowRight className="ml-2" size={16} />
                  </>
                )}
              </Button>

            </div>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2 text-center">
              <label className="text-sm font-medium text-gray-700">
                Enter 4-Digit OTP
              </label>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-14 h-14 text-center text-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                    value={otp[index]}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  />
                ))}
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => handleSendOtp({ preventDefault: () => { } } as React.FormEvent)}
                  className="text-blue-600 text-sm hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 108 8h-4l3 3 3-3h-4a8 8 0 01-8 8z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Resend OTP"
                  )}
                </Button>


              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("email")}
                className="flex-1 rounded-lg"
              >
                <ArrowLeft className="mr-2" size={16} /> Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:to-black text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Verify OTP <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </form>
        )}

        {/* New Password Step */}
        {step === 'newPassword' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:to-black text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Reset Password
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;
