import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/Navbar.module.css";

export default function Navbar() {
	const [collapsed, setCollapsed] = useState(false);
	const router = useRouter();

	// INIT: use router.locale for SSR-consistent initial value (no window/localStorage access)
	const [lang, setLang] = useState(() => {
		return (typeof window === 'undefined') ? (typeof navigator !== 'undefined' && navigator.language?.startsWith('tr') ? 'tr' : 'en') : (router.locale || 'tr');
	});

	// keep body attribute in separate effect (unchanged behavior)
	useEffect(() => {
		if (typeof document !== 'undefined') {
			document.body.setAttribute('data-nav-collapsed', String(collapsed));
		}
	}, [collapsed]);

	// CLIENT-SIDE: on mount sync preferredLanguage from localStorage (safe — runs only client-side)
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const preferred = localStorage.getItem('preferredLanguage');
		if (preferred && preferred !== router.locale) {
			// replace to preferred locale on client only (avoid server-side navigation)
			router.replace(router.asPath, undefined, { locale: preferred }).catch(() => {});
			setLang(preferred);
		} else {
			// ensure localStorage initialized
			localStorage.setItem('preferredLanguage', router.locale || lang || 'tr');
			setLang(router.locale || lang || 'tr');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // run once on client mount

	// sync localStorage when lang changes (client-side)
	useEffect(() => {
		if (typeof window !== 'undefined' && lang) {
			localStorage.setItem('preferredLanguage', lang);
		}
	}, [lang]);

	// language toggle: base decision on router.locale (SSR-consistent)
	const handleLanguageToggle = (e) => {
		e?.preventDefault?.();
		const next = (router.locale === 'tr' || lang === 'tr') ? 'en' : 'tr';
		setLang(next);
		localStorage.setItem('preferredLanguage', next);
		router.push(router.asPath, undefined, { locale: next }).catch(() => {});
	};

	// close overlay on route change (mobile)
	useEffect(() => {
		const handleRouteChange = () => {
			// on small viewports when route changes, close overlay for UX
			if (typeof window !== 'undefined' && window.matchMedia('(max-width:640px)').matches) {
				setCollapsed(true);
				document.body.setAttribute('data-nav-collapsed', 'true');
			}
		};
		router.events?.on?.('routeChangeComplete', handleRouteChange);
		return () => { router.events?.off?.('routeChangeComplete', handleRouteChange); };
	}, [router.events]);

	const toggleMenu = () => {
		// On mobile we toggle overlay class; on desktop we toggle collapsed width.
		if (typeof window !== 'undefined' && window.matchMedia('(max-width:640px)').matches) {
			// mobile: open/close by toggling attribute to false/true
			const isOpen = !(document.body.getAttribute('data-nav-collapsed') === 'false');
			// when open we set data-nav-collapsed="false" so CSS shows overlay
			document.body.setAttribute('data-nav-collapsed', isOpen ? 'false' : 'true');
			// maintain collapsed state boolean for styling consistency
			setCollapsed(!isOpen ? false : true);
			return;
		}
		setCollapsed(c => {
			const next = !c;
			if (typeof document !== 'undefined') document.body.setAttribute('data-nav-collapsed', String(next));
			return next;
		});
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

	return (
		<nav className={`${styles.navbar} ${collapsed ? styles.collapsed : ''}`} aria-label="Main navigation">
			<div className={styles.brand}>
				{/* Use legacyBehavior to render a real <a> so external legacy scripts expecting anchors work reliably */}
				<Link legacyBehavior href="/">
					<a className={styles.logo}>
						{/* replaced emoji with project logo from public/logo.png */}
						<img src="/logo.png" alt="Kimya Mühendisliği" className={styles.logoImg} />
						<span className={styles.logoText}>Kimya Mühendisliği</span>
					</a>
				</Link>

				{/* ADDED: language toggle button (renders based on router.locale for SSR consistency) */}
				<button
					onClick={handleLanguageToggle}
					aria-label="Toggle language"
					title={router.locale === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
					style={{
						marginLeft: 8,
						marginRight: 8,
						background: 'transparent',
						border: '1px solid rgba(255,255,255,0.12)',
						color: '#fff',
						padding: '6px 8px',
						borderRadius: 6,
						cursor: 'pointer',
						fontWeight: 600,
						fontSize: 13,
					}}
				>
					{router.locale === 'tr' ? 'EN' : 'TR'}
				</button>

				<button
					className={styles.toggle}
					onClick={toggleMenu}
					aria-label={collapsed ? 'Open navigation' : 'Collapse navigation'}
					aria-expanded={!collapsed}
				>
					<span className={styles.toggleBar} />
				</button>
			</div>

			<ul className={styles.links} role="menu">
				{navItems.map(item => {
					const active = router.pathname === item.href;
					// render Link with legacyBehavior -> anchor inside for predictable DOM
					return (
						<li key={item.href} role="none">
							<Link legacyBehavior href={item.href}>
								<a
									role="menuitem"
									onClick={() => {
										// when user clicks link on mobile, close overlay
										if (typeof window !== 'undefined' && window.matchMedia('(max-width:640px)').matches) {
											document.body.setAttribute('data-nav-collapsed', 'true');
											setCollapsed(true);
										}
									}}
									className={styles.link + (active ? ` ${styles.active}` : '')}
									aria-current={active ? 'page' : undefined}
								>
									{/* icon placeholder can be extended */}
									<span className={styles.logoIcon} aria-hidden>•</span>
									<span className={styles.linkText}>{item.label}</span>
								</a>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
