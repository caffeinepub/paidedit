import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  IndianRupee,
  Instagram,
  Mail,
  Scissors,
  Shield,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    icon: Zap,
    title: "Lightning-Fast Delivery",
    desc: "Get your edited video back within 24–48 hours. No waiting, no delays.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Scissors,
    title: "Professional Editing",
    desc: "Cuts, transitions, color grading, music sync — all done by expert editors.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Your videos are encrypted and stored securely on the Internet Computer.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    desc: "Track your order status from submission to delivery.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
];

const plans = [
  {
    id: 0,
    badge: "🔥 HOT",
    name: "Free Fire Video Edit",
    subtitle: "Gaming Highlights",
    price: 50,
    unit: "per video",
    featured: false,
    fireHot: true,
    features: [
      "Free Fire gameplay highlights",
      "Kills & moments edit",
      "Epic music sync",
      "Gaming effects",
      "Fast delivery",
    ],
  },
  {
    id: 2,
    badge: "Most Popular",
    name: "High Quality Video",
    subtitle: "Full HD • 4 Videos/Day",
    price: 99,
    unit: "1 day",
    featured: true,
    features: [
      "4 videos per day",
      "Valid for 1 day",
      "Full HD quality",
      "Color grading",
      "Transition effects",
      "Background music",
    ],
  },
  {
    id: 5,
    badge: "🔥 Free Fire",
    name: "Free Fire 15 Day Package",
    subtitle: "Free Fire Only • 15 Days",
    price: 499,
    unit: "15 days",
    featured: false,
    features: [
      "Free Fire edits only",
      "2 videos per day",
      "15 days validity",
      "Priority support",
      "Dedicated editor",
    ],
  },
  {
    id: 6,
    badge: "🏆 Best Offer",
    name: "Free Fire 1 Month",
    subtitle: "Unlimited Gaming Edits",
    price: 999,
    unit: "per month",
    featured: false,
    bestOffer: true,
    features: [
      "Unlimited Free Fire edits",
      "Gaming highlights every day",
      "Epic music sync",
      "Priority delivery",
      "Dedicated editor",
      "24/7 support",
    ],
  },
  {
    id: 7,
    badge: "💎 Premium 15 Days",
    name: "15 Day Premium",
    subtitle: "2 Videos Per Day",
    price: 149,
    unit: "15 days",
    featured: false,
    isPremium15: true,
    features: [
      "2 videos per day",
      "Premium editing quality",
      "Diamond member status",
      "Priority delivery",
      "15 days access",
    ],
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Content Creator",
    text: "PAIDEDIT turned my raw footage into polished content in a single day. Every rupee is worth it!",
    stars: 5,
  },
  {
    name: "Rohit Mehta",
    role: "Wedding Videographer",
    text: "The editing quality is outstanding. My clients love the highlight reels.",
    stars: 5,
  },
  {
    name: "Ananya Gupta",
    role: "Instagram Influencer",
    text: "Instagram Reel editing for just ₹49 — incredibly affordable!",
    stars: 5,
  },
];

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center"
        data-ocid="hero.section"
      >
        {/* Hero BG Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-paidedit.dim_1920x1080.jpg')",
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/50 to-background" />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/30 bg-white/10 text-white text-sm font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Starting from just ₹50 per video
            </div>

            <h1 className="font-display font-extrabold text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-none tracking-tight mb-6">
              <span className="gradient-text">PAID</span>
              <span className="text-foreground">EDIT</span>
            </h1>

            <p className="text-xl sm:text-2xl text-white font-bold max-w-2xl mx-auto mb-10 drop-shadow-lg">
              Professional short video editing at your fingertips.
              <br />
              <span className="text-white font-extrabold text-2xl sm:text-3xl tracking-wide drop-shadow-lg">
                Fast. Affordable. Cinematic.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="gradient-primary border-0 text-white font-semibold text-lg px-8 h-14 hover:opacity-90 transition-opacity"
                data-ocid="hero.primary_button"
              >
                <Link to="/submit">
                  Submit Your Video <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg font-semibold border-border hover:bg-card"
                data-ocid="hero.secondary_button"
              >
                <Link to="/orders">Track My Orders</Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground/50 text-xs flex flex-col items-center gap-1">
          <span>Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
            className="w-0.5 h-6 bg-muted-foreground/30 rounded-full"
          />
        </div>
      </section>

      {/* Features */}
      <section
        className="py-24 container mx-auto px-4"
        data-ocid="features.section"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-bold text-4xl sm:text-5xl mb-4">
            Why Choose <span className="gradient-text">PAIDEDIT</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            We make professional video editing accessible to everyone.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="card-glow h-full bg-card border-border hover:border-primary/40 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-card/30" data-ocid="pricing.section">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl sm:text-5xl mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Choose the plan that suits your needs. No hidden charges.
            </p>
          </motion.div>

          {/* Pricing cards: row1 full, row2 3-col, row3 full */}
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <PricingCard key={plans[0].id} plan={plans[0]} index={0} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {plans.slice(1, 4).map((plan, i) => (
                <PricingCard key={plan.id} plan={plan} index={i + 1} />
              ))}
            </div>
            <div className="md:max-w-sm md:mx-auto">
              <PricingCard key={plans[4].id} plan={plans[4]} index={4} />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        className="py-24 container mx-auto px-4"
        data-ocid="testimonials.section"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-bold text-4xl sm:text-5xl mb-4">
            Loved by <span className="gradient-text">Creators</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="card-glow bg-card border-border h-full">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[1, 2, 3, 4, 5].slice(0, t.stars).map((n) => (
                      <Star
                        key={n}
                        className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Support Banner */}
      <section className="py-6 bg-card/50 border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Need help?</span>
            <a
              href="mailto:paidedit081@gmail.com"
              className="flex items-center gap-1.5 text-primary underline underline-offset-2 hover:opacity-80 transition-colors font-medium"
              data-ocid="support.link"
            >
              <Mail className="w-3.5 h-3.5" />
              paidedit081@gmail.com
            </a>
            <span className="hidden sm:inline text-muted-foreground/40">·</span>
            <a
              href="https://instagram.com/paidedit081"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 transition-colors font-medium"
              data-ocid="support.instagram.link"
            >
              <Instagram className="w-3.5 h-3.5" />
              @paidedit081 on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-24 relative overflow-hidden"
        data-ocid="cta.section"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-card to-accent/5" />
        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-extrabold text-4xl sm:text-6xl mb-6">
              Ready to Go <span className="gradient-text">Viral</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
              Submit your raw footage today and receive a professionally edited
              short video.
            </p>
            <Button
              asChild
              size="lg"
              className="gradient-primary border-0 text-white font-semibold text-lg px-10 h-14 hover:opacity-90 transition-opacity"
              data-ocid="cta.primary_button"
            >
              <Link to="/submit">
                Submit Your Video <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
      {/* Admin Login Floating Button */}
      <div className="flex justify-center pb-8 mt-4">
        <Link to="/admin">
          <button
            type="button"
            data-ocid="landing.admin.link"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors opacity-60 hover:opacity-100 bg-card border border-border rounded-full px-4 py-2 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Login
          </button>
        </Link>
      </div>
    </div>
  );
}

type Plan = (typeof plans)[number];

function PricingCard({ plan, index }: { plan: Plan; index: number }) {
  return (
    <motion.div
      data-ocid={`pricing.plan.item.${plan.id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="relative"
    >
      <Card
        className={`card-glow h-full bg-card relative overflow-hidden transition-all duration-300 ${
          plan.featured
            ? "border-primary/60 shadow-lg shadow-primary/20 scale-105"
            : "bestOffer" in plan && plan.bestOffer
              ? "border-yellow-400/70 shadow-xl shadow-yellow-400/20 ring-1 ring-yellow-400/40"
              : "isPremium15" in plan && plan.isPremium15
                ? "border-blue-400/70 shadow-xl shadow-blue-400/20 ring-1 ring-blue-400/40"
                : plan.badge === "Best Deal"
                  ? "border-amber-500/50 shadow-lg shadow-amber-500/10"
                  : "border-border hover:border-primary/40"
        }`}
      >
        {plan.featured && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        )}
        {"bestOffer" in plan && plan.bestOffer && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/8 to-amber-500/5 pointer-events-none" />
        )}
        {"isPremium15" in plan && plan.isPremium15 && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/8 to-purple-500/5 pointer-events-none" />
        )}
        {plan.badge === "Best Deal" &&
          !("bestOffer" in plan && plan.bestOffer) && (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />
          )}

        <CardContent className="p-6 relative flex flex-col h-full">
          {/* Badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                plan.featured
                  ? "bg-primary/20 text-primary"
                  : "bestOffer" in plan && plan.bestOffer
                    ? "bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-400/40"
                    : "isPremium15" in plan && plan.isPremium15
                      ? "bg-blue-400/20 text-blue-300 ring-1 ring-blue-400/40"
                      : plan.badge === "Best Deal"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-muted text-muted-foreground"
              }`}
            >
              {plan.badge}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
          <p className="text-muted-foreground text-xs mb-4">{plan.subtitle}</p>

          {/* Price */}
          <div className="flex items-end gap-1 mb-1">
            <IndianRupee
              className={`w-6 h-6 mb-1 ${
                plan.featured
                  ? "text-primary"
                  : "bestOffer" in plan && plan.bestOffer
                    ? "text-yellow-400"
                    : "isPremium15" in plan && plan.isPremium15
                      ? "text-blue-400"
                      : plan.badge === "Best Deal"
                        ? "text-amber-400"
                        : "text-foreground"
              }`}
            />
            <span
              className={`font-display font-extrabold text-5xl leading-none ${
                plan.featured
                  ? "gradient-text"
                  : "bestOffer" in plan && plan.bestOffer
                    ? "text-yellow-300"
                    : "isPremium15" in plan && plan.isPremium15
                      ? "text-blue-300"
                      : plan.badge === "Best Deal"
                        ? "text-amber-300"
                        : "text-foreground"
              }`}
            >
              {plan.price}
            </span>
          </div>
          <p className="text-muted-foreground text-xs mb-6">{plan.unit}</p>

          {/* Features */}
          <ul className="space-y-2.5 mb-8 flex-1">
            {plan.features.map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    plan.featured
                      ? "text-primary"
                      : "bestOffer" in plan && plan.bestOffer
                        ? "text-yellow-400"
                        : "isPremium15" in plan && plan.isPremium15
                          ? "text-blue-400"
                          : plan.badge === "Best Deal"
                            ? "text-amber-400"
                            : "text-accent"
                  }`}
                />
                <span className="text-foreground">{feat}</span>
              </li>
            ))}
          </ul>

          <Button
            asChild
            className={`w-full font-semibold h-11 transition-opacity ${
              plan.featured
                ? "gradient-primary border-0 text-white hover:opacity-90"
                : "bestOffer" in plan && plan.bestOffer
                  ? "bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/30 font-bold"
                  : plan.badge === "Best Deal"
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                    : "bg-card border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
            }`}
            data-ocid="pricing.primary_button"
          >
            <Link to="/submit">Get Started</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
