import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LanguageToggle from "./LanguageToggle";
import styles from "../styles/Navbar.module.css";

// Statik dışa aktarma (output: 'export') ile uyumluluk için
// Next.js'in dil yönlendirme (i18n) özellikleri kaldırıldı.

export default function Navbar() {
	const [collapsed, setCollapsed] = useState(false);
	const router = useRouter();

	// Menünün daraltılıp genişletilmesi için body etiketini günceller
	useEffect(() => {
		if (typeof document !== 'undefined') {
			document.body.setAttribute('data-nav-collapsed', String(collapsed));
		}
	}, [collapsed]);

	// Sayfa değiştiğinde mobil menüyü kapatır
	useEffect(() => {
		const handleRouteChange = () => {
			if (typeof window !== 'undefined' && window.matchMedia('(max-width:640px)').matches) {
				setCollapsed(true);
				document.body.setAttribute('data-nav-collapsed', 'true');
			}
		};
		router.events?.on?.('routeChangeComplete', handleRouteChange);
		return () => { router.events?.off?.('routeChangeComplete', handleRouteChange); };
	}, [router.events]);

	const toggleMenu = () => {
		const nextCollapsedState = !collapsed;
		setCollapsed(nextCollapsedState);
		if (typeof document !== 'undefined') {
			document.body.setAttribute('data-nav-collapsed', String(nextCollapsedState));
		}
	};

	const navItems = [
		{ href: '/reactor', label: 'Reaktör Tasarımı' },
		{ href: '/reactorss', label: 'Özelleştirilebilir Reaktör' },
		{ href: '/chemical', label: 'Kimyasal Denge' },
		{ href: '/heattransfer', label: 'Isı Transferi' },
		{ href: '/heatintegration', label: 'Isı Entegrasyonu' },
		{ href: '/dynamics', label: 'Dinamik Simülasyon' },
		{ href: '/vaporizer', label: 'Vaporizer Tasarım' },
		{ href: '/optimization', label: 'Optimizasyon' },
		{ href: '/history', label: 'Geçmiş' },
	];

	// Logo dosyasının yolu, `next.config.js` dosyasındaki `basePath`'e göre
	// Next.js tarafından otomatik olarak ayarlanacaktır.
	const logoPath = "/logo.png";

	return (
		<nav className={`${styles.navbar} ${collapsed ? styles.collapsed : ''}`} aria-label="Main navigation">
			<div className={styles.brand}>
				<Link href="/" legacyBehavior>
					<a className={styles.logo}>
						<img src={logoPath} alt="Kimya Mühendisliği" className={styles.logoImg} />
						<span className={styles.logoText}>Kimya Mühendisliği</span>
					</a>
				</Link>

				<button
					className={styles.toggle}
					onClick={toggleMenu}
					aria-label={collapsed ? 'Navigasyonu Aç' : 'Navigasyonu Daralt'}
					aria-expanded={!collapsed}
				>
					<span className={styles.toggleBar} />
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
										if (typeof window !== 'undefined' && window.matchMedia('(max-width:640px)').matches) {
											setCollapsed(true);
										}
									}}
									className={styles.link + (active ? ` ${styles.active}` : '')}
									aria-current={active ? 'page' : undefined}
								>
									<span className={styles.logoIcon} aria-hidden>•</span>
									<span className={styles.linkText}>{item.label}</span>
								</a>
							</Link>
						</li>
					);
				})}
			</ul>

			<div className={styles.navFooter} style={{ padding: '12px', borderTop: '1px solid #e9ecef', marginTop: 'auto' }}>
				<LanguageToggle />
			</div>
		</nav>
	);
}
