import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "motion/react";

const portfolioItems = [
  {
    id: 1,
    title: "Wedding Highlight Reel",
    category: "High Quality",
    duration: "3:42",
    gradient: "from-rose-900/80 via-pink-800/60 to-rose-950/90",
    accent: "text-rose-300",
    accentBg: "bg-rose-500/20 text-rose-300",
  },
  {
    id: 2,
    title: "Street Food Reel",
    category: "Instagram Reel",
    duration: "0:15",
    gradient: "from-orange-900/80 via-amber-800/60 to-orange-950/90",
    accent: "text-orange-300",
    accentBg: "bg-orange-500/20 text-orange-300",
  },
  {
    id: 3,
    title: "Himalaya Trek Vlog",
    category: "5 Min Video",
    duration: "4:58",
    gradient: "from-sky-900/80 via-blue-800/60 to-sky-950/90",
    accent: "text-sky-300",
    accentBg: "bg-sky-500/20 text-sky-300",
  },
  {
    id: 4,
    title: "Product Showcase",
    category: "High Quality",
    duration: "1:20",
    gradient: "from-violet-900/80 via-purple-800/60 to-violet-950/90",
    accent: "text-violet-300",
    accentBg: "bg-violet-500/20 text-violet-300",
  },
  {
    id: 5,
    title: "Dance Performance",
    category: "Instagram Reel",
    duration: "0:15",
    gradient: "from-fuchsia-900/80 via-pink-800/60 to-fuchsia-950/90",
    accent: "text-fuchsia-300",
    accentBg: "bg-fuchsia-500/20 text-fuchsia-300",
  },
  {
    id: 6,
    title: "Startup Brand Film",
    category: "5 Min Video",
    duration: "5:00",
    gradient: "from-teal-900/80 via-emerald-800/60 to-teal-950/90",
    accent: "text-teal-300",
    accentBg: "bg-teal-500/20 text-teal-300",
  },
];

export default function Portfolio() {
  return (
    <div
      className="min-h-[calc(100vh-4rem)] py-16"
      data-ocid="portfolio.section"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
            <Play className="w-3.5 h-3.5 fill-primary" />
            हमारे क्लाइंट्स के लिए बनाए गए वीडियो
          </div>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl leading-none tracking-tight mb-5">
            हमारे <span className="gradient-text">काम</span> देखें
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            हम हर वीडियो को सिनेमाई अनुभव देते हैं — रील्स से लेकर 5 मिनट के ब्रांड फिल्म तक।
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {portfolioItems.map((item, i) => (
            <motion.div
              key={item.id}
              data-ocid={`portfolio.card.item.${item.id}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="group relative rounded-2xl overflow-hidden cursor-pointer border border-white/5 shadow-xl"
            >
              {/* Simulated video thumbnail */}
              <div
                className={`relative h-52 bg-gradient-to-br ${item.gradient} flex items-center justify-center`}
              >
                {/* Noise texture overlay */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                  }}
                />
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                {/* Play button */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>

                {/* Duration badge */}
                <span className="absolute bottom-3 right-3 text-xs font-mono font-semibold bg-black/60 text-white px-2 py-0.5 rounded">
                  {item.duration}
                </span>

                {/* Category badge */}
                <span
                  className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${item.accentBg}`}
                >
                  {item.category}
                </span>
              </div>

              {/* Card footer */}
              <div className="bg-card border-t border-white/5 px-4 py-3">
                <p className="font-semibold text-sm text-foreground">
                  {item.title}
                </p>
                <p className={`text-xs mt-0.5 ${item.accent}`}>
                  {item.category}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center py-16 px-6 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20"
        >
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-4">
            अपना वीडियो भी <span className="gradient-text">प्रोफेशनल</span> बनवाएं
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            सिर्फ ₹49 से शुरुआत करें। 24–48 घंटे में डिलीवरी।
          </p>
          <Button
            asChild
            size="lg"
            className="gradient-primary border-0 text-white font-semibold text-lg px-8 h-14 hover:opacity-90 transition-opacity"
            data-ocid="portfolio.primary_button"
          >
            <Link to="/submit">
              अभी ऑर्डर करें <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
