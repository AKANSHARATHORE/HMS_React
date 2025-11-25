import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config/api";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState<"forgot" | "change">("forgot");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("rememberedEmail");
    const savedPassword = sessionStorage.getItem("rememberedPassword");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("✅ API_BASE_URL:", API_BASE_URL);
      const url = `${API_BASE_URL}/employeeLogin`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      // alert(JSON.stringify(data))
      if (rememberMe) {
        sessionStorage.setItem("rememberedEmail", email);
        sessionStorage.setItem("rememberedPassword", password);
      } else {
        sessionStorage.removeItem("rememberedEmail");
        sessionStorage.removeItem("rememberedPassword");
      }

      if (response.ok && data.statusCode === 200) {
        toast({ title: "Success", description: data.message, duration: 500});

        sessionStorage.setItem("employeeRole", data.payload.empRole);
        sessionStorage.setItem("branch", data.payload.branch);
         sessionStorage.setItem("bankType", data.payload.bankName);
        //  alert(data.payload.bankName);
        sessionStorage.setItem("originalBranch", data.payload.branch);
        sessionStorage.setItem("user", JSON.stringify(data.payload));

        if (data.payload.loginFlag && data.payload.loginFlag === "1") {
          navigate("/dashboard");
        }

        if (
          data.payload.empRole &&
          data.payload.empRole.toLowerCase() === "system integrator"
        ) {
          navigate("/systemIntegrator");
        }

        if (
          data.payload.empRole &&
          data.payload.empRole.toLowerCase() === "quality check"
        ) {
          navigate("/qualityCheck");
        }

        else if (data.payload.loginFlag && data.payload.loginFlag === "0") {
          setShowForgotPassword(true);
          setForgotMode("change");

          toast({
            title: "Login Required",
            description: "Please complete your login setup.",
            duration: 500,

          });
          return;
        }

      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      console.error("Login error:", error);
    }
  };

  if (showForgotPassword) {
    return <ForgotPasswordForm mode={forgotMode} email={email} onBack={() => setShowForgotPassword(false)} />;
  }


  return (
    <div className="w-full max-w-md animate-fade-in">
      <Card className="bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-2xl overflow-hidden">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Lock className="text-white" size={24} />
            </div>
            {/* <div className="w-28 h-28 mx-auto mb-2 flex items-center justify-center overflow-hidden bg-white">
              <img
                src="./public/colored-logo.png" 
                alt="Product Logo"
                className="w-28 h-28 object-contain"
              />
            </div> */}


            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600 text-sm">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <Mail size={16} /> Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-12 h-12 border-gray-200 focus:border-gray-500 focus:ring-gray-500 rounded-lg transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <Lock size={16} /> Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-12 pr-12 h-12 border-gray-200 focus:border-gray-500 focus:ring-gray-500 rounded-lg transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between">
              {/* Remove remember me if not needed */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  className="border-gray-300"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm text-gray-600"
                >
                  Remember me
                </label>
              </div>

              <button
                type="button"
                className="text-gray-700 text-sm hover:text-black font-medium transition-colors"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:to-black text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Secured by HMS • Enterprise Grade Security
            </p>
            <p className="text-xs text-gray-500">
              • Everything is Possible
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
