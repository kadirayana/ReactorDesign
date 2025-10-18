import React, { useEffect, useState } from 'react';

export default function LanguageToggle() {
	const [lang, setLang] = useState(typeof window !== 'undefined' ? (localStorage.getItem('preferredLanguage') || 'tr') : 'tr');

	useEffect(() => {
		function onStorage(e) {
			if (e.key === 'preferredLanguage') setLang(e.newValue || 'tr');
		}
		if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
		return () => { if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
	}, []);

	function toggle() {
		const next = lang === 'tr' ? 'en' : 'tr';
		try { localStorage.setItem('preferredLanguage', next); } catch (e) {}
		setLang(next);
		if (typeof window !== 'undefined') window.location.reload();
	}

	return (
		<button
			onClick={toggle}
			aria-label="Toggle language"
			style={{
				padding: '6px 10px',
				borderRadius: 6,
				border: '1px solid #cfd8dc',
				background: '#fff',
				cursor: 'pointer',
				fontWeight: 600
			}}
		>
			{lang === 'tr' ? 'EN' : 'TR'}
		</button>
	);
}