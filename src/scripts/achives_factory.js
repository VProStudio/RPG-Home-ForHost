import ProgressBar from 'progressbar.js';

export default class AchievementsModule {
    constructor() {
        this.cards = new Map();
        this.container = document.querySelector('.achives-list');
        this.initAchives();
    }

    initAchives() {
        this.createCard(`Полировщик`, `Полировали 10 раз!`)
        this.createCard(`Мыльный мастер`, `Вымыли 10 раз!`)
        this.createCard(`Пылесосный чемпион`, `Пылесосили 10 раз!`)
        this.createCard(`Гладильный эксперт`, `Гладили 10 раз!`)
        this.createCard(`Стиральный мастер`, `Стирали 10 раз!`)
        this.createCard(`Ремонтник`, `Отремонтировали 10 раз!`)
        this.createCard(`Косметический эксперт`, `Провели косметический ремонт 10 раз!`)
        this.createCard(`Организатор`, `Организовали пространство 10 раз!`)
        this.createCard(`Санитарный эксперт`, `Провели санитарную обработку 10 раз!`)
        this.createCard(`Чистюля`, `Выполнили ежедневное задание!`)
    }

    createCard(name, description) {
        const card = document.createElement('article');
        card.className = `achive-card ${name.replace(/\s/g, '-')}`;

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';

        card.innerHTML = `
            <h2 class="card-name">${name}</h2>
            <p class="card-description">${description}</p>
        `;

        card.appendChild(progressContainer);
        this.container.appendChild(card);

        const progressBar = new ProgressBar.Line(progressContainer, {
            strokeWidth: 4,
            easing: 'easeInOut',
            color: '#4CAF50',
            trailColor: '#eee',
            trailWidth: 4,
            svgStyle: { width: '100%', height: '100%' }
        });

        progressBar.animate(0.7);

        this.cards.set(name, {
            element: card,
            progressBar: progressBar,
            progress: 0
        });
    }

    updateProgress(name, progress) {
        const cardData = this.cards.get(name);
        if (!cardData) return;
    
        const normalizedProgress = Math.min(progress / 100, 1);
        cardData.progressBar.animate(normalizedProgress, {
            duration: 800
        });
    
        if (progress >= 100) {
            cardData.element.classList.add('unlocked');
            cardData.progressBar.path.setAttribute('stroke', '#FFC107');
        }
    }
}