// frontend/src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react"; // Added icons

const WEBSITE_NAME = import.meta.env.VITE_WEBSITE_NAME || "Kyuu Khoon";

export default function Header({ currentUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Blood Availability", path: "/blood-availability" },
  ];

  const authLinks = currentUser
    ? [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Profile", path: "/profile" },
      ]
    : [
        { name: "Login", path: "/login" },
        { name: "Register as Donor", path: "/register/donor" },
        { name: "Register as Facility", path: "/register/facility" },
      ];

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100" 
          : "bg-white/90 backdrop-blur-sm border-b border-gray-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Title */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group"
          >
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <Heart
                className="w-4 h-4 text-white"
                fill="currentColor"
              />
              {/* Animated pulse effect */}
              <div className="absolute inset-0 rounded-xl border-2 border-red-500 animate-ping opacity-20"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-base font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-200 truncate">
                {WEBSITE_NAME}
              </h1>
              <p className="text-[10px] text-gray-500 -mt-0.5 font-medium leading-tight truncate">
                Be a Hero, Save Lives
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActiveLink(link.path)
                    ? "text-red-700 bg-red-50"
                    : "text-gray-700 hover:text-red-600 hover:bg-gray-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Separator */}
            <div className="w-px h-5 bg-gray-300 mx-1"></div>
            
            {/* Auth Links */}
            {authLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  link.name.includes("Register")
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl hover:from-red-700 hover:to-red-800 hover:scale-105"
                    : isActiveLink(link.path)
                    ? "text-red-700 bg-red-50"
                    : "text-gray-700 hover:text-red-600 hover:bg-gray-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg transition-all duration-200 ${
              mobileOpen 
                ? "bg-red-50 text-red-600" 
                : "hover:bg-gray-100 text-gray-600"
            }`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="border-t border-gray-200 pt-3 pb-4 px-2 bg-white/95 backdrop-blur-sm rounded-b-xl shadow-lg">
            {/* Main Navigation Links */}
            <div className="space-y-1 mb-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActiveLink(link.path)
                      ? "bg-red-50 text-red-700 border-l-4 border-red-500"
                      : "text-gray-700 hover:bg-gray-50 hover:text-red-600"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            {/* Auth Links */}
            <div className="space-y-2 border-t border-gray-200 pt-3">
              {authLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    link.name.includes("Register")
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg text-center"
                      : isActiveLink(link.path)
                      ? "bg-red-50 text-red-700 border-l-4 border-red-500"
                      : "text-gray-700 hover:bg-gray-50 hover:text-red-600 text-center"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}