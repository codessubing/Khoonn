import React, { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  User,
  MessageSquare,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";
import Header from "../Header";
import Footer from "../Footer";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Replace with your actual API call (e.g., Formspree, EmailJS, or custom backend)
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setIsSubmitting(false);
      setFormData({ name: "", email: "", phone: "", message: "" });
      alert("Thank you! Your message has been sent successfully.");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-1 pt-20">
        {/* HERO SECTION - Minimal & Clean */}
        <section className="py-20 px-6 text-center bg-gradient-to-b from-background to-muted/30">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-300 text-black text-sm font-semibold mb-6 shadow-sm hover:shadow-md transition-all duration-400">
            <Mail className="mr-2 h-4 w-4   text-red-600 animate-pulse" />
            We're here to help
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Reach out to us for any help, queries, or blood-related assistance. 
            Our team is available 24/7 to support you.
          </p>
        </section>

        {/* CONTACT CARDS - Subtle & Refined */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {/* Phone */}
            <div className="bg-card text-card-foreground border border-border rounded-xl p-8 text-center transition-all hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Emergency Helpline</h3>
              <p className="text-muted-foreground">+977 98765 43210</p>
              <p className="text-sm text-muted-foreground mt-1">Available 24/7</p>
            </div>

            {/* Email */}
            <div className="bg-card text-card-foreground border border-border rounded-xl p-8 text-center transition-all hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Us</h3>
              <p className="text-muted-foreground">support@bloodconnect.org</p>
              <p className="text-sm text-muted-foreground mt-1">We reply within 24 hours</p>
            </div>

            {/* Office */}
            <div className="bg-card text-card-foreground border border-border rounded-xl p-8 text-center transition-all hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Head Office</h3>
              <p className="text-muted-foreground">Bhalwari, Rupandehi</p>
              <p className="text-sm text-muted-foreground mt-1">Nepal - 36500</p>
            </div>
          </div>
        </section>

        {/* CONTACT FORM & INFO - Spacious & Accessible */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
            
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-4">Send Us a Message</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Have any questions? We're always here to help you with blood donation, 
                  camp organization, or support queries.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-foreground">
                  <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">+977 9800000000</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-foreground">
                  <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">codessubingg@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-foreground">
                  <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">Bhalwari, Rupandehi</p>
                  </div>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex gap-4 pt-4">
                {[Instagram, Facebook, Linkedin, Globe].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    aria-label="Social media link"
                    className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* FORM - Clean & Minimal */}
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input  
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input  
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input  
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="mr-2 w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* MAP SECTION - Refined */}
        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
              <iframe
                title="Office Location"
                className="w-full h-[400px] grayscale hover:grayscale-0 transition-all duration-500"
                src="https://maps.google.com/maps?q=Bhalwari,+Rupandehi&t=&z=15&ie=UTF8&iwloc=&output=embed"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;