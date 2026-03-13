import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Instagram,
  Scale,
  Shield,
  User,
} from "lucide-react";
import { motion } from "motion/react";

const sections = [
  {
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10",
    borderColor: "border-amber-500/40",
    title: "1. Payment & Refund Policy",
    highlight: true,
    items: [
      "All payments made for video editing services are non-refundable.",
      "Once payment is submitted via UPI, it cannot be reversed or refunded under any circumstances.",
      "Please review your order carefully before making payment.",
      "In case of service failure on our part, we will redo the edit — not issue a refund.",
    ],
  },
  {
    icon: CheckCircle2,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    borderColor: "border-border",
    title: "2. Service Terms",
    highlight: false,
    items: [
      "We provide professional video editing services as described in the selected plan.",
      "Delivery timelines depend on the complexity of the project and current workload.",
      "We reserve the right to refuse any order that violates our content guidelines.",
      "Final deliverables will be shared via the contact details provided during order submission.",
    ],
  },
  {
    icon: User,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    borderColor: "border-border",
    title: "3. User Obligations",
    highlight: false,
    items: [
      "Users must ensure they own or have rights to all video content submitted.",
      "Uploading copyrighted content without permission is strictly prohibited.",
      "We are not responsible for any loss or damage to uploaded content.",
      "Users must provide accurate contact information to receive their edited videos.",
    ],
  },
  {
    icon: Scale,
    iconColor: "text-green-400",
    iconBg: "bg-green-400/10",
    borderColor: "border-border",
    title: "4. Legal Disclaimer",
    highlight: false,
    items: [
      "PAIDEDIT is a legally registered service. All transactions are processed through UPI, a regulated payment system in India.",
      "This service is compliant with applicable laws and regulations of India.",
      "By using this service, you agree to these terms and conditions in full.",
      "We reserve the right to update these terms at any time without prior notice.",
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">
            Terms &amp; <span className="gradient-text">Conditions</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Please read these terms carefully before using PAIDEDIT. By placing
            an order, you agree to all terms listed below.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card
                className={`card-glow bg-card border ${
                  section.highlight
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-border"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${section.iconBg} flex items-center justify-center shrink-0`}
                    >
                      <section.icon
                        className={`w-5 h-5 ${section.iconColor}`}
                      />
                    </div>
                    <h2
                      className={`font-display font-bold text-lg ${
                        section.highlight ? "text-amber-300" : "text-foreground"
                      }`}
                    >
                      {section.title}
                    </h2>
                    {section.highlight && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        IMPORTANT
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2.5">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            section.highlight
                              ? "text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        <p
                          className={`text-sm leading-relaxed ${
                            section.highlight
                              ? "text-amber-100/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Legal / Security footer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8"
        >
          <Card className="card-glow bg-card border-green-500/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-300 mb-0.5">
                  Secure &amp; Legal Service
                </p>
                <p className="text-xs text-muted-foreground">
                  PAIDEDIT is a legally operated platform. All UPI transactions
                  are processed through India's regulated payment
                  infrastructure.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="card-glow bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-xl">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm leading-relaxed">
                For any queries or support, contact us at{" "}
                <a
                  href="mailto:paidedit081@gmail.com"
                  className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity font-semibold"
                >
                  paidedit081@gmail.com
                </a>
                . We typically respond within 24 hours.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed flex items-center gap-2">
                Follow us on Instagram:{" "}
                <a
                  href="https://instagram.com/paidedit081"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-pink-400 underline underline-offset-2 hover:text-pink-300 transition-colors font-semibold"
                  data-ocid="terms.instagram.link"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  @paidedit081
                </a>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Page footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.65 }}
          className="mt-10 text-center space-y-1 pb-4"
        >
          <p className="text-sm text-muted-foreground">
            Designed &amp; Developed by{" "}
            <span className="font-semibold text-foreground">Shubham</span>
          </p>
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} PAIDEDIT. All Rights Reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
