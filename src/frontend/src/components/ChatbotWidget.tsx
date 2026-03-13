import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDown, ChevronRight, MessageCircleQuestion } from "lucide-react";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "What are the prices?",
    answer: `Our plans:
• Instagram video (15s) — ₹49
• High-quality video — ₹99
• 5-minute video — ₹149
• 1-Month Package (3 videos/day, 15 days premium) — ₹149
• 3-Month Package (10 videos/day) — ₹499
• Free Fire video edit (special offer) — ₹39
• Free Fire 1 Month Package (10 videos/day) — ₹999`,
  },
  {
    question: "How long does editing take?",
    answer:
      "Usually within 24 hours of payment confirmation. Premium plans get priority processing.",
  },
  {
    question: "How do I place an order?",
    answer: `Follow these steps:
1. Select your plan on the Order page
2. Upload your video file
3. Enter your name and email
4. Describe what edits you want
5. Complete payment via UPI
6. Wait for admin approval and receive your edited video`,
  },
  {
    question: "Which payment methods are accepted?",
    answer:
      "We accept all major UPI apps: Google Pay, PhonePe, Paytm, and Fampay. UPI ID: s79576@ptyes",
  },
  {
    question: "Is payment refundable?",
    answer:
      "No, all payments are non-refundable as per our policy. Please review your order details carefully before making payment.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Email us at paidedit081@gmail.com or reach us on Instagram @paidedit081. We are available 24/7 to help you.",
  },
];

export default function ChatbotWidget() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="fixed bottom-24 right-4 z-50" data-ocid="chatbot.panel">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg gradient-primary border-0 text-white hover:opacity-90"
            data-ocid="chatbot.open_modal_button"
            aria-label="Open FAQ chatbot"
          >
            <MessageCircleQuestion className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:w-[380px] flex flex-col p-0"
        >
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
            <SheetTitle className="font-bold text-lg flex items-center gap-2">
              <MessageCircleQuestion className="w-5 h-5 text-primary" />
              Frequently Asked Questions
            </SheetTitle>
            <p className="text-sm text-muted-foreground font-semibold">
              Click a question to see the answer
            </p>
          </SheetHeader>
          <ScrollArea className="flex-1 px-5 py-4">
            <div className="space-y-2">
              {FAQ_ITEMS.map((item, idx) => (
                <div
                  key={item.question}
                  className="rounded-lg border border-border overflow-hidden"
                  data-ocid={`chatbot.item.${idx + 1}`}
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 p-3 text-left font-bold text-sm hover:bg-muted/50 transition-colors"
                    onClick={() => toggleQuestion(idx)}
                  >
                    <span className="flex-1 leading-snug">{item.question}</span>
                    {openIndex === idx ? (
                      <ChevronDown className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {openIndex === idx && (
                    <div className="px-3 pb-3 pt-1 bg-muted/30 border-t border-border">
                      <p className="text-sm font-semibold text-foreground whitespace-pre-line leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs font-bold text-primary text-center">
                Still have questions? Use the chat button below or contact us at
                paidedit081@gmail.com
              </p>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
