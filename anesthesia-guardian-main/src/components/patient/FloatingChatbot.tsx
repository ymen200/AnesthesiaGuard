import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, User, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Message de bienvenue par défaut
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Bonjour ! Je suis l'assistant IA d'AnesthesiaGuard. Une question sur vos bêta-bloquants ou votre anesthésie ?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: userText };
    
    // 1. Affiche le message utilisateur tout de suite
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Appelle ton Python
      const response = await api.getProtocol(userText);
      
      // 3. Affiche la réponse
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.protocol, // Le texte généré par Mistral
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      setMessages((prev) => [...prev, {
        id: "error",
        role: "assistant",
        content: "Désolé, je n'arrive pas à joindre le cerveau médical. Vérifiez votre connexion."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* BOUTON FLOTTANT (Toujours visible) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 shadow-xl shadow-blue-500/30 flex items-center justify-center text-white cursor-pointer hover:shadow-2xl transition-shadow"
          >
            <MessageCircle className="w-8 h-8" />
            {/* Petit point de notification */}
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* FENÊTRE DE CHAT */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Assistant Anesthésiste</h3>
                  <p className="text-xs text-blue-100 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    En ligne (IA)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zone de Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
              {messages.map((m) => (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    m.role === "user" ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  {/* Bulle de texte */}
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                    m.role === "user" 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                  }`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {/* Indicateur de chargement */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Zone */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-full px-2 py-1 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Posez votre question..."
                  className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none text-slate-700"
                  disabled={isLoading}
                />
                <Button 
                  size="icon" 
                  className="rounded-full h-8 w-8 bg-blue-600 hover:bg-blue-700 shrink-0"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-2">
                IA médicale expérimentale. Vérifiez toujours avec un médecin.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}