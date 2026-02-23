import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/Navbar.module.css";

// SVG Icons as components for clean code
const icons = {
	reactor: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
			<path d="M9 3h6v8l4 7H5l4-7V3z" />
			<path d="M9 3h6" />
			<circle cx="13" cy="15" r="1" fill="currentColor" />
			<circle cx="10" cy="17" r="0.8" fill="currentColor" />
		</svg>
	),
	customReactor: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="6" width="18" height="12" rx="2" />
			<path d="M7 6V4M17 6V4M7 18v2M17 18v2" />
			<circle cx="12" cy="12" r="3" />
			<path d="M12 9v1M12 14v1M9 12h1M14 12h1" />
		</svg>
	),
	chemical: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
			<path d="M6 3v6l-2 8a2 2 0 002 2h12a2 2 0 002-2l-2-8V3" />
			<path d="M6 3h12" />
			<path d="M8 14h8" />
		</svg>
	),
	heat: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
			<path d="M12 2a5 5 0 0 0-1 9.9V18h2V11.9A5 5 0 0 0 12 2z" />
			<rect x="10" y="18" width="4" height="4" rx="1" />
		</svg>
	),
	integration: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
			<path d="M3 12h4l3-9 4 18 3-9h4" />
		</svg>
	),
	dynamics: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
			<path d="M22 12h-4l-3 9L11 3l-3 9H4" />
		</svg>
	),
	vaporizer: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
			<path d="M8 16c0 2.2 1.8 4 4 4s4-1.8 4-4" />
			<path d="M12 12V4" />
			<path d="M8 8c-2 0-4 1-4 4s2 4 4 4" />
			<path d="M16 8c2 0 4 1 4 4s-2 4-4 4" />
		</svg>
	),
	optimize: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10" />
			<circle cx="12" cy="12" r="6" />
			<circle cx="12" cy="12" r="2" />
		</svg>
	),
	history: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="10" />
			<polyline points="12 6 12 12 16 14" />
		</svg>
	),
	home: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
			<path d="M3 12l9-9 9 9" />
			<path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
		</svg>
	),
};

export default function Navbar() {
	const [collapsed, setCollapsed] = useState(true);
	const router = useRouter();

	useEffect(() => {
		if (typeof document !== 'undefined') {
			document.body.setAttribute('data-nav-collapsed', String(collapsed));
		}
	}, [collapsed]);

	useEffect(() => {
		const handleRouteChange = () => {
			if (typeof window !== 'undefined' && window.matchMedia('(max-width:768px)').matches) {
				setCollapsed(true);
				document.body.setAttribute('data-nav-collapsed', 'true');
			}
		};
		router.events?.on?.('routeChangeComplete', handleRouteChange);
		return () => { router.events?.off?.('routeChangeComplete', handleRouteChange); };
	}, [router.events]);

	// Initialize to expanded on desktop, collapsed on mobile
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const isDesktop = window.matchMedia('(min-width:769px)').matches;
			setCollapsed(!isDesktop);
		}
	}, []);

	const toggleMenu = () => {
		const nextCollapsedState = !collapsed;
		setCollapsed(nextCollapsedState);
		if (typeof document !== 'undefined') {
			document.body.setAttribute('data-nav-collapsed', String(nextCollapsedState));
		}
	};

	const navItems = [
		{ href: '/reactor', label: 'Reaktör Tasarımı', icon: icons.reactor },
		{ href: '/reactorss', label: 'Özelleştirilebilir Reaktör', icon: icons.customReactor },
		{ href: '/chemical', label: 'Kimyasal Denge', icon: icons.chemical },
		{ href: '/heattransfer', label: 'Isı Transferi', icon: icons.heat },
		{ href: '/heatintegration', label: 'Isı Entegrasyonu', icon: icons.integration },
		{ href: '/dynamics', label: 'Dinamik Simülasyon', icon: icons.dynamics },
		{ href: '/vaporizer', label: 'Vaporizer Tasarım', icon: icons.vaporizer },
		{ href: '/optimization', label: 'Optimizasyon', icon: icons.optimize },
		{ href: '/history', label: 'Geçmiş', icon: icons.history },
	];


	return (
		<>
			{/* Mobile overlay backdrop */}
			{!collapsed && (
				<div
					className={styles.overlay}
					onClick={() => { setCollapsed(true); document.body.setAttribute('data-nav-collapsed', 'true'); }}
					aria-hidden="true"
				/>
			)}

			{/* Mobile top bar */}
			<div className={styles.mobileHeader}>
				<button
					className={styles.mobileToggle}
					onClick={toggleMenu}
					aria-label={collapsed ? 'Menüyü Aç' : 'Menüyü Kapat'}
				>
					<span className={`${styles.hamburger} ${!collapsed ? styles.hamburgerOpen : ''}`}>
						<span /><span /><span />
					</span>
				</button>
				<Link href="/" legacyBehavior>
					<a className={styles.mobileTitle}>⚗️ Kimya Mühendisliği</a>
				</Link>
			</div>

			{/* Sidebar navigation */}
			<nav className={`${styles.navbar} ${collapsed ? styles.collapsed : styles.open}`} aria-label="Main navigation">
				<div className={styles.brand}>
					<Link href="/" legacyBehavior>
						<a className={styles.logo}>
							<span className={styles.logoEmoji}>⚗️</span>
							<span className={styles.logoText}>Kimya Mühendisliği</span>
						</a>
					</Link>

					<button
						className={styles.toggle}
						onClick={toggleMenu}
						aria-label={collapsed ? 'Navigasyonu Aç' : 'Navigasyonu Daralt'}
						aria-expanded={!collapsed}
					>
						<span className={`${styles.hamburger} ${!collapsed ? styles.hamburgerOpen : ''}`}>
							<span /><span /><span />
						</span>
					</button>
				</div>

				<ul className={styles.links} role="menu">
					{navItems.map(item => {
						const active = router.pathname === item.href;
						return (
							<li key={item.href} role="none">
								<Link href={item.href} legacyBehavior>
									<a
										role="menuitem"
										onClick={() => {
											if (typeof window !== 'undefined' && window.matchMedia('(max-width:768px)').matches) {
												setCollapsed(true);
											}
										}}
										className={active ? styles.active : undefined}
										aria-current={active ? 'page' : undefined}
									>
										<span className={styles.navIcon} aria-hidden>{item.icon}</span>
										<span className={styles.linkText}>{item.label}</span>
									</a>
								</Link>
							</li>
						);
					})}
				</ul>


			</nav>
		</>
	);
}
