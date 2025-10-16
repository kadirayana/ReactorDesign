import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/Navbar.module.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        Kimya Mühendisliği
      </Link>
      
      <button 
        className={styles.hamburger} 
        onClick={toggleMenu}
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
      >
        <span className={styles.bar}></span>
        <span className={styles.bar}></span>
        <span className={styles.bar}></span>
      </button>

      <div className={`${styles.links} ${isOpen ? styles.active : ""}`}>
        <Link href="/reactor" onClick={handleLinkClick}>Reaktör Tasarımı</Link>
        <Link href="/reactorss" onClick={handleLinkClick}>Özelleştirilebilir Reaktör</Link>
        <Link href="/chemical" onClick={handleLinkClick}>Kimyasal Denge</Link>
        <Link href="/heattransfer" onClick={handleLinkClick}>Isı Transferi</Link>
        <Link href="/heatintegration" onClick={handleLinkClick}>Isı Entegrasyonu</Link>
        <Link href="/dynamics" onClick={handleLinkClick}>Dinamik Simülasyon</Link>
        <Link href="/vaporizer" onClick={handleLinkClick}>Vaporizer Tasarım</Link>
        <Link href="/form" onClick={handleLinkClick}>Deney Formu</Link>
        <Link href="/history" onClick={handleLinkClick}>Geçmiş</Link>
        <Link href="/optimization" onClick={handleLinkClick}>Optimizasyon</Link>
      </div>
    </nav>
  );
}
