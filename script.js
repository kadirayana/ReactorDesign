(function(){
	const sidebar = document.querySelector('.sidebar');
	const toggle = document.querySelector('.toggle-btn');

	if(!sidebar || !toggle) return;

	// Initialize aria-expanded to reflect current data-collapsed
	toggle.setAttribute('aria-expanded', String(sidebar.getAttribute('data-collapsed') !== 'true'));

	// Desktop collapse/expand toggle
	toggle.addEventListener('click', () => {
		// On small screens, open/close overlay instead of collapsing
		if(window.matchMedia('(max-width:640px)').matches){
			const isOpen = sidebar.classList.toggle('open');
			toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
			return;
		}

		const collapsed = sidebar.getAttribute('data-collapsed') === 'true';
		const newCollapsed = !collapsed;
		sidebar.setAttribute('data-collapsed', String(newCollapsed));
		// aria-expanded should reflect whether the menu is expanded (not collapsed)
		toggle.setAttribute('aria-expanded', String(!newCollapsed));
	});
})();
