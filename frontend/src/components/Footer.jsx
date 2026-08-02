import React from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // ✅ UPDATED: Paths now match your actual App.jsx routes
  const quickLinks = [
    { name: "About Us", path: "/about" },
    { name: "Our Mission", path: "/about#mission" },
    { name: "Blood Camps", path: "/camps" },
    { name: "Contact Us", path: "/contact" },
  ];

  const donorResources = [
    { name: "Become a Donor", path: "/register/donor" },
    { name: "Eligibility Criteria", path: "/donor/eligibility" },
    { name: "Donation Process", path: "/donor/process" },
    { name: "Donor Benefits", path: "/donor/benefits" },
  ];

  const hospitalResources = [
    { name: "Partner with Us", path: "/register/facility" },
    { name: "Blood Request", path: "/hospital/request-blood" },
    { name: "Inventory Management", path: "/hospital/inventory" },
    { name: "Emergency Protocol", path: "/hospital/emergency" },
  ];

  const socialLinks = [
    { icon: Facebook, name: "Facebook", url: "#" },
    { icon: Twitter, name: "Twitter", url: "#" },
    { icon: Instagram, name: "Instagram", url: "#" },
    { icon: Linkedin, name: "LinkedIn", url: "#" },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border text-foreground">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">KyuuKhoonn</h2>
                <p className="text-xs text-muted-foreground font-medium">Life Saver Network</p>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Connecting compassionate donors with those in need through advanced blood bank management technology. Together, we save lives.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.url}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-background border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                    aria-label={social.name}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Donors */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-6">
              For Donors
            </h3>
            <ul className="space-y-3">
              {donorResources.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Hospitals & Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-6">
              For Hospitals
            </h3>
            <ul className="space-y-3 mb-8">
              {hospitalResources.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>+977 981-1212222</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>help@kyuukhoon.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>Butwal-11, Devinagar, Nepal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-muted-foreground text-center md:text-left">
              © {currentYear} KyuuKhoonn. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors duration-200">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-foreground transition-colors duration-200">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Donate Button - Minimal & Premium */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          to="/register/donor"
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-medium rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Heart className="w-4 h-4" />
          <span>Donate Now</span>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;