import React from 'react';
import { 
  Heart, 
  Users, 
  Shield, 
  Award, 
  Target,
  Droplet,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import Footer from '../Footer';
import Header from '../Header';

// ✅ FIXED IMPORT PATHS: Using '../../' to go up to the 'src' folder
import suhamImage from '../../assets/images/team/suham-pandey.jpg';
import avinashImage from '../../assets/images/team/avinash-upretri.jpg';
import shikarImage from '../../assets/images/team/shikar-shahi-thakuree.jpg';
import bibekImage from '../../assets/images/team/bibek-ghimire.jpg';

const AboutUs = () => {
  const stats = [
    { icon: Users, number: '50,000+', label: 'Lives Saved' },
    { icon: Droplet, number: '100,000+', label: 'Donations' },
    { icon: MapPin, number: '500+', label: 'Camps Organized' },
    { icon: Shield, number: '99.8%', label: 'Safety Rate' }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Compassion',
      description: 'We believe in the power of human kindness and the impact one person can make in saving lives.'
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Every donation follows strict medical protocols ensuring donor safety and blood quality.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building strong communities where people help each other in times of need.'
    },
    {
      icon: Target,
      title: 'Excellence',
      description: 'Committed to maintaining the highest standards in blood collection and distribution.'
    }
  ];

  const team = [
    {
      name: 'Suham Pandey',
      role: 'Medical Director',
      image: suhamImage,
      bio: 'Leading medical excellence in blood transfusion and ensuring the highest standards of patient care.'
    },
    {
      name: 'Avinash Upretri',
      role: 'Operations Head',
      image: avinashImage,
      bio: 'Expert in managing blood donation operations and coordinating camps across Nepal.'
    },
    {
      name: 'Shikar Shahi Thakuree',
      role: 'Community Manager',
      image: shikarImage,
      bio: 'Passionate about community engagement and building strong donor networks nationwide.'
    },
    {
      name: 'Bibek Ghimire',
      role: 'Technology Lead',
      image: bibekImage,
      bio: 'Developing innovative digital solutions to connect donors with those in need efficiently.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-1 pt-20">
        {/* Hero Section - Clean & Minimal */}
        <section className="py-24 px-6 text-center bg-gradient-to-b from-background to-muted/30">
          <div className="inline-flex items-center rounded-full border border-border bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Heart className="mr-2 h-4 w-4" />
            About KyuuKhoonn
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
            Saving Lives, One Drop at a Time
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            We are a dedicated platform connecting blood donors with those in need, 
            making blood donation accessible, safe, and impactful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-advanced">
              Join Our Mission
            </button>
            <button className="btn-ghost">
              Learn More
            </button>
          </div>
        </section>

        {/* Stats Section - Subtle & Refined */}
        <section className="py-16 px-6 border-y border-border bg-background">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">{stat.number}</div>
                <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mission & Vision - Spacious Layout */}
        <section className="py-24 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To create a world where no one dies waiting for blood. We bridge the gap 
                between voluntary blood donors and patients, ensuring timely access to 
                safe blood when it's needed most.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">24/7 Emergency Blood Availability</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">100% Safe & Verified Donors</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">Nationwide Network Coverage</span>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold tracking-tight text-foreground mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed mb-8">
                We envision a future where blood transfusion becomes a hassle-free process 
                for every patient, supported by a robust network of committed donors and 
                advanced technology.
              </p>
              <div className="bg-muted/50 border border-border p-6 rounded-xl">
                <Award className="w-10 h-10 text-primary mb-4" />
                <h4 className="text-lg font-semibold text-foreground mb-2">Quality Promise</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Every unit of blood goes through 12 rigorous quality checks to ensure 
                  maximum safety for both donors and recipients.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section - Clean Grid */}
        <section className="py-24 px-6 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Our Values</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                These core principles guide everything we do and define who we are.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-6 text-center transition-all hover:shadow-md hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <value.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section - Minimalist Cards */}
        <section className="py-24 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Meet Our Team</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Passionate professionals dedicated to making a difference in healthcare.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <div key={index} className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-md transition-all">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{member.name}</h3>
                    <p className="text-primary font-medium text-sm mb-3">{member.role}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - High Contrast Premium */}
        <section className="py-24 px-6 bg-foreground text-background">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Ready to Make a Difference?</h2>
            <p className="text-lg text-background/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of heroes who are saving lives through blood donation. 
              Your single donation can save up to 3 lives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-background text-foreground px-8 py-3 rounded-[var(--radius)] font-medium hover:bg-background/90 transition-colors">
                Become a Donor
              </button>
              <button className="border border-background/20 text-background px-8 py-3 rounded-[var(--radius)] font-medium hover:bg-background/10 transition-colors">
                Organize a Camp
              </button>
            </div>
          </div>
        </section>

        {/* Contact Section - Aligned with Contact Page */}
        <section className="py-16 px-6 bg-background border-t border-border">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Emergency Helpline</h3>
              <p className="text-sm text-muted-foreground">+977 981-1212222</p>
              <p className="text-xs text-muted-foreground mt-1">24/7 Available</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Email Us</h3>
              <p className="text-sm text-muted-foreground">help@kyuukhoon.com</p>
              <p className="text-xs text-muted-foreground mt-1">support@kyuukhoon.com</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Headquarters</h3>
              <p className="text-sm text-muted-foreground">Butwal-11, Devinagar</p>
              <p className="text-xs text-muted-foreground mt-1">Rupandehi, Nepal</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;