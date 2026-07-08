import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpenCheck, FlaskConical, Trophy, Palette, ArrowUpRight, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '@/components/marketing/Hero';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import Footer from '@/components/marketing/Footer';
import BackToTop from '@/components/common/BackToTop';
import ScrollProgress from '@/components/common/ScrollProgress';
import api from '@/lib/api';

const programs = [
  { icon: BookOpenCheck, title: 'Primary Years', grades: 'Grades I – V', desc: 'A rich inquiry-based curriculum that plants curiosity and independence.' },
  { icon: FlaskConical, title: 'Middle School', grades: 'Grades VI – VIII', desc: 'STEM labs, humanities studios, and mentored explorations across disciplines.' },
  { icon: Trophy, title: 'Cambridge / CBSE', grades: 'Grades IX – X', desc: 'Rigorous board preparation with globally-recognised curriculum tracks.' },
  { icon: Palette, title: 'Senior Secondary', grades: 'Grades XI – XII', desc: 'Elective streams, capstone projects, and global university counselling.' },
];

const campusGallery = [
  { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjBjbGFzc3Jvb20lMjBsZWFybmluZyUyMG1vZGVybnxlbnwwfHx8fDE3ODM1MzQ0Mjl8MA&ixlib=rb-4.1.0&q=85', label: 'Classrooms' },
  { url: 'https://images.unsplash.com/photo-1763582516354-e417d2902207?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzOTB8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBsaWJyYXJ5JTIwbW9kZXJuJTIwcmVhZGluZ3xlbnwwfHx8fDE3ODM1MzQ0Mjh8MA&ixlib=rb-4.1.0&q=85', label: 'Library' },
  { url: 'https://images.pexels.com/photos/8423008/pexels-photo-8423008.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', label: 'Faculty' },
  { url: 'https://images.unsplash.com/photo-1717584146940-118a65525da8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTB8MHwxfHNlYXJjaHwzfHxzY2hvb2wlMjBjaGlsZHJlbiUyMHJ1bm5pbmclMjBzcG9ydHN8ZW58MHx8fHwxNzgzNTM0NDI5fDA&ixlib=rb-4.1.0&q=85', label: 'Athletics' },
];

export default function Home() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    api.get('/announcements/public/news').then(r => setNews(r.data)).catch(() => {});
  }, []);

  return (
    <div className="relative">
      <ScrollProgress />
      <MarketingNavbar />
      <Hero />

      {/* Philosophy strip */}
      <section className="py-24 border-y border-border relative overflow-hidden" id="philosophy">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="overline">Our Philosophy</p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6 font-serif text-4xl sm:text-5xl leading-tight text-balance"
          >
            <span className="text-muted-foreground">Not every school teaches. </span>
            <span className="italic brand-gradient-text">A few form the mind.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-8 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Resonance is intentionally small. Class sizes never exceed 22. Teachers stay for a decade or more. Every child is known by name — and by nature.
          </motion.p>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
            <div>
              <p className="overline">Programs</p>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl tracking-tight">Four grade divisions,<br/>one continuous ethos.</h2>
            </div>
            <Link to="/admission" className="link-underline text-sm mono flex items-center gap-1" data-testid="programs-explore-link">
              Explore admissions <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {programs.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="group relative border border-border rounded-2xl p-6 card-lift bg-card"
                data-testid={`program-${p.title.toLowerCase().replace(/\s+/g,'-')}`}
              >
                <div className="h-11 w-11 rounded-xl border border-border bg-primary/10 text-primary grid place-items-center group-hover:rotate-6 transition-transform duration-500">
                  <p.icon size={18} />
                </div>
                <p className="overline mt-6">{p.grades}</p>
                <h3 className="mt-2 font-serif text-2xl">{p.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus gallery */}
      <section id="campus" className="py-24 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <p className="overline">Campus</p>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl tracking-tight">A ten-acre canvas,<br/>quietly extraordinary.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {campusGallery.map((g, i) => (
              <motion.div
                key={g.url}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={`relative rounded-2xl overflow-hidden group ${i % 3 === 0 ? 'md:row-span-2' : ''}`}
              >
                <img src={g.url} alt={g.label} className={`w-full ${i % 3 === 0 ? 'h-[500px]' : 'h-[240px]'} object-cover transition-transform duration-1000 group-hover:scale-105`} loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                  <p className="font-serif text-xl">{g.label}</p>
                  <span className="overline">0{i+1}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* News feed */}
      <section id="news" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="overline flex items-center gap-2"><Newspaper size={12} /> News & Announcements</p>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl tracking-tight">From the campus dispatch.</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {(news.length ? news : []).slice(0, 3).map((n, i) => (
              <motion.article
                key={n._id || i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-border bg-card overflow-hidden card-lift"
                data-testid={`news-card-${i}`}
              >
                {n.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" loading="lazy" />
                  </div>
                )}
                <div className="p-6">
                  <p className="overline">{new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <h3 className="mt-3 font-serif text-xl leading-tight">{n.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{n.body}</p>
                </div>
              </motion.article>
            ))}
            {news.length === 0 && (
              <div className="col-span-full text-center py-10 text-sm text-muted-foreground">
                No news yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="overline">Admissions 2026 – 27</p>
          <h2 className="mt-6 font-serif text-4xl sm:text-6xl tracking-tight leading-[1.05]">
            The next chapter of your child's story <span className="italic brand-gradient-text">begins here.</span>
          </h2>
          <p className="mt-8 text-muted-foreground max-w-xl mx-auto">Applications for Grades V through XII are open. Personal campus tours available by appointment.</p>
          <div className="mt-10">
            <Link to="/admission" className="btn-magnetic" data-testid="cta-final-admission">Start your application <ArrowUpRight size={16} /></Link>
          </div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </div>
  );
}
