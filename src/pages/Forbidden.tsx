
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Home, AlertTriangle } from "lucide-react";

const Forbidden = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "403 Error: User attempted to access forbidden route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-yellow-50 p-3">
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-2 text-yellow-500">403</h1>
          <div className="h-1 w-20 bg-yellow-300 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold mb-2">Acesso negado</h2>
          <p className="text-gray-600 mb-8">
            Você não tem permissão para acessar esta página. Por favor, faça login ou verifique suas credenciais.
          </p>
        </motion.div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link to="/login">
            <Button className="w-full sm:w-auto bg-indexa-purple hover:bg-indexa-purple-dark flex items-center justify-center">
              Fazer login
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center">
              <Home className="mr-2 h-4 w-4" />
              Ir para Home
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Forbidden;
