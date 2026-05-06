import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, RefreshCw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `BẠN LÀ Thám Tử Đồ Vật Bí Ẩn. Bạn đang bí mật nghĩ về MỘT đồ vật quen thuộc trong nhà. Bé (người chơi) phải dùng tư duy suy luận để tìm ra đồ vật đó qua các câu hỏi.
NHIỆM VỤ CỦA BẠN:
1. Trích xuất trò chơi: Khi bắt đầu BẠN BÍ MẬT CHỌN 1 đồ vật phổ biến trong gia đình (dành cho bé 4-12 tuổi). KHÔNG TIẾT LỘ đồ vật này.
2. Trẻ sẽ đặt tối đa 10 câu hỏi CÓ/KHÔNG về đặc điểm đồ vật.
3. Bạn trả lời CÓ ✅ hoặc KHÔNG ❌. Bạn không được trả lời thẳng câu hỏi khác ngoài định dạng, chỉ đánh giá.
4. Đếm số thứ tự câu hỏi (Từ 1 đến 10).
5. Bạn phải cho đánh giá khi trẻ đặt đến cầu số 3, câu số 6, và câu số 9:
   - Nếu trẻ hỏi đặc điểm rộng (màu sắc, phòng, hình dáng...): "🌟 Câu hỏi thông minh! Hỏi theo nhóm/phòng giúp loại trừ nhanh."
   - Nếu trẻ hỏi quá cụ thể chưa rõ nhóm (vd: "Có phải cái cốc không?"): "💡 Gợi ý: Hãy hỏi về NHÓM đồ vật trước rồi mới đoán cụ thể nhé!"
6. Nếu trẻ đoán đúng đồ vật, khen ngợi lớn và kết thúc trò chơi. Nếu kết thúc 10 câu mà chưa tìm ra, hãy tiết lộ đáp án.

ĐỊNH DẠNG MỘT CÂU TRẢ LỜI CỦA BẠN (phải áp dụng chặt chẽ trừ lúc mới chào đón):
🔍 TRÒ CHƠI THÁM TỬ — Câu hỏi [X]/10
[Nhắc lại câu hỏi của trẻ]
→ [Có ✅ / Không ❌]

[Nhận xét chiến thuật NẾU là câu hỏi bài 3, 6, 9]

Lưu ý: Luôn đóng vai vui vẻ, hào hứng như một người bạn của trẻ! Bạn cần khởi tạo trò chơi trước bằng một câu chào ngắn gọn tự nhiên như sau: "Chào mừng nhà thám tử nhí! Cô đã giấu một đồ vật trong nhà, con có 10 câu hỏi CÓ hoặc KHÔNG để tìm ra nó nhé! Bắt đầu thôi nào!"`;

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Store chat session ref to persist conversation
  const chatSessionRef = useRef<any>(null);

  const initChat = () => {
    chatSessionRef.current = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });
    setMessages([]);
    setIsLoading(true);
    
    // Auto trigger the model opening response
    chatSessionRef.current.sendMessage({ message: "Xin chào, hãy bắt đầu trò chơi và dùng đúng câu chào đã quy định." })
      .then((response: any) => {
        setMessages([{ id: Date.now().toString(), role: 'model', text: response.text }]);
        setIsLoading(false);
      })
      .catch((error: any) => {
        console.error("Failed to start chat", error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !chatSessionRef.current) return;

    const userText = input.trim();
    setInput('');
    
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userText });
      const newModelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: response.text };
      setMessages(prev => [...prev, newModelMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: 'Xin lỗi, có lỗi kết nối xảy ra. Bé thử lại nhé!' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-yellow-50 relative overflow-hidden font-sans">
      {/* Decorative background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-300 opacity-20 blur-3xl mix-blend-multiply"></div>
      <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-yellow-400 opacity-20 blur-3xl mix-blend-multiply"></div>
      
      {/* Header */}
      <header className="m-4 sm:m-6 px-6 py-4 bg-white rounded-3xl border-4 border-yellow-400 shadow-xl z-20 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl hidden sm:block">🔍</div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight text-center sm:text-left">
              Trò Chơi Thám Tử
            </h1>
            <p className="text-sm font-bold text-orange-500 hidden sm:block">Tìm đồ vật bí ẩn trong nhà!</p>
          </div>
        </div>
        <button 
          onClick={initChat}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border-2 border-slate-200 hover:bg-slate-200 active:scale-95 rounded-xl transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Chơi lại</span>
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 relative z-0">
        <div className="max-w-3xl mx-auto space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex items-end gap-3 sm:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-white shadow-md z-10 ${message.role === 'user' ? 'bg-blue-500' : 'bg-orange-400'}`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  ) : (
                    <span className="text-2xl sm:text-3xl">🕵️‍♂️</span>
                  )}
                </div>

                {/* Message Bubble */}
                <div 
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-5 py-4 sm:px-6 sm:py-5 border-[3px] z-10 relative ${
                    message.role === 'user' 
                      ? 'bg-blue-50 border-blue-300 shadow-[4px_4px_0px_#bfdbfe]' 
                      : 'bg-[#ffedd5] border-[#fb923c] shadow-[4px_4px_0px_#ffccbc]'
                  }`}
                >
                  <div className={`prose prose-sm sm:prose-base font-medium w-full max-w-none break-words ${message.role === 'user' ? 'text-slate-800' : 'text-slate-900'}`}>
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-end gap-3 sm:gap-4"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-white shadow-md bg-orange-400 z-10">
                <span className="text-2xl sm:text-3xl">🕵️‍♂️</span>
              </div>
              <div className="bg-[#ffedd5] border-[3px] border-[#fb923c] shadow-[4px_4px_0px_#ffccbc] rounded-3xl px-6 py-5 flex items-center gap-1.5 h-12 z-10 relative">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} className="h-6" />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white px-4 py-4 sm:px-6 sm:pb-8 relative z-20 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center gap-2 sm:gap-4 bg-slate-100 rounded-2xl p-2 sm:p-4 border-2 border-slate-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Nhập câu hỏi Có/Không của bạn ở đây..."
            className="w-full flex-1 px-4 py-2 sm:py-3 bg-transparent text-slate-800 focus:outline-none focus:ring-0 transition-all font-medium italic placeholder:text-slate-400 disabled:opacity-50 text-base sm:text-lg"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 sm:px-8 sm:py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-sm sm:text-lg shadow-[4px_4px_0px_#bfdbfe] uppercase transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0px_#bfdbfe] flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Gửi</span> <span className="text-xl">🚀</span>
          </button>
        </form>
        <p className="text-center text-xs sm:text-sm text-slate-500 mt-3 font-medium">
          Mẹo nhỏ: Hãy hỏi về <span className="text-indigo-600">Nhóm/Phòng</span> trước, sau đó hẵng đoán <span className="text-purple-600">tên đồ vật</span> nhé!
        </p>
      </div>
    </div>
  );
}

