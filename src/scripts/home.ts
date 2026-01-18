const WHATSAPP_URL = 'https://wa.me/79165835566' as const;

function initLeadForm() {
	const leadForm = document.getElementById('lead-form') as HTMLFormElement | null;
	const leadError = document.getElementById('lead-error') as HTMLDivElement | null;
	const leadSuccess = document.getElementById('lead-success') as HTMLDivElement | null;

	if (!leadForm) return;

	function setLeadError(message: string) {
		if (!leadError) return;
		if (!message) {
			leadError.hidden = true;
			leadError.textContent = '';
			return;
		}
		leadError.hidden = false;
		leadError.textContent = message;
	}

	leadForm.addEventListener('submit', (e) => {
		e.preventDefault();
		setLeadError('');

		const fd = new FormData(leadForm);
		const name = String(fd.get('name') ?? '').trim();
		const phone = String(fd.get('phone') ?? '').trim();

		if (!name) return setLeadError('Пожалуйста, укажите имя.');
		if (!phone) return setLeadError('Пожалуйста, укажите телефон.');

		const digits = phone.replace(/\D/g, '');
		if (digits.length < 10) return setLeadError('Проверьте номер телефона (нужно минимум 10 цифр).');

		const message = `Здравствуйте! Меня зовут ${name}. Хочу бесплатную консультацию по бане/сауне. Мой телефон: ${phone}`;
		const url = `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
		window.open(url, '_blank', 'noopener,noreferrer');

		leadForm.reset();
		if (leadSuccess) leadSuccess.hidden = false;
	});
}

function initGalleryLightbox() {
	const galleryRoot = document.querySelector<HTMLElement>('[data-gallery]');
	const lightbox = document.getElementById('lightbox') as HTMLDialogElement | null;
	const lightboxImg = lightbox?.querySelector<HTMLImageElement>('.lightbox__img') ?? null;
	const openButtons = galleryRoot
		? Array.from(galleryRoot.querySelectorAll<HTMLButtonElement>('[data-gallery-open]'))
		: [];

	if (!lightbox || !lightboxImg || openButtons.length === 0) return;

	let currentIndex = 0;

	function getSrcByIndex(i: number) {
		const btn = openButtons[i];
		const img = btn?.querySelector<HTMLImageElement>('img');
		return img?.getAttribute('src') || '';
	}

	function render() {
		const src = getSrcByIndex(currentIndex);
		if (!src) return;
		lightboxImg.src = src;
		lightboxImg.alt = `Фото проекта ${currentIndex + 1}`;
	}

	function openLightbox(i: number) {
		currentIndex = Math.max(0, Math.min(openButtons.length - 1, i));
		render();

		if (typeof lightbox.showModal === 'function') {
			lightbox.showModal();
			return;
		}

		const src = getSrcByIndex(currentIndex);
		if (src) window.open(src, '_blank', 'noopener,noreferrer');
	}

	function closeLightbox() {
		if (typeof lightbox.close === 'function') lightbox.close();
	}

	openButtons.forEach((btn, i) => {
		btn.addEventListener('click', () => openLightbox(i));
	});

	lightbox
		.querySelector<HTMLButtonElement>('[data-lightbox-close]')
		?.addEventListener('click', closeLightbox);

	lightbox.addEventListener('click', (e) => {
		if (e.target === lightbox) closeLightbox();
	});

	lightbox
		.querySelector<HTMLButtonElement>('[data-lightbox-prev]')
		?.addEventListener('click', () => openLightbox(currentIndex - 1));
	lightbox
		.querySelector<HTMLButtonElement>('[data-lightbox-next]')
		?.addEventListener('click', () => openLightbox(currentIndex + 1));

	document.addEventListener('keydown', (e) => {
		if (!lightbox.open) return;
		if (e.key === 'Escape') closeLightbox();
		if (e.key === 'ArrowLeft') openLightbox(currentIndex - 1);
		if (e.key === 'ArrowRight') openLightbox(currentIndex + 1);
	});
}

initLeadForm();
initGalleryLightbox();
