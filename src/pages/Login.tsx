import Navbar from "@/components/logincomponent/Navbar";
import LoginForm from "@/components/logincomponent/LoginForm";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Fixed Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </header>

      {/* Login Form Centered Below Navbar */}
      <main className="flex-grow flex items-center justify-center pt-[80px] px-4">
        <LoginForm />
      </main>
    </div>
  );
};

export default Login;
