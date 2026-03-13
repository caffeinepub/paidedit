import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  IndianRupee,
  Scissors,
  Shield,
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
    id: 1,
    badge: "Basic",
    name: "Instagram Reel",
    subtitle: "Instagram 15 seconds",
    price: 49,
    unit: "per video",
    featured: false,
    features: [
      "15-second video",
      "Optimised for Instagram",
      "Cuts & trims",
      "Music addition",
      "Captions",
    ],
  },
  {
    id: 2,
    badge: "Most Popular",
    name: "High Quality Video",
    subtitle: "Full HD Editing",
    price: 99,
    unit: "per video",
    featured: true,
    features: [
      "Full HD quality",
      "Color grading",
      "Transition effects",
      "Background music",
      "Text overlay",
      "HD export",
    ],
  },
  {
    id: 3,
    badge: "New",
    name: "5 Minute Video",
    subtitle: "Up to 5 minutes",
    price: 149,
    unit: "per video",
    featured: false,
    features: [
      "Up to 5 minutes",
      "Full HD quality",
      "Transitions",
      "Background music",
      "Text overlay",
      "HD export",
    ],
  },
  {
    id: 4,
    badge: "Package",
    name: "1 Month Package",
    subtitle: "Unlimited Videos",
    price: 149,
    unit: "per month",
    featured: false,
    features: [
      "Unlimited videos",
      "All high-quality features",
      "Priority delivery",
      "24/7 support",
    ],
  },
  {
    id: 5,
    badge: "Best Deal",
    name: "3 Month Package",
    subtitle: "Best Value Bundle",
    price: 499,
    unit: "3 months",
    featured: false,
    features: [
      "Everything in 1 Month",
      "Save ₹148",
      "Priority support",
      "Dedicated editor",
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              Starting from just ₹49 per video
            </div>

            <h1 className="font-display font-extrabold text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-none tracking-tight mb-6">
              <span className="gradient-text">PAID</span>
              <span className="text-foreground">EDIT</span>
            </h1>

            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light">
              Professional short video editing at your fingertips.
              <br />
              <span className="text-foreground font-medium">
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

          {/* 5 cards: 3 on top row, 2 centered on bottom */}
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {plans.slice(0, 3).map((plan, i) => (
                <PricingCard key={plan.id} plan={plan} index={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:max-w-2xl md:mx-auto">
              {plans.slice(3).map((plan, i) => (
                <PricingCard key={plan.id} plan={plan} index={i + 3} />
              ))}
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
            : plan.badge === "Best Deal"
              ? "border-amber-500/50 shadow-lg shadow-amber-500/10"
              : "border-border hover:border-primary/40"
        }`}
      >
        {plan.featured && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        )}
        {plan.badge === "Best Deal" && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />
        )}

        <CardContent className="p-6 relative flex flex-col h-full">
          {/* Badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                plan.featured
                  ? "bg-primary/20 text-primary"
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
                  : plan.badge === "Best Deal"
                    ? "text-amber-400"
                    : "text-foreground"
              }`}
            />
            <span
              className={`font-display font-extrabold text-5xl leading-none ${
                plan.featured
                  ? "gradient-text"
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
