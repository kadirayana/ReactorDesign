import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import { categories, modules, extraNav, icons } from './modules';

const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width:768px)').matches;

export default function Navbar() {
	// Server render is expanded (desktop default); phones hide it via CSS until the client measures.
	const [collapsed, setCollapsed] = useState(false);
	const router = useRouter();

	useEffect(() => {
		document.body.setAttribute('data-nav-collapsed', String(collapsed));
	}, [collapsed]);

	// Expanded on desktop, collapsed on mobile. Transitions are enabled only after this
	// first measurement so the layout does not animate on page load.
	useEffect(() => {
		// below 1200px the full sidebar squeezes the content; start as an icon rail there
		setCollapsed(isMobile() || window.innerWidth < 1200);
		// two frames: let React commit the collapsed state before transitions are switched on
		let inner;
		const outer = requestAnimationFrame(() => {
			inner = requestAnimationFrame(() => document.body.setAttribute('data-nav-ready', 'true'));
		});
		return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
	}, []);

	useEffect(() => {
		const handleRouteChange = () => { if (isMobile()) setCollapsed(true); };
		router.events?.on?.('routeChangeComplete', handleRouteChange);
		return () => { router.events?.off?.('routeChangeComplete', handleRouteChange); };
	}, [router.events]);

	const toggleMenu = () => setCollapsed(c => !c);

	const NavLink = ({ href, label, icon, isNew }) => {
		const active = router.pathname === href;
		return (
			<li role="none">
				<Link href={href} legacyBehavior>
					<a
						role="menuitem"
						onClick={() => { if (isMobile()) setCollapsed(true); }}
						className={active ? styles.active : undefined}
						aria-current={active ? 'page' : undefined}
						title={collapsed ? label : undefined}
					>
						<span className={styles.navIcon} aria-hidden>{icon}</span>
						<span className={styles.linkText}>{label}</span>
						{isNew && <span className={styles.newBadge}>YENİ</span>}
					</a>
				</Link>
			</li>
		);
	};

	return (
		<>
			{!collapsed && (
				<div className={styles.overlay} onClick={() => setCollapsed(true)} aria-hidden="true" />
			)}

			{/* Mobile top bar */}
			<div className={styles.mobileHeader}>
				<button
					className={styles.mobileToggle}
					onClick={toggleMenu}
					aria-label={collapsed ? 'Menüyü aç' : 'Menüyü kapat'}
				>
					<span className={`${styles.hamburger} ${!collapsed ? styles.hamburgerOpen : ''}`}>
						<span /><span /><span />
					</span>
				</button>
				<Link href="/" legacyBehavior>
					<a className={styles.mobileTitle}>⚗️ Kimya Mühendisliği</a>
				</Link>
			</div>

			<nav className={`${styles.navbar} ${collapsed ? styles.collapsed : styles.open}`} aria-label="Ana gezinme">
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
						aria-label={collapsed ? 'Gezinmeyi genişlet' : 'Gezinmeyi daralt'}
						aria-expanded={!collapsed}
					>
						<span className={`${styles.hamburger} ${!collapsed ? styles.hamburgerOpen : ''}`}>
							<span /><span /><span />
						</span>
					</button>
				</div>

				<ul className={styles.links} role="menu">
					<NavLink href="/" label="Ana Sayfa" icon={icons.home} />
					{categories.map(cat => (
						<React.Fragment key={cat.id}>
							<li role="none" className={styles.groupLabel} aria-hidden>{cat.title}</li>
							{modules.filter(m => m.category === cat.id).map(m => (
								<NavLink key={m.href} href={m.href} label={m.title} icon={m.icon} isNew={m.isNew} />
							))}
						</React.Fragment>
					))}
					<li role="none" className={styles.groupLabel} aria-hidden>Diğer</li>
					{extraNav.map(m => <NavLink key={m.href} href={m.href} label={m.title} icon={m.icon} />)}
				</ul>

				<div className={styles.navFooter}>
					<ThemeToggle className={styles.themeBtn} />
				</div>
			</nav>
		</>
	);
}
